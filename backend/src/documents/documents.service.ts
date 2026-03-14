import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateDocumentUploadDto } from './dto/create-document-upload.dto';

type UploadedFileLike = {
  originalname: string;
  mimetype: string;
  size: number;
};

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
]);
const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

@Injectable()
export class DocumentsService {
  createUploadResponse(file: UploadedFileLike | undefined, dto: CreateDocumentUploadDto) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('File exceeds 20MB limit');
    }

    const expiry = Math.min(dto.expiryMinutes ?? 30, 60);
    const expiresAt = new Date(Date.now() + expiry * 60 * 1000).toISOString();
    const documentId = randomUUID();
    const printToken = randomUUID();

    return {
      documentId,
      printToken,
      expiresAt,
      qrText: `/print/${printToken}`,
      settings: {
        pages: dto.pages,
        copies: dto.copies,
        colorMode: dto.colorMode,
      },
      upload: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
      note: 'Storage, encryption, and token signing are next implementation steps.',
    };
  }
}
