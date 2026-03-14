import Link from 'next/link';
import { UploadForm } from '../components/upload/UploadForm';

export default function UploadPage() {
  return (
    <main>
      <header className="topbar">
        <Link href="/" className="brand brand-link" aria-label="SecurePrint home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SecurePrint</span>
        </Link>
        <nav className="topbar-links">
          <Link href="/">How it Works</Link>
          <Link href="/shop/login">Print Shop Login</Link>
        </nav>
      </header>

      <h1 className="hero-title">Upload and Generate Secure QR</h1>
      <p className="hero-subtitle">
        Upload -&gt; QR -&gt; Scan -&gt; Print. Supported: PDF, DOCX, JPG, PNG (max 20MB).
      </p>
      <div className="privacy-banner">Your file is encrypted and auto-deleted after printing.</div>

      <section className="upload-layout" style={{ marginTop: 18 }}>
        <UploadForm />
        <aside className="card">
          <h3 style={{ marginTop: 0 }}>Quick Steps</h3>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
            <li>Upload your document and print preferences.</li>
            <li>Show generated QR to the print shop.</li>
            <li>Shop scans QR and prints securely.</li>
            <li>Document expires automatically.</li>
          </ol>
          <p className="muted" style={{ marginBottom: 0, marginTop: 14 }}>
            Need manual fallback? Use token paste on the shop dashboard.
          </p>
          <p style={{ marginBottom: 0, marginTop: 10 }}>
            <Link href="/shop/dashboard">Open Shop Dashboard</Link>
          </p>
        </aside>
      </section>
    </main>
  );
}
