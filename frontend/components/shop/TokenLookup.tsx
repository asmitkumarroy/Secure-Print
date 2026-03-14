import { FormEvent, useState } from 'react';
import { fetchPrintJob } from '../../services/api';

type PrintResult = {
  token: string;
  status: string;
  message: string;
};

export function TokenLookup() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<PrintResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const data = (await fetchPrintJob(token)) as PrintResult;
      setResult(data);
    } catch (lookupError) {
      setResult(null);
      setError(lookupError instanceof Error ? lookupError.message : 'Lookup failed');
    }
  }

  return (
    <div className="card">
      <h2>Find Print Job</h2>
      <form onSubmit={onSubmit} className="grid">
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Paste print token"
          minLength={10}
          required
        />
        <button type="submit">Fetch</button>
      </form>

      {error ? <p>{error}</p> : null}
      {result ? (
        <div>
          <p>Token: {result.token}</p>
          <p>Status: {result.status}</p>
          <p>{result.message}</p>
        </div>
      ) : null}
    </div>
  );
}
