import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchPrintJob } from '../../services/api';

type PrintResult = {
  documentId?: string;
  token: string;
  status: 'ready' | 'expired' | string;
  settings?: {
    pages: number;
    copies: number;
    colorMode: 'bw' | 'color';
  };
  message: string;
  expiresAt?: string;
};

type QueueStatus = 'pending' | 'printing' | 'done' | 'failed' | 'expired';

type QueueJob = {
  id: string;
  token: string;
  status: QueueStatus;
  scannedAt: string;
  message: string;
  documentId?: string;
  pages: number;
  copies: number;
  colorMode: 'bw' | 'color';
};

function extractToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.includes('/print/')) {
    const after = trimmed.split('/print/').pop() ?? '';
    return after.split('?')[0].trim();
  }

  return trimmed;
}

function mapStatus(status: PrintResult['status']): QueueStatus {
  if (status === 'expired') {
    return 'expired';
  }
  if (status === 'ready') {
    return 'pending';
  }
  return 'failed';
}

function statusClassName(status: QueueStatus): string {
  if (status === 'done') return 'queue-badge queue-badge-done';
  if (status === 'printing') return 'queue-badge queue-badge-printing';
  if (status === 'pending') return 'queue-badge queue-badge-pending';
  if (status === 'expired') return 'queue-badge queue-badge-expired';
  return 'queue-badge queue-badge-failed';
}

