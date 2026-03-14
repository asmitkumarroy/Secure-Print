import { Injectable } from '@nestjs/common';

type PrintJobSettings = {
  pages: number;
  copies: number;
  colorMode: 'bw' | 'color';
};

export type PrintLifecycleStatus = 'ready' | 'printing' | 'completed' | 'expired' | 'failed';

type TokenRecord = {
  token: string;
  documentId: string;
  expiresAt: string;
  settings: PrintJobSettings;
  filePath: string;
  fileName: string;
  mimeType: string;
  status: PrintLifecycleStatus;
  consumedAt?: string;
  printedAt?: string;
  failureReason?: string;
};

@Injectable()
export class TokenRegistryService {
  private readonly tokenRecords = new Map<string, TokenRecord>();

  register(record: Omit<TokenRecord, 'consumedAt' | 'status' | 'printedAt' | 'failureReason'>) {
    this.tokenRecords.set(record.token, { ...record, status: 'ready' });
  }

  find(token: string): TokenRecord | undefined {
    return this.tokenRecords.get(token);
  }

  findByDocumentId(documentId: string): TokenRecord | undefined {
    for (const record of this.tokenRecords.values()) {
      if (record.documentId === documentId) {
        return record;
      }
    }
    return undefined;
  }

  markConsumed(token: string) {
    const record = this.tokenRecords.get(token);

    if (!record) {
      return;
    }

    record.consumedAt = new Date().toISOString();
    this.tokenRecords.set(token, record);
  }

  markPrinting(token: string) {
    const record = this.tokenRecords.get(token);
    if (!record) {
      return;
    }

    record.status = 'printing';
    this.tokenRecords.set(token, record);
  }

  markCompleted(token: string) {
    const record = this.tokenRecords.get(token);
    if (!record) {
      return;
    }

    record.status = 'completed';
    record.printedAt = new Date().toISOString();
    record.consumedAt = record.printedAt;
    this.tokenRecords.set(token, record);
  }

  markFailed(token: string, reason: string) {
    const record = this.tokenRecords.get(token);
    if (!record) {
      return;
    }

    record.status = 'failed';
    record.failureReason = reason;
    this.tokenRecords.set(token, record);
  }

  markExpired(token: string) {
    const record = this.tokenRecords.get(token);
    if (!record) {
      return;
    }

    record.status = 'expired';
    this.tokenRecords.set(token, record);
  }

  purgeExpired(now = new Date()) {
    for (const [token, record] of this.tokenRecords.entries()) {
      if (new Date(record.expiresAt) <= now && record.status !== 'completed') {
        record.status = 'expired';
        this.tokenRecords.set(token, record);
      }
    }
  }
}
