import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>SecurePrint MVP</h1>
      <p>Privacy-first QR-based print workflow bootstrap.</p>
      <div className="grid grid-2">
        <section className="card">
          <h2>User Flow</h2>
          <p>Upload document, set print options, and generate QR token.</p>
          <Link href="/upload">Go to upload</Link>
        </section>
        <section className="card">
          <h2>Shop Flow</h2>
          <p>Scan QR or paste token, fetch print job, and complete print.</p>
          <Link href="/shop/dashboard">Go to dashboard</Link>
        </section>
      </div>
    </main>
  );
}
