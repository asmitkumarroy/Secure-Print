import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchPrintJob } from '../../services/api';

type PrintLookupResult = {
  token: string;
  documentId?: string;
  status: string;
  expiresAt?: string;
  settings?: {
    pages: number;
    copies: number;
    colorMode: 'bw' | 'color';
  };
  message: string;
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

export default function ShopScannerPage() {
  const scannerRegionId = 'secureprint-qr-scanner-region';
  const html5ScannerRef = useRef<any | null>(null);
  const isMountedRef = useRef(true);
  const [scanSession, setScanSession] = useState(0);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'processing' | 'done' | 'error'>('idle');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<PrintLookupResult | null>(null);

  const statusText = useMemo(() => {
    if (status === 'scanning') return 'Scanning QR code...';
    if (status === 'processing') return 'Fetching document...';
    if (status === 'done') return 'QR processed.';
    if (status === 'error') return 'Scanner error.';
    return 'Click start scanner to begin.';
  }, [status]);

  const stopScanner = useCallback(async () => {
    const scanner = html5ScannerRef.current;

    if (!scanner) {
      return;
    }

    try {
      await scanner.stop();
    } catch {
      // Ignore stop errors when scanner was not active.
    }

    try {
      await scanner.clear();
    } catch {
      // Ignore cleanup errors.
    }

    html5ScannerRef.current = null;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      void stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    if (scanSession === 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setError('');
      setResult(null);
      setStatus('scanning');

      try {
        const module = await import('html5-qrcode');
        const Html5QrcodeClass = module.Html5Qrcode;
        const scanner = new Html5QrcodeClass(scannerRegionId);
        html5ScannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          async (decodedText: string) => {
            if (cancelled || !isMountedRef.current) {
              return;
            }

            const extracted = extractToken(decodedText);
            if (!extracted) {
              return;
            }

            setToken(extracted);
            setStatus('processing');
            await stopScanner();

            try {
              const data = (await fetchPrintJob(extracted)) as PrintLookupResult;
              if (!isMountedRef.current) {
                return;
              }
              setResult(data);
              setStatus('done');
            } catch (fetchError) {
              if (!isMountedRef.current) {
                return;
              }
              setStatus('error');
              setError(fetchError instanceof Error ? fetchError.message : 'Lookup failed after scan');
            }
          },
          () => {
            // Ignore frame decode errors while continuously scanning.
          },
        );
      } catch (scanError) {
        if (!isMountedRef.current) {
          return;
        }
        setStatus('error');
        setError(scanError instanceof Error ? scanError.message : 'Unable to access camera scanner');
      }
    })();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [scanSession, stopScanner]);

  return (
    <main>
      <header className="topbar">
        <Link href="/" className="brand brand-link" aria-label="SecurePrint home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SecurePrint</span>
        </Link>
        <nav className="topbar-links">
          <Link href="/shop/dashboard">Dashboard</Link>
          <Link href="/upload">New Upload</Link>
        </nav>
      </header>

      <h1 className="hero-title">Shop QR Scanner</h1>
      <p className="hero-subtitle">Scan customer QR code to fetch print job instantly.</p>

      <div className="card">
        <div id={scannerRegionId} style={{ width: '100%', maxWidth: 520, margin: '0 auto' }} />

        <p className="muted" style={{ textAlign: 'center' }}>{statusText}</p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setScanSession((prev) => prev + 1)}>
            Start Scanner
          </button>
          <button type="button" className="cta-link cta-secondary" onClick={() => void stopScanner()}>
            Stop Scanner
          </button>
        </div>

        {token ? (
          <p className="muted" style={{ marginTop: 12, textAlign: 'center', wordBreak: 'break-all' }}>
            Scanned token: {token}
          </p>
        ) : null}

        {error ? <p className="status-error">{error}</p> : null}

        {result ? (
          <div className="status-success" style={{ marginTop: 12 }}>
            <p style={{ marginTop: 0 }}><strong>Status:</strong> {result.status}</p>
            {result.expiresAt ? <p><strong>Expires:</strong> {new Date(result.expiresAt).toLocaleString()}</p> : null}
            {result.settings ? (
              <p>
                <strong>Settings:</strong> {result.settings.pages} pages, {result.settings.copies} copies, {result.settings.colorMode}
              </p>
            ) : null}
            <p style={{ marginBottom: 0 }}>{result.message}</p>
          </div>
        ) : null}

        <p style={{ marginTop: 14, marginBottom: 0 }}>
          Camera unavailable? Use <Link href="/shop/dashboard">manual token paste</Link>.
        </p>
      </div>
    </main>
  );
}
