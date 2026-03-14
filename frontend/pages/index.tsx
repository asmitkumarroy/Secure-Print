import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <header className="landing-nav">
        <Link href="/" className="brand brand-link" aria-label="SecurePrint home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SecurePrint</span>
        </Link>
        <nav className="landing-nav-links">
          <a href="#how-it-works">How It Works</a>
          <a href="#privacy">Privacy</a>
          <Link href="/shop/dashboard">Print Shop</Link>
        </nav>
        <Link className="cta-link" href="/upload">
          Upload Document
        </Link>
      </header>

      <section className="landing-hero">
        <p className="landing-badge">Privacy-first QR printing</p>
        <h1 className="landing-title">Print Documents Without Sharing Your Files</h1>
        <p className="landing-subtitle">Secure QR-based printing for cyber cafes.</p>
        <p className="landing-flow">Upload -&gt; Generate QR -&gt; Scan -&gt; Print -&gt; Auto Delete</p>
        <div className="landing-cta-row">
          <Link className="cta-link" href="/upload">
            Upload Document
          </Link>
          <Link className="cta-link cta-secondary" href="/shop/dashboard">
            For Print Shops
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <h2 className="section-title">How It Works</h2>
        <div className="workflow-grid">
          <article className="card interactive-card workflow-card">
            <div className="workflow-icon">1</div>
            <h3>Upload</h3>
            <p>Upload your document securely. Supports PDF, DOCX, JPG, PNG.</p>
          </article>
          <article className="card interactive-card workflow-card">
            <div className="workflow-icon">2</div>
            <h3>Show QR</h3>
            <p>Get a temporary QR code instantly. It expires automatically.</p>
          </article>
          <article className="card interactive-card workflow-card">
            <div className="workflow-icon">3</div>
            <h3>Print Securely</h3>
            <p>Scan QR at any print shop and print without sharing the file.</p>
          </article>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="section-title">Start in One Click</h2>
        <div className="action-grid">
          <article className="card interactive-card action-card">
            <h3>Print a Document</h3>
            <p>Upload your file and generate a secure QR code for printing.</p>
            <Link className="cta-link" href="/upload">
              Start Printing
            </Link>
          </article>
          <article className="card interactive-card action-card">
            <h3>Print Shop Dashboard</h3>
            <p>Scan customer QR codes and process print jobs quickly.</p>
            <Link className="cta-link cta-secondary" href="/shop/dashboard">
              Open Scanner
            </Link>
          </article>
        </div>
      </section>

      <section id="privacy" className="landing-section">
        <div className="card privacy-card interactive-card">
          <h2 className="section-title">Your Documents Stay Private</h2>
          <ul className="privacy-list">
            <li>Files auto-delete after printing.</li>
            <li>No storage on shop computers.</li>
            <li>Temporary secure QR tokens.</li>
            <li>Encrypted uploads and protected retrieval flow.</li>
          </ul>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="section-title">QR Demo</h2>
        <div className="card qr-demo interactive-card">
          <div className="qr-demo-box" aria-hidden="true">
            <div className="qr-dot-grid" />
          </div>
          <ol className="qr-demo-steps">
            <li>Upload your document.</li>
            <li>Show QR at print shop.</li>
            <li>Scan and print instantly.</li>
          </ol>
        </div>
      </section>

      <footer className="landing-footer">
        <div>
          <strong>SecurePrint</strong>
          <p className="muted">Privacy-first QR printing.</p>
        </div>
        <div className="landing-footer-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#how-it-works">How it Works</a>
          <Link href="/shop/login">Print Shop Login</Link>
        </div>
      </footer>
    </main>
  );
}
