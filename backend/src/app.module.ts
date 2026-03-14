import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { DocumentsModule } from './documents/documents.module';
import { PrintModule } from './print/print.module';
import { QrModule } from './qr/qr.module';
import { ShopsModule } from './shops/shops.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    DocumentsModule,
    QrModule,
    PrintModule,
    ShopsModule,
  ],
})
export class AppModule {}
