import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

function formatRemaining(seconds: number) {
  const safe = Math.max(0, seconds);
  const min = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const sec = (safe % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

export default function QrDisplayPage() {
  const router = useRouter();
  const { token, expiresAt, pages, copies, colorMode } = router.query;
  const [now, setNow] = useState(Date.now());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<string>('');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const expiryMs = useMemo(() => {
    if (typeof expiresAt !== 'string') {
      return Date.now();
    }
    const parsed = Date.parse(expiresAt);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }, [expiresAt]);

  const remainingSeconds = Math.floor((expiryMs - now) / 1000);
  const expired = remainingSeconds <= 0;

  useEffect(() => {
    if (typeof token !== 'string' || token.length < 5) {
      setQrDataUrl('');
      return;
    }

    let active = true;
    setQrError('');

    void (async () => {
      try {
        const { toDataURL } = await import('qrcode');
        const generated = await toDataURL(token, {
          width: 260,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });

        if (active) {
          setQrDataUrl(generated);
        }
      } catch {
        if (active) {
          setQrError('Unable to generate QR image. Use token text below.');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main>
      <header className="topbar">
        <Link href="/" className="brand brand-link" aria-label="SecurePrint home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SecurePrint</span>
        </Link>
        <nav className="topbar-links">
          <Link href="/upload">New Upload</Link>
          <Link href="/shop/dashboard">Shop Dashboard</Link>
        </nav>
      </header>

      <h1 className="hero-title">Your Secure QR is Ready</h1>
      <p className="hero-subtitle">Show this code/token at the print shop. It expires automatically.</p>

      <section className="card qr-panel" style={{ marginTop: 18 }}>
        <div className="qr-box">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="SecurePrint QR token" width={250} height={250} />
          ) : (
            <div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>PRINT TOKEN</div>
              <strong style={{ wordBreak: 'break-all', fontSize: 13 }}>
                {typeof token === 'string' ? token : 'Token unavailable'}
              </strong>
            </div>
          )}
        </div>

        {qrError ? <p className="status-warning">{qrError}</p> : null}

        {typeof token === 'string' ? (
          <p className="muted" style={{ margin: 0, fontSize: 13, wordBreak: 'break-all' }}>
            Token: {token}
          </p>
        ) : null}

        <div className={`timer ${remainingSeconds < 300 ? 'timer-warning' : ''}`}>
          {expired ? 'Token expired' : `QR expires in: ${formatRemaining(remainingSeconds)}`}
        </div>

        {expired ? <p className="status-error">This token has expired. Generate a new QR to continue.</p> : null}

        <p className="muted" style={{ margin: 0 }}>
          Pages: {typeof pages === 'string' ? pages : '-'} | Copies: {typeof copies === 'string' ? copies : '-'} | Color:{' '}
          {typeof colorMode === 'string' ? colorMode : '-'}
        </p>
        <p className="muted" style={{ marginTop: 0 }}>
          Lock Your file is encrypted and auto-deleted after printing.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" disabled={expired}>
            Extend 10 min (coming soon)
          </button>
          <Link href="/upload">Cancel Print</Link>
        </div>
      </section>

      <div className="card" style={{ marginTop: 14 }}>
        <p style={{ margin: 0 }}>
          If scanner is unavailable, paste token manually in <Link href="/shop/dashboard">Shop Dashboard</Link>.
        </p>
      </div>
    </main>
  );
}
