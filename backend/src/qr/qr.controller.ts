import { Body, Controller, Post } from '@nestjs/common';
import { CreateQrDto } from './dto/create-qr.dto';
import { QrService } from './qr.service';

@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('preview')
  generatePreview(@Body() dto: CreateQrDto) {
    return this.qrService.createPreview(dto.token);
  }
}
