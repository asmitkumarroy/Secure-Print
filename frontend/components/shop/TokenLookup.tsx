import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { completePrintJob, executePrintJob, fetchPrintJob, getPdfPreviewUrl, getPrintStatus } from '../../services/api';

type PrintResult = {
  documentId?: string;
  token: string;
  status: 'ready' | 'printing' | 'completed' | 'expired' | 'failed' | string;
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
  if (status === 'completed') {
    return 'done';
  }

  if (status === 'printing') {
    return 'printing';
  }

  if (status === 'failed') {
    return 'failed';
  }

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
  const [scannerPaused, setScannerPaused] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [scannerMessage, setScannerMessage] = useState('Scanner paused. Click Start Scanner.');
  const [liveMessage, setLiveMessage] = useState('');
  const [previewPages, setPreviewPages] = useState(1);
  const [previewCopies, setPreviewCopies] = useState(1);
  const [previewColorMode, setPreviewColorMode] = useState<'bw' | 'color'>('bw');
  const [printing, setPrinting] = useState(false);
  const [testSavePdfMode, setTestSavePdfMode] = useState(false);
  const [previewBlockedMessage, setPreviewBlockedMessage] = useState<string | null>(null);

  const isExpiredError = error?.toLowerCase().includes('expired') ?? false;
  const isPrintAssociationError =
    error?.toLowerCase().includes('print-capable') ||
    error?.toLowerCase().includes('default print') ||
    error?.toLowerCase().includes('no application is associated') ||
    false;
  const todaysStats = useMemo(() => {
    const todayDate = new Date().toDateString();
    const todaysJobs = queue.filter((job) => new Date(job.scannedAt).toDateString() === todayDate);
    const pagesPrinted = todaysJobs
      .filter((job) => job.status === 'done')
      .reduce((sum, job) => sum + job.pages * job.copies, 0);

    return {
      jobs: todaysJobs.length,
      pagesPrinted,
      errors: todaysJobs.filter((job) => job.status === 'expired' || job.status === 'failed').length,
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

  const finalizePrinted = useCallback(
    (jobToken: string, message: string) => {
      setQueue((prev) =>
        prev.map((job) =>
          job.token === jobToken
            ? {
              ...job,
              status: 'done',
              message,
            }
            : job,
        ),
      );

      setActiveJob((prev) => (prev && prev.token === jobToken ? { ...prev, status: 'done', message } : prev));
    },
    [],
  );

  const runPrint = useCallback(
    async (job: QueueJob, settings: { pages: number; copies: number; colorMode: 'bw' | 'color' }) => {
      if (job.status === 'expired' || job.status === 'done') {
        const blockedMessage = job.status === 'expired' ? 'Token expired. Generate a new token.' : 'Token already used.';
        setError(blockedMessage);
        setLiveMessage(blockedMessage);
        return;
      }

      setPrinting(true);
      setError(null);

      setQueue((prev) =>
        prev.map((queued) =>
          queued.token === job.token
            ? {
              ...queued,
              status: 'printing',
              pages: settings.pages,
              copies: settings.copies,
              colorMode: settings.colorMode,
              message: 'Printing in progress...',
            }
            : queued,
        ),
      );

      try {
        const latestStatus = await getPrintStatus(job.token);
        const mappedStatus = mapStatus(latestStatus.status);

        if (mappedStatus === 'expired' || mappedStatus === 'done' || mappedStatus === 'failed') {
          const blockedMessage =
            mappedStatus === 'expired'
              ? 'Token expired before print.'
              : mappedStatus === 'done'
                ? 'Token already printed.'
                : latestStatus.message;

          setQueue((prev) =>
            prev.map((queued) =>
              queued.token === job.token
                ? {
                  ...queued,
                  status: mappedStatus,
                  message: blockedMessage,
                }
                : queued,
            ),
          );

          setActiveJob((prev) =>
            prev && prev.token === job.token
              ? {
                ...prev,
                status: mappedStatus,
                message: blockedMessage,
              }
              : prev,
          );

          throw new Error(blockedMessage);
        }

        const printResponse = (await executePrintJob({
          token: job.token,
          pages: settings.pages,
          copies: settings.copies,
          colorMode: settings.colorMode,
          testSaveAsPdf: testSavePdfMode,
        })) as { savedPath?: string };

        finalizePrinted(job.token, 'Printed and deleted.');
        setActiveJob((prev) =>
          prev && prev.token === job.token
            ? {
              ...prev,
              pages: settings.pages,
              copies: settings.copies,
              colorMode: settings.colorMode,
            }
            : prev,
        );
        setLiveMessage(
          testSavePdfMode
            ? printResponse.savedPath
              ? `Test mode: PDF saved at ${printResponse.savedPath}`
              : 'Test mode: PDF saved locally on backend (Microsoft Print to PDF path).'
            : 'Printed successfully. File deleted.',
        );
      } catch (printError) {
        const printMessage = printError instanceof Error ? printError.message : 'Print failed';
        setError(printMessage);
        setQueue((prev) =>
          prev.map((queued) =>
            queued.token === job.token ? { ...queued, status: 'failed', message: printMessage } : queued,
          ),
        );
        setLiveMessage(printMessage);
      } finally {
        setPrinting(false);
      }
    },
    [finalizePrinted, testSavePdfMode],
  );

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
        setPreviewPages(queueItem.pages);
        setPreviewCopies(queueItem.copies);
        setPreviewColorMode(queueItem.colorMode);
        setDrawerOpen(true);
        setScannerMessage(
          source === 'scanner'
            ? 'QR detected and job fetched successfully.'
            : 'Token fetched successfully.',
        );
        setLiveMessage('Print job ready. Preview drawer opened.');

        if (source === 'scanner' && autoPrint) {
          setQueue((prev) =>
            prev.map((job) =>
              job.token === queueItem.token
                ? { ...job, status: 'printing', message: 'Auto-print in progress...' }
                : job,
            ),
          );
          setLiveMessage('Auto-print started.');
          try {
            const printResponse = (await executePrintJob({
              token: queueItem.token,
              pages: queueItem.pages,
              copies: queueItem.copies,
              colorMode: queueItem.colorMode,
              testSaveAsPdf: testSavePdfMode,
            })) as { savedPath?: string };
            finalizePrinted(queueItem.token, 'Printed via auto-print. File deleted.');
            setLiveMessage(
              testSavePdfMode && printResponse.savedPath
                ? `Auto-print saved PDF at ${printResponse.savedPath}`
                : 'Auto-print completed.',
            );
          } catch (printError) {
            const printMessage = printError instanceof Error ? printError.message : 'Auto-print failed';
            setQueue((prev) =>
              prev.map((job) =>
                job.token === queueItem.token ? { ...job, status: 'failed', message: printMessage } : job,
              ),
            );
            setError(printMessage);
            setLiveMessage(printMessage);
          }
        }
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
    [autoPrint, finalizePrinted, testSavePdfMode, upsertQueueItem],
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
    if (!activeJob) {
      return;
    }

    setPreviewPages(activeJob.pages);
    setPreviewCopies(activeJob.copies);
    setPreviewColorMode(activeJob.colorMode);
  }, [activeJob]);

  useEffect(() => {
    if (!drawerOpen || !activeJob) {
      setPreviewBlockedMessage(null);
      return;
    }

    let cancelled = false;

    const pollStatus = async () => {
      try {
        const status = await getPrintStatus(activeJob.token);
        if (cancelled) {
          return;
        }

        const mappedStatus = mapStatus(status.status);
        setQueue((prev) =>
          prev.map((job) =>
            job.token === activeJob.token
              ? {
                ...job,
                status: mappedStatus,
                message: status.message,
              }
              : job,
          ),
        );

        setActiveJob((prev) =>
          prev && prev.token === activeJob.token
            ? {
              ...prev,
              status: mappedStatus,
              message: status.message,
            }
            : prev,
        );

        if (mappedStatus === 'expired') {
          setPreviewBlockedMessage('Token expired. Preview is no longer available.');
        } else if (mappedStatus === 'done') {
          setPreviewBlockedMessage('Token already printed. Preview is no longer available.');
        } else if (mappedStatus === 'failed') {
          setPreviewBlockedMessage(status.message);
        } else {
          setPreviewBlockedMessage(null);
        }
      } catch (statusError) {
        if (cancelled) {
          return;
        }

        const message = statusError instanceof Error ? statusError.message : 'Unable to refresh token status';
        if (message.toLowerCase().includes('expired')) {
          setPreviewBlockedMessage('Token expired. Preview is no longer available.');
          setQueue((prev) =>
            prev.map((job) =>
              job.token === activeJob.token
                ? {
                  ...job,
                  status: 'expired',
                  message,
                }
                : job,
            ),
          );
          setActiveJob((prev) =>
            prev && prev.token === activeJob.token
              ? {
                ...prev,
                status: 'expired',
                message,
              }
              : prev,
          );
        }
      }
    };

    void pollStatus();
    const interval = setInterval(() => {
      void pollStatus();
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeJob, drawerOpen]);

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
        if (activeJob && !printing) {
          void runPrint(activeJob, {
            pages: previewPages,
            copies: previewCopies,
            colorMode: previewColorMode,
          });
        }
      }

      if (event.ctrlKey && event.altKey && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setTestSavePdfMode((prev) => {
          const next = !prev;
          setLiveMessage(next ? 'Test save mode enabled.' : 'Test save mode disabled.');
          return next;
        });
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeJob, drawerOpen, previewColorMode, previewCopies, previewPages, printing, runPrint]);

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
        <div className="shop-stat-card">
          <span>Error rate today</span>
          <strong>{todaysStats.jobs === 0 ? '0%' : `${Math.round((todaysStats.errors / todaysStats.jobs) * 100)}%`}</strong>
        </div>
        <label className="shop-toggle">
          <input
            type="checkbox"
            checked={scannerPaused}
            onChange={(event) => setScannerPaused(event.target.checked)}
          />
          <span>Pause Scanner</span>
        </label>
        <label className="shop-toggle">
          <input
            type="checkbox"
            checked={autoPrint}
            onChange={(event) => setAutoPrint(event.target.checked)}
          />
          <span>Auto Print</span>
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
                onClick={() => {
                  setScannerEnabled(true);
                  setScannerPaused(false);
                }}
              >
                Start Scanner
              </button>
            ) : null}
          </div>

          <p className="muted" aria-live="polite">
            {scannerMessage}
          </p>

          <div className="scanner-state-row">
            <span className={`queue-badge ${scannerPaused ? 'queue-badge-expired' : 'queue-badge-printing'}`}>
              {scannerPaused ? 'paused' : 'live'}
            </span>
            <span className="muted">Auto-fetch on scan {scannerPaused ? 'OFF' : 'ON'}</span>
            <span className={`queue-badge ${autoPrint ? 'queue-badge-done' : 'queue-badge-pending'}`}>
              auto-print {autoPrint ? 'on' : 'off'}
            </span>
          </div>

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
          {isPrintAssociationError ? (
            <div className="print-setup-note" role="alert">
              <strong>Printer setup required on this Windows machine</strong>
              <p>
                The print command reached the server, but Windows could not find a print-capable PDF app.
              </p>
              <ol>
                <li>Install SumatraPDF or Adobe Reader.</li>
                <li>Set it as the default app for .pdf files.</li>
                <li>Ensure a default printer is available.</li>
                <li>Retry printing from this dashboard.</li>
              </ol>
            </div>
          ) : null}
          {scannerMessage.toLowerCase().includes('permission') ? (
            <p className="status-warning">
              Camera permission blocked. Allow camera access in browser settings or use token paste.
            </p>
          ) : null}
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
                  <div className="queue-actions">
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
                    {job.status === 'failed' || job.status === 'expired' ? (
                      <button type="button" className="queue-view-btn" onClick={() => void handleFetch(job.token, 'manual')}>
                        Retry
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="queue-view-btn"
                      onClick={() => {
                        setQueue((prev) => prev.filter((q) => q.id !== job.id));
                        if (activeJob?.id === job.id) {
                          setDrawerOpen(false);
                          setActiveJob(null);
                        }
                      }}
                    >
                      Cancel
                    </button>
                  </div>
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
                <span>{previewPages} pages</span>
                <span>{previewCopies} copies</span>
                <span>{previewColorMode}</span>
              </div>

              <div className="preview-controls">
                <label>
                  Pages
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={previewPages}
                    onChange={(event) => setPreviewPages(Number(event.target.value) || 1)}
                  />
                </label>
                <label>
                  Copies
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={previewCopies}
                    onChange={(event) => setPreviewCopies(Number(event.target.value) || 1)}
                  />
                </label>
                <label>
                  Color
                  <select value={previewColorMode} onChange={(event) => setPreviewColorMode(event.target.value as 'bw' | 'color')}>
                    <option value="bw">Black & White</option>
                    <option value="color">Color</option>
                  </select>
                </label>
              </div>

              <div className="pdf-preview-shell">
                {previewBlockedMessage ? (
                  <div className="status-warning" style={{ margin: 0 }}>
                    {previewBlockedMessage}
                  </div>
                ) : (
                  <iframe
                    key={activeJob.token}
                    src={getPdfPreviewUrl(activeJob.token)}
                    title="PDF preview"
                    className="pdf-preview-frame"
                  />
                )}
              </div>
              <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
                Scroll to inspect PDF pages. Preview is available for PDF files only.
              </p>
            </div>

            <div className="preview-actions">
              <button
                type="button"
                disabled={printing || !!previewBlockedMessage}
                onClick={() =>
                  void runPrint(activeJob, {
                    pages: previewPages,
                    copies: previewCopies,
                    colorMode: previewColorMode,
                  })
                }
              >
                {printing ? 'Printing...' : 'Print'}
              </button>
              <button
                type="button"
                className="queue-view-btn"
                onClick={async () => {
                  try {
                    await completePrintJob({ token: activeJob.token, documentId: activeJob.documentId });
                    finalizePrinted(activeJob.token, 'Marked printed manually.');
                    setLiveMessage('Marked printed manually.');
                  } catch (completeError) {
                    const message = completeError instanceof Error ? completeError.message : 'Unable to mark completion';
                    setError(message);
                    setLiveMessage(message);
                  }
                }}
              >
                Mark Printed
              </button>
              <button type="button" className="cta-link cta-secondary" onClick={() => setDrawerOpen(false)}>
                Cancel
              </button>
            </div>

            <p className="muted" style={{ marginBottom: 0 }}>
              This file will be auto-deleted after printing. No file content is kept in shop logs.
            </p>
            {testSavePdfMode ? (
              <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
                Test save mode is active for this station.
              </p>
            ) : null}
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
