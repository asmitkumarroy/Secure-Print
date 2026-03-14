import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PDFDocument } from 'pdf-lib';
import { TokenRegistryService } from '../common/token-registry.service';
import { CreateDocumentUploadDto } from './dto/create-document-upload.dto';

type UploadedFileLike = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
};

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
]);
const PDF_MIME_TYPES = new Set(['application/pdf', 'application/x-pdf']);
const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

@Injectable()
export class DocumentsService {
  constructor(private readonly tokenRegistry: TokenRegistryService) {}

  async calculatePageCount(file: UploadedFileLike | undefined) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    if (!this.isAllowedFileType(file)) {
      throw new BadRequestException('Unsupported file type');
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('File exceeds 20MB limit');
    }

    return {
      pages: await this.resolvePageCount(file),
      mimeType: file.mimetype,
      originalName: file.originalname,
    };
  }

  async createUploadResponse(file: UploadedFileLike | undefined, dto: CreateDocumentUploadDto) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    if (!this.isAllowedFileType(file)) {
      throw new BadRequestException('Unsupported file type');
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('File exceeds 20MB limit');
    }

    const expiry = Math.min(dto.expiryMinutes ?? 30, 60);
    const expiresAt = new Date(Date.now() + expiry * 60 * 1000).toISOString();
    const documentId = randomUUID();
    const printToken = randomUUID();
    const pages = await this.resolvePageCount(file, dto.pages);

    this.tokenRegistry.register({
      token: printToken,
      documentId,
      expiresAt,
      settings: {
        pages,
        copies: dto.copies,
        colorMode: dto.colorMode,
      },
    });

    return {
      documentId,
      printToken,
      expiresAt,
      qrText: `/print/${printToken}`,
      settings: {
        pages,
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

  private async resolvePageCount(file: UploadedFileLike, requestedPages?: number): Promise<number> {
    if (this.isPdfFile(file)) {
      if (!file.buffer || file.buffer.length === 0) {
        throw new BadRequestException('Unable to read PDF file content for page counting');
      }

      try {
        const pdf = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
        const pageCount = pdf.getPageCount();

        if (pageCount < 1) {
          throw new BadRequestException('Uploaded PDF has no pages');
        }

        return pageCount;
      } catch {
        throw new BadRequestException('Invalid or unreadable PDF file');
      }
    }

    return requestedPages ?? 1;
  }

  private isAllowedFileType(file: UploadedFileLike): boolean {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return true;
    }

    return this.isPdfFile(file);
  }

  private isPdfFile(file: UploadedFileLike): boolean {
    if (PDF_MIME_TYPES.has(file.mimetype)) {
      return true;
    }

    if (file.originalname.toLowerCase().endsWith('.pdf')) {
      return true;
    }

    if (!file.buffer || file.buffer.length < 5) {
      return false;
    }

    const magicHeader = file.buffer.subarray(0, 5).toString('ascii');
    return magicHeader === '%PDF-';
  }
}
