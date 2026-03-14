import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CompletePrintDto } from './dto/complete-print.dto';
import { PrintService } from './print.service';

@Controller('print')
export class PrintController {
  constructor(private readonly printService: PrintService) {}

  @Get(':token')
  fetchPrintJob(@Param('token') token: string) {
    return this.printService.fetchByToken(token);
  }

  @Post('complete')
  completePrint(@Body() dto: CompletePrintDto) {
    return this.printService.markComplete(dto.documentId);
  }
}
