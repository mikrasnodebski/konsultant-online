import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Role, Prisma, RelationType } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const role: Role =
      dto.role === 'CONSULTANT' ? 'CONSULTANT' : 'CLIENT';

    const salt = randomBytes(16).toString('hex');
    const derived = (await scrypt(dto.password, salt, 32)) as Buffer;
    const passwordHash = derived.toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role,
        passwordHash,
        passwordSalt: salt,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user.role === 'CLIENT' && dto.storeSlug) {
      const offer = await this.prisma.offer.findUnique({
        where: { storeSlug: dto.storeSlug },
        select: { userId: true },
      });
      if (offer?.userId) {
        const publicLead = await this.prisma.relation.findFirst({
          where: {
            consultantId: offer.userId,
            clientId: null,
            relationType: RelationType.CONSULTANT_LEAD,
            isDeleted: false,
          },
        });
        if (publicLead) {
          await this.prisma.relation.update({
            where: { id: publicLead.id },
            data: { clientId: user.id },
          });
        } else {
          const existing = await this.prisma.relation.findFirst({
          where: {
            consultantId: offer.userId,
            clientId: user.id,
            relationType: RelationType.CONSULTANT_LEAD,
            isDeleted: false,
          },
          });
          if (!existing) {
            await this.prisma.relation.create({
              data: {
                consultantId: offer.userId,
                clientId: user.id,
                relationType: RelationType.CONSULTANT_LEAD,
              },
            });
          }
        }
      }
    }

    if (user.role === 'CONSULTANT') {
      const slugBase = email.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const storeSlug =
        slugBase.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sklep';
      await this.prisma.offer.upsert({
        where: { storeSlug },
        update: {},
        create: {
          storeSlug,
          title: 'Moja oferta konsultacji',
          descriptionHtml: '<p>Opis oferty…</p>',
          pricePln: new Prisma.Decimal(0),
          userId: user.id,
          primaryColor: '#2563eb',
          secondaryColor: '#0ea5e9',
        },
      });
    }

    return { user };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const derived = (await scrypt(dto.password, user.passwordSalt, 32)) as Buffer;
    const candidate = Buffer.from(derived.toString('hex'), 'hex');
    const stored = Buffer.from(user.passwordHash, 'hex');

    const equal =
      candidate.length === stored.length && timingSafeEqual(candidate, stored);
    if (!equal) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwt.signAsync({ sub: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
    };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { user };
  }
}


