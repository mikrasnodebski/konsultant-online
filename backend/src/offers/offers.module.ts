import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { AuthModule } from '../auth/auth.module';
import { JwtGuard } from '../auth/jwt.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OffersController],
  providers: [OffersService, JwtGuard],
})
export class OffersModule {}


