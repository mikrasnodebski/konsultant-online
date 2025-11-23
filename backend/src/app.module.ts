import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OffersModule } from './offers/offers.module';
import { UploadsModule } from './uploads/uploads.module';
import { RelationsModule } from './relations/relations.module';
import { RealtimeModule } from './realtime/realtime.module';
import { EventsModule } from './events/events.module';
import { RecordingsModule } from './recordings/recordings.module';

@Module({
  imports: [PrismaModule, AuthModule, OffersModule, UploadsModule, RelationsModule, RealtimeModule, RecordingsModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
