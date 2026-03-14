import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PrintController } from './print.controller';
import { PrintService } from './print.service';

@Module({
  imports: [CommonModule],
  controllers: [PrintController],
  providers: [PrintService],
  exports: [PrintService],
})
export class PrintModule {}
