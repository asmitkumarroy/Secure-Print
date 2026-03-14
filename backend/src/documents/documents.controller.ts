import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDocumentUploadDto } from './dto/create-document-upload.dto';
import { DocumentsService } from './documents.service';

type UploadedFileLike = {
  originalname: string;
  mimetype: string;
  size: number;
};

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @UploadedFile() file: UploadedFileLike,
    @Body() dto: CreateDocumentUploadDto,
  ) {
    return this.documentsService.createUploadResponse(file, dto);
  }
}
