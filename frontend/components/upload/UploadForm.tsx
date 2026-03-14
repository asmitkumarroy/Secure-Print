import { FormEvent, useState } from 'react';
import { uploadDocument } from '../../services/api';

type UploadResult = {
  documentId: string;
  printToken: string;
  expiresAt: string;
  qrText: string;
};

export function UploadForm() {
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    try {
      const response = (await uploadDocument(formData)) as UploadResult;
      setResult(response);
    } catch (submitError) {
      setResult(null);
      setError(submitError instanceof Error ? submitError.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Upload Document</h2>
      <form onSubmit={onSubmit} className="grid">
        <input name="file" type="file" required />
        <input name="pages" type="number" min={1} max={1000} defaultValue={1} required />
        <input name="copies" type="number" min={1} max={100} defaultValue={1} required />
        <select name="colorMode" defaultValue="bw">
          <option value="bw">Black & White</option>
          <option value="color">Color</option>
        </select>
        <input
          name="expiryMinutes"
          type="number"
          min={1}
          max={60}
          defaultValue={30}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Generate Token'}
        </button>
      </form>

      {error ? <p>{error}</p> : null}
      {result ? (
        <div>
          <h3>Ready</h3>
          <p>Document: {result.documentId}</p>
          <p>Token: {result.printToken}</p>
          <p>Expires: {new Date(result.expiresAt).toLocaleString()}</p>
          <p>QR text: {result.qrText}</p>
        </div>
      ) : null}
    </div>
  );
}
