import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  @Cron('*/5 * * * *')
  handleExpirySweep() {
    this.logger.debug('Scheduled expiry cleanup tick (implementation pending).');
  }
}
