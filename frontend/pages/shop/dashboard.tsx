import Link from 'next/link';
import { TokenLookup } from '../../components/shop/TokenLookup';

export default function ShopDashboardPage() {
  return (
    <main>
      <h1>Shop Dashboard</h1>
      <p>Scan QR in a future step or paste token manually now.</p>
      <TokenLookup />
      <p>
        <Link href="/shop/scanner">Open scanner placeholder</Link>
      </p>
    </main>
  );
}
