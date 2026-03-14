import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { TokenRegistryService } from '../common/token-registry.service';

@Injectable()
export class PrintService {
  constructor(private readonly tokenRegistry: TokenRegistryService) {}

  fetchByToken(token: string) {
    const record = this.tokenRegistry.find(token);

    if (!record) {
      throw new NotFoundException('Token not found');
    }

    const expiresAtMs = Date.parse(record.expiresAt);
    if (!Number.isNaN(expiresAtMs) && expiresAtMs <= Date.now()) {
      throw new GoneException('Token expired');
    }

    return {
      token,
      documentId: record.documentId,
      status: 'ready',
      expiresAt: record.expiresAt,
      settings: record.settings,
      message: 'Token is valid and ready for printing.',
    };
  }

  markComplete(documentId: string) {
    return {
      documentId,
      status: 'completed',
      deleted: false,
      message: 'Storage deletion implementation is pending.',
    };
  }
}
