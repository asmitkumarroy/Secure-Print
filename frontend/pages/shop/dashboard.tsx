import Link from 'next/link';
import { TokenLookup } from '../../components/shop/TokenLookup';

export default function ShopDashboardPage() {
  return (
    <main>
      <header className="topbar">
        <Link href="/" className="brand brand-link" aria-label="SecurePrint home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SecurePrint</span>
        </Link>
        <nav className="topbar-links">
          <Link href="/upload">New Upload</Link>
          <Link href="/shop/scanner">Full Scanner Page</Link>
        </nav>
      </header>

      <h1 className="hero-title">Print Shop Dashboard</h1>
      <p className="hero-subtitle">
        Scan customer QR or paste token. Auto-fetch opens preview instantly for one-click printing.
      </p>

      <TokenLookup />
    </main>
  );
}
