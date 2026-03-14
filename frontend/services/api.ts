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

export async function fetchPrintJob(token: string) {
  const response = await fetch(`${API_BASE_URL}/print/${encodeURIComponent(token)}`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Fetch print job failed: ${body}`);
  }

  return response.json();
}
