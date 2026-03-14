import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateDocumentUploadDto } from './dto/create-document-upload.dto';
import { DocumentsService } from './documents.service';

type UploadedFileLike = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
};

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('page-count')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async getPageCount(@UploadedFile() file: UploadedFileLike) {
    return this.documentsService.calculatePageCount(file);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadDocument(
    @UploadedFile() file: UploadedFileLike,
    @Body() dto: CreateDocumentUploadDto,
  ) {
    return this.documentsService.createUploadResponse(file, dto);
  }
}