export function TokenLookup() {
  const scannerRegionId = 'shop-dashboard-scanner-region';
  const scannerRef = useRef<any | null>(null);
  const scannerGuardRef = useRef(false);
  const tokenInputRef = useRef<HTMLInputElement | null>(null);

  const [token, setToken] = useState('');
  const [result, setResult] = useState<PrintResult | null>(null);
  const [queue, setQueue] = useState<QueueJob[]>([]);
  const [activeJob, setActiveJob] = useState<QueueJob | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerEnabled, setScannerEnabled] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [scannerMessage, setScannerMessage] = useState('Scanner paused. Use Start Scanner.');
  const [liveMessage, setLiveMessage] = useState('');

  const isExpiredError = error?.toLowerCase().includes('expired') ?? false;
  const todaysStats = useMemo(() => {
    const todayDate = new Date().toDateString();
    const todaysJobs = queue.filter((job) => new Date(job.scannedAt).toDateString() === todayDate);
    const pagesPrinted = todaysJobs
      .filter((job) => job.status === 'done')
      .reduce((sum, job) => sum + job.pages * job.copies, 0);

    return {
      jobs: todaysJobs.length,
      pagesPrinted,
    };
  }, [queue]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      return;
    }

    try {
      await scanner.stop();
    } catch {
      // Scanner might already be stopped.
    }

    try {
      await scanner.clear();
    } catch {
      // Ignore cleanup errors.
    }

    scannerRef.current = null;
  }, []);

  const upsertQueueItem = useCallback((job: QueueJob) => {
    setQueue((prev) => [job, ...prev.filter((q) => q.token !== job.token)].slice(0, 10));
  }, []);

  const handleFetch = useCallback(
    async (rawToken: string, source: 'manual' | 'scanner') => {
      const normalizedToken = extractToken(rawToken);
      if (!normalizedToken) {
        return;
      }

      setToken(normalizedToken);
      setLoading(true);
      setError(null);
      setLiveMessage('Fetching print job...');

      try {
        const data = (await fetchPrintJob(normalizedToken)) as PrintResult;
        const queueItem: QueueJob = {
          id: `${Date.now()}-${normalizedToken.slice(0, 8)}`,
          token: data.token,
          documentId: data.documentId,
          status: mapStatus(data.status),
          scannedAt: new Date().toISOString(),
          message: data.message,
          pages: data.settings?.pages ?? 1,
          copies: data.settings?.copies ?? 1,
          colorMode: data.settings?.colorMode ?? 'bw',
        };

        setResult(data);
        upsertQueueItem(queueItem);
        setActiveJob(queueItem);
        setDrawerOpen(true);
        setScannerMessage(
          source === 'scanner'
            ? 'QR detected and job fetched successfully.'
            : 'Token fetched successfully.',
        );
        setLiveMessage('Print job ready. Preview drawer opened.');
      } catch (lookupError) {
        setResult(null);
        const message = lookupError instanceof Error ? lookupError.message : 'Lookup failed';
        setError(message);

        const failedStatus: QueueStatus = message.toLowerCase().includes('expired')
          ? 'expired'
          : 'failed';

        upsertQueueItem({
          id: `${Date.now()}-${normalizedToken.slice(0, 8)}`,
          token: normalizedToken,
          status: failedStatus,
          scannedAt: new Date().toISOString(),
          message,
          pages: 1,
          copies: 1,
          colorMode: 'bw',
        });

        setScannerMessage(message);
        setLiveMessage(message);
      } finally {
        setLoading(false);
      }
    },
    [upsertQueueItem],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleFetch(token, 'manual');
  }

  useEffect(() => {
    if (!scannerEnabled || scannerPaused) {
      void stopScanner();
      return;
    }

    let disposed = false;

    void (async () => {
      try {
        const module = await import('html5-qrcode');
        const Html5QrcodeClass = module.Html5Qrcode;
        const scanner = new Html5QrcodeClass(scannerRegionId);
        scannerRef.current = scanner;

        setScannerMessage('Scanner ready. Point camera to customer QR.');

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1,
          },
          async (decodedText: string) => {
            if (disposed || scannerGuardRef.current) {
              return;
            }

            scannerGuardRef.current = true;
            setScannerMessage('QR detected, fetching...');
            await handleFetch(decodedText, 'scanner');

            setTimeout(() => {
              scannerGuardRef.current = false;
            }, 1100);
          },
          () => {
            // Ignore frame decode errors while scanning.
          },
        );
      } catch (scannerError) {
        if (disposed) {
          return;
        }

        setScannerMessage(
          scannerError instanceof Error
            ? scannerError.message
            : 'Camera not available. Use token paste fallback.',
        );
      }
    })();

    return () => {
      disposed = true;
      void stopScanner();
    };
  }, [handleFetch, scannerEnabled, scannerPaused, stopScanner]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        tokenInputRef.current?.focus();
      }

      if (event.key === 'Escape' && drawerOpen) {
        event.preventDefault();
        setDrawerOpen(false);
      }

      if (event.code === 'Space' && drawerOpen) {
        const activeElementTag = (document.activeElement as HTMLElement | null)?.tagName;
        if (activeElementTag === 'INPUT' || activeElementTag === 'TEXTAREA') {
          return;
        }

        event.preventDefault();
        if (activeJob) {
          setQueue((prev) =>
            prev.map((job) =>
              job.token === activeJob.token ? { ...job, status: 'done', message: 'Printed and deleted.' } : job,
            ),
          );
          setActiveJob((prev) =>
            prev ? { ...prev, status: 'done', message: 'Printed and deleted.' } : prev,
          );
          setLiveMessage('Printed successfully. File deleted.');
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeJob, drawerOpen]);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  return (
    <>
      <div className="shop-totals-row">
        <div className="shop-stat-card">
          <span>Jobs today</span>
          <strong>{todaysStats.jobs}</strong>
        </div>
        <div className="shop-stat-card">
          <span>Pages printed today</span>
          <strong>{todaysStats.pagesPrinted}</strong>
        </div>
        <label className="shop-toggle">
          <input
            type="checkbox"
            checked={scannerPaused}
            onChange={(event) => setScannerPaused(event.target.checked)}
          />
          <span>Pause Scanner</span>
        </label>
      </div>

      <div className="shop-layout">
        <section className="card shop-panel">
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>Find Print Job</h2>

          <div className="scanner-box-wrap">
            <div id={scannerRegionId} className="scanner-box" />
            {!scannerEnabled ? (
              <button
                type="button"
                className="scanner-overlay-btn"
                onClick={() => setScannerEnabled(true)}
              >
                Start Scanner
              </button>
            ) : null}
          </div>

          <p className="muted" aria-live="polite">
            {scannerMessage}
          </p>

          <form onSubmit={onSubmit} className="shop-token-row">
            <input
              ref={tokenInputRef}
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste print token or scan QR"
              minLength={10}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Fetching...' : 'Fetch'}
            </button>
          </form>

          <p className="muted" style={{ marginBottom: 0 }}>
            Tip: Ctrl+K focus input, Enter fetch, Space print, Esc close preview.
          </p>

          {error ? <p className={isExpiredError ? 'status-error' : 'status-warning'}>{error}</p> : null}
          {result ? (
            <p className="status-success" style={{ marginBottom: 0 }}>
              Last job: {result.status}
              {result.expiresAt ? ` | Expires ${new Date(result.expiresAt).toLocaleTimeString()}` : ''}
            </p>
          ) : null}
        </section>

        <aside className="card shop-panel">
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>Active Print Queue</h3>
          {queue.length === 0 ? (
            <p className="muted" style={{ marginTop: 0 }}>
              No jobs yet. Start scanner or paste a token.
            </p>
          ) : null}

          <ul className="queue-list">
            {queue.map((job) => (
              <li key={job.id} className="queue-item">
                <div>
                  <div className="queue-title">{job.documentId ? `Job ${job.documentId.slice(0, 8)}` : 'Print Job'}</div>
                  <div className="queue-subtitle">
                    {job.pages} pages • {job.copies} copies • {new Date(job.scannedAt).toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
                  <span className={statusClassName(job.status)}>{job.status}</span>
                  <button
                    type="button"
                    className="queue-view-btn"
                    onClick={() => {
                      setActiveJob(job);
                      setDrawerOpen(true);
                    }}
                  >
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className={`drawer-backdrop ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />

      <aside className={`preview-drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="preview-drawer-head">
          <h3 style={{ margin: 0 }}>Print Preview</h3>
          <button type="button" onClick={() => setDrawerOpen(false)} className="cta-link cta-secondary">
            Close
          </button>
        </div>

        {activeJob ? (
          <>
            <div className="preview-pane">
              <div>
                <strong>Token</strong>
                <p style={{ margin: '6px 0 0', wordBreak: 'break-all' }}>{activeJob.token}</p>
              </div>
              <div className="preview-meta-row">
                <span>{activeJob.pages} pages</span>
                <span>{activeJob.copies} copies</span>
                <span>{activeJob.colorMode}</span>
              </div>
            </div>

            <div className="preview-actions">
              <button
                type="button"
                onClick={() => {
                  setQueue((prev) =>
                    prev.map((job) =>
                      job.token === activeJob.token
                        ? { ...job, status: 'done', message: 'Printed and deleted.' }
                        : job,
                    ),
                  );
                  setActiveJob((prev) =>
                    prev ? { ...prev, status: 'done', message: 'Printed and deleted.' } : prev,
                  );
                  setLiveMessage('Printed. File deleted.');
                }}
              >
                Print
              </button>
              <button type="button" className="cta-link cta-secondary" onClick={() => setDrawerOpen(false)}>
                Cancel
              </button>
            </div>

            <p className="muted" style={{ marginBottom: 0 }}>
              This file will be auto-deleted after printing. No file content is kept in shop logs.
            </p>
          </>
        ) : (
          <p className="muted">No active job selected.</p>
        )}
      </aside>

      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
    </>
  );
}
