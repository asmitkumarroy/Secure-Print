import Link from 'next/link';
import { UploadForm } from '../components/upload/UploadForm';

export default function UploadPage() {
  return (
    <main>
      <h1>Upload</h1>
      <p>Allowed file types: PDF, DOCX, PNG, JPG. Max size: 20MB.</p>
      <UploadForm />
      <p>
        Need to print at a shop? Go to <Link href="/shop/dashboard">Shop Dashboard</Link>.
      </p>
    </main>
  );
}
