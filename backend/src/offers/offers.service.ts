import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type UpsertOfferDto = {
  storeSlug?: string;
  title: string;
  descriptionHtml: string;
  pricePln: number;
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: number) {
    const offer = await this.prisma.offer.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    return { offer: offer ?? null };
  }

  async getByStoreSlug(storeSlug: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { storeSlug },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return { offer };
  }

  private slugify(input: string): string {
    const base = input.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sklep';
  }

  async upsert(dto: UpsertOfferDto, userId?: number) {
    let desiredSlug = dto.storeSlug?.trim();
    if ((!desiredSlug || desiredSlug.length === 0) && userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user?.email) {
        desiredSlug = this.slugify(user.email);
      }
    }
    if (!desiredSlug) desiredSlug = this.slugify('sklep');

    if (userId) {
      const existing = await this.prisma.offer.findFirst({ where: { userId } });
      if (existing) {
        if (desiredSlug !== existing.storeSlug) {
          const slugOwner = await this.prisma.offer.findUnique({
            where: { storeSlug: desiredSlug },
            select: { id: true },
          });
          if (slugOwner) {
            throw new BadRequestException('Store slug already in use');
          }
        }
        const offer = await this.prisma.offer.update({
          where: { id: existing.id },
          data: {
            storeSlug: desiredSlug,
            title: dto.title,
            descriptionHtml: dto.descriptionHtml,
            pricePln: dto.pricePln,
            primaryColor: dto.primaryColor ?? undefined,
            secondaryColor: dto.secondaryColor ?? undefined,
          },
        });
        return { offer };
      }
    }

    const existsBySlug = await this.prisma.offer.findUnique({
      where: { storeSlug: desiredSlug },
      select: { id: true },
    });
    if (existsBySlug) {
      throw new BadRequestException('Store slug already in use');
    }

    const offer = await this.prisma.offer.create({
      data: {
        storeSlug: desiredSlug,
        title: dto.title,
        descriptionHtml: dto.descriptionHtml,
        pricePln: dto.pricePln,
        primaryColor: dto.primaryColor ?? undefined,
        secondaryColor: dto.secondaryColor ?? undefined,
        userId: userId ?? undefined,
      },
    });
    return { offer };
  }
}


