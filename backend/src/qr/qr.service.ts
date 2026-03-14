import { Injectable } from '@nestjs/common';

@Injectable()
export class QrService {
  createPreview(token: string) {
    return {
      printUrl: `/print/${token}`,
      qrPayload: `/print/${token}`,
    };
  }
}
