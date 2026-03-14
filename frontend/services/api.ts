export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export async function uploadDocument(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upload failed: ${body}`);
  }

  return response.json();
}

export async function detectPageCount(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/documents/page-count`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Page count detection failed: ${body}`);
  }

  return response.json() as Promise<{ pages: number; mimeType: string; originalName: string }>;
}

export async function fetchPrintJob(token: string) {
  const response = await fetch(`${API_BASE_URL}/print/${encodeURIComponent(token)}`);

  if (!response.ok) {
    let message = 'Fetch print job failed';
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      message = await response.text();
    }

    throw new Error(message);
  }

  return response.json();
}
