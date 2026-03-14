import { DragEvent, FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { detectPageCount, uploadDocument } from '../../services/api';

type UploadResult = {
  documentId: string;
  printToken: string;
  expiresAt: string;
  qrText: string;
  settings: {
    pages: number;
    copies: number;
    colorMode: 'bw' | 'color';
  };
};

export function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPdfSelected, setIsPdfSelected] = useState(false);
  const [detectedPages, setDetectedPages] = useState<number | null>(null);
  const [detectingPages, setDetectingPages] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [dropActive, setDropActive] = useState(false);

  async function handleSelectedFile(file: File | undefined | null) {
    setDetectedPages(null);

    if (!file) {
      setIsPdfSelected(false);
      setSelectedFileName('');
      return;
    }

    setSelectedFileName(file.name);

    const looksLikePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setIsPdfSelected(looksLikePdf);

    if (!looksLikePdf) {
      return;
    }

    setDetectingPages(true);
    setError(null);
    try {
      const response = await detectPageCount(file);
      setDetectedPages(response.pages);
    } catch (detectError) {
      setDetectedPages(null);
      setError(
        detectError instanceof Error ? detectError.message : 'Unable to detect PDF pages',
      );
    } finally {
      setDetectingPages(false);
    }
  }

  async function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDropActive(false);
    const droppedFile = event.dataTransfer.files?.[0];

    if (!droppedFile || !fileInputRef.current) {
      return;
    }

    const dt = new DataTransfer();
    dt.items.add(droppedFile);
    fileInputRef.current.files = dt.files;

    await handleSelectedFile(droppedFile);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    if (isPdfSelected && detectedPages) {
      formData.set('pages', String(detectedPages));
    }

    try {
      const response = (await uploadDocument(formData)) as UploadResult;
      setResult(response);

      await router.push({
        pathname: '/qr-display',
        query: {
          token: response.printToken,
          expiresAt: response.expiresAt,
          pages: String(response.settings.pages),
          copies: String(response.settings.copies),
          colorMode: response.settings.colorMode,
        },
      });
    } catch (submitError) {
      setResult(null);
      setError(submitError instanceof Error ? submitError.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Upload Document</h2>
      <form onSubmit={onSubmit} className="grid">
        <label
          className={`dropzone ${dropActive ? 'dropzone-active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDropActive(true);
          }}
          onDragLeave={() => setDropActive(false)}
          onDrop={onDrop}
        >
          <input
            ref={fileInputRef}
            className="hidden-input"
            name="file"
            type="file"
            required
            onChange={async (event) => {
              await handleSelectedFile(event.currentTarget.files?.[0]);
            }}
          />
          <strong>Drop your file here or click to browse</strong>
          <div className="dropzone-meta">Supported: PDF, DOCX, JPG, PNG | Max size: 20MB</div>
          {selectedFileName ? <div className="dropzone-meta">Selected: {selectedFileName}</div> : null}
        </label>

        <label>
          Pages
          <input
            name="pages"
            type="number"
            min={1}
            max={1000}
            defaultValue={1}
            required={!isPdfSelected}
            disabled={isPdfSelected}
          />
        </label>
        {isPdfSelected ? (
          <p className="status-warning">PDF selected: pages will be calculated automatically by backend.</p>
        ) : null}
        {isPdfSelected && detectingPages ? (
          <div>
            <p className="muted" style={{ marginTop: 0 }}>Detecting page count...</p>
            <div className="upload-progress">
              <span />
            </div>
          </div>
        ) : null}
        {isPdfSelected && detectedPages !== null ? (
          <p className="status-success">Detected pages (from backend): {detectedPages}</p>
        ) : null}

        <label>
          Copies
          <input name="copies" type="number" min={1} max={100} defaultValue={1} required />
        </label>

        <label>
          Color Mode
          <select name="colorMode" defaultValue="bw">
            <option value="bw">Black & White</option>
            <option value="color">Color</option>
          </select>
        </label>

        <label>
          Expiry Minutes
          <input
            name="expiryMinutes"
            type="number"
            min={1}
            max={60}
            defaultValue={30}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Uploading and generating QR...' : 'Generate Secure QR'}
        </button>
      </form>

      {error ? <p className="status-error">{error}</p> : null}
      {result ? (
        <div className="status-success" style={{ marginTop: 12 }}>
          <h3>Ready</h3>
          <p>Document: {result.documentId}</p>
          <p>Pages (auto): {result.settings.pages}</p>
          <p>Copies: {result.settings.copies}</p>
          <p>Color: {result.settings.colorMode}</p>
          <p>Token: {result.printToken}</p>
          <p>Expires: {new Date(result.expiresAt).toLocaleString()}</p>
          <p>QR text: {result.qrText}</p>
        </div>
      ) : null}
    </div>
  );
}
