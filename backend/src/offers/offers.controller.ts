import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OffersService, UpsertOfferDto } from './offers.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get('me')
  @UseGuards(JwtGuard)
  async getMine(@Req() req: any) {
    return this.offersService.getMine(req.user?.userId as number);
  }

  @Get(':storeSlug')
  async getByStore(@Param('storeSlug') storeSlug: string) {
    return this.offersService.getByStoreSlug(storeSlug);
  }

  @Post()
  @UseGuards(JwtGuard)
  async create(@Body() dto: UpsertOfferDto, @Req() req: any) {
    return this.offersService.upsert(dto, req.user?.userId as number);
  }
}


