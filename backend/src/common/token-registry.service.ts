import { Injectable } from '@nestjs/common';

type PrintJobSettings = {
  pages: number;
  copies: number;
  colorMode: 'bw' | 'color';
};

type TokenRecord = {
  token: string;
  documentId: string;
  expiresAt: string;
  settings: PrintJobSettings;
  consumedAt?: string;
};

@Injectable()
export class TokenRegistryService {
  private readonly tokenRecords = new Map<string, TokenRecord>();

  register(record: Omit<TokenRecord, 'consumedAt'>) {
    this.tokenRecords.set(record.token, { ...record });
  }

  find(token: string): TokenRecord | undefined {
    return this.tokenRecords.get(token);
  }

  markConsumed(token: string) {
    const record = this.tokenRecords.get(token);

    if (!record) {
      return;
    }

    record.consumedAt = new Date().toISOString();
    this.tokenRecords.set(token, record);
  }

  purgeExpired(now = new Date()) {
    for (const [token, record] of this.tokenRecords.entries()) {
      if (new Date(record.expiresAt) <= now) {
        this.tokenRecords.delete(token);
      }
    }
  }
}
