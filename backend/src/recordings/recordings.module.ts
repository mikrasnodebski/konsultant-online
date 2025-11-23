import { Module } from '@nestjs/common';
import { RecordingsController } from './recordings.controller';
import { RecordingsService } from './recordings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RecordingsController],
  providers: [RecordingsService],
})
export class RecordingsModule {}


