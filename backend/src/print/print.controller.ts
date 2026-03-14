import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { CompletePrintDto } from './dto/complete-print.dto';
import { ExecutePrintDto } from './dto/execute-print.dto';
import { PrintService } from './print.service';

@Controller('print')
export class PrintController {
  constructor(private readonly printService: PrintService) {}

  @Get(':token')
  fetchPrintJob(@Param('token') token: string) {
    return this.printService.fetchByToken(token);
  }

  @Get(':token/status')
  getPrintStatus(@Param('token') token: string) {
    return this.printService.getStatus(token);
  }

  @Get(':token/preview')
  previewPdf(@Param('token') token: string, @Res() res: Response) {
    const preview = this.printService.getPdfPreview(token);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${preview.fileName}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(preview.filePath);
  }

  @Post('execute')
  executePrint(@Body() dto: ExecutePrintDto) {
    return this.printService.executePrint(dto);
  }

  @Post('complete')
  completePrint(@Body() dto: CompletePrintDto) {
    return this.printService.markComplete(dto.documentId, dto.token);
  }
}
