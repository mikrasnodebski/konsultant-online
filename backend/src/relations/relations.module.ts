import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RelationsService } from './relations.service';
import { RelationsController } from './relations.controller';
import { AuthModule } from '../auth/auth.module';
import { JwtGuard } from '../auth/jwt.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RelationsController],
  providers: [RelationsService, JwtGuard],
})
export class RelationsModule {}


