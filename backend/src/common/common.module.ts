import { Module } from '@nestjs/common';
import { CleanupService } from './cleanup.service';
import { TokenRegistryService } from './token-registry.service';

@Module({
  providers: [CleanupService, TokenRegistryService],
  exports: [CleanupService, TokenRegistryService],
})
export class CommonModule {}
