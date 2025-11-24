import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RelationType } from '@prisma/client';

export interface CreateLeadDto {
  storeSlug?: string;
  consultantEmail?: string;
  clientId: number;
}

export interface CreateLeadPublicDto {
  storeSlug?: string;
  consultantEmail?: string;
}

@Injectable()
export class RelationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLead(dto: CreateLeadDto) {
    let consultantId: number | null = null;

    if (dto.consultantEmail) {
      const consultant = await this.prisma.user.findUnique({
        where: { email: dto.consultantEmail },
        select: { id: true, role: true },
      });
      if (!consultant) throw new NotFoundException('Consultant not found');
      consultantId = consultant.id;
    } else if (dto.storeSlug) {
      const offer = await this.prisma.offer.findUnique({
        where: { storeSlug: dto.storeSlug },
        select: { userId: true },
      });
      if (!offer || !offer.userId) {
        throw new NotFoundException('Store not found or has no owner');
      }
      consultantId = offer.userId;
    } else {
      throw new BadRequestException('consultantEmail or storeSlug is required');
    }

    if (!dto.clientId) {
      throw new BadRequestException('clientId is required');
    }

    const existing = await this.prisma.relation.findFirst({
      where: {
        consultantId: consultantId,
        clientId: dto.clientId,
        relationType: RelationType.CONSULTANT_LEAD,
        isDeleted: false,
      },
    });

    if (existing) {
      return { relation: existing };
    }

    const relation = await this.prisma.relation.create({
      data: {
        relationType: RelationType.CONSULTANT_LEAD,
        consultantId,
        clientId: dto.clientId,
      },
    });
    return { relation };
  }

  async listForClient(clientId: number) {
    const relations = await this.prisma.relation.findMany({
      where: { clientId, isDeleted: false },
      include: {
        consultant: {
          select: { id: true, email: true, phone: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      relations: relations.map((r) => ({
        id: r.id,
        relationType: r.relationType,
        consultant: r.consultant,
        createdAt: r.createdAt,
      })),
    };
  }

  async listLeadsForConsultant(consultantId: number) {
    const relations = await this.prisma.relation.findMany({
      where: { consultantId, relationType: RelationType.CONSULTANT_LEAD, isDeleted: false },
      include: {
        client: { select: { id: true, email: true, phone: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      leads: relations.map((r) => ({
        id: r.id,
        client: r.client,
        createdAt: r.createdAt,
      })),
    };
  }

  async acceptLead(consultantId: number, relationId: number) {
    const relation = await this.prisma.relation.findUnique({ where: { id: relationId } });
    if (!relation || relation.consultantId !== consultantId) {
      throw new NotFoundException('Lead not found');
    }
    if (relation.relationType !== RelationType.CONSULTANT_LEAD) {
      throw new BadRequestException('Not a lead');
    }
    if (!relation.clientId) {
      throw new BadRequestException('Cannot accept lead without client');
    }
    const updated = await this.prisma.relation.update({
      where: { id: relationId },
      data: { relationType: RelationType.CONSULTANT_CLIENT, isDeleted: false, deletedAt: null },
    });
    return { relation: updated };
  }

  async rejectLead(consultantId: number, relationId: number) {
    const relation = await this.prisma.relation.findUnique({ where: { id: relationId } });
    if (!relation || relation.consultantId !== consultantId) {
      throw new NotFoundException('Lead not found');
    }
    if (relation.relationType !== RelationType.CONSULTANT_LEAD) {
      throw new BadRequestException('Not a lead');
    }
    await this.prisma.relation.update({
      where: { id: relationId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { ok: true };
  }

  async listClientsForConsultant(consultantId: number) {
    const relations = await this.prisma.relation.findMany({
      where: { consultantId, relationType: RelationType.CONSULTANT_CLIENT, isDeleted: false },
      include: {
        client: { select: { id: true, email: true, phone: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    const nextEvents = await Promise.all(
      relations.map((r) =>
        this.prisma.event.findFirst({
          where: { consultantId, relationId: r.id, start: { gt: now } },
          orderBy: { start: 'asc' },
          select: { id: true, start: true, end: true },
        }),
      ),
    );
    const nextByRelation = new Map<number, { id: number; start: Date; end: Date } | null>();
    relations.forEach((r, idx) => nextByRelation.set(r.id, nextEvents[idx] ?? null));
    return {
      clients: relations
        .filter((r) => r.client)
        .map((r) => ({
          id: r.id,
          client: r.client!,
          createdAt: r.createdAt,
          notes: r.notes ?? null,
          nextEvent: nextByRelation.get(r.id),
        })),
    };
  }

  async createLeadPublic(dto: CreateLeadPublicDto) {
    let consultantId: number | null = null;

    if (dto.consultantEmail) {
      const consultant = await this.prisma.user.findUnique({
        where: { email: dto.consultantEmail },
        select: { id: true },
      });
      if (!consultant) throw new NotFoundException('Consultant not found');
      consultantId = consultant.id;
    } else if (dto.storeSlug) {
      const offer = await this.prisma.offer.findUnique({
        where: { storeSlug: dto.storeSlug },
        select: { userId: true },
      });
      if (!offer || !offer.userId) {
        throw new NotFoundException('Store not found or has no owner');
      }
      consultantId = offer.userId;
    } else {
      throw new BadRequestException('consultantEmail or storeSlug is required');
    }

    const existing = await this.prisma.relation.findFirst({
      where: {
        consultantId,
        clientId: null,
        relationType: RelationType.CONSULTANT_LEAD,
        isDeleted: false,
      },
    });
    if (existing) {
      return { relation: existing };
    }

    const relation = await this.prisma.relation.create({
      data: {
        relationType: RelationType.CONSULTANT_LEAD,
        consultantId,
        clientId: null,
      },
    });
    return { relation };
  }

  async deleteClient(consultantId: number, relationId: number) {
    const relation = await this.prisma.relation.findUnique({ where: { id: relationId } });
    if (!relation || relation.consultantId !== consultantId) {
      throw new NotFoundException('Relation not found');
    }
    if (relation.relationType !== RelationType.CONSULTANT_CLIENT) {
      throw new BadRequestException('Not a client relation');
    }
    await this.prisma.relation.update({
      where: { id: relationId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { ok: true };
  }

  async updateNotes(consultantId: number, relationId: number, notes: string) {
    const relation = await this.prisma.relation.findUnique({ where: { id: relationId } });
    if (!relation || relation.consultantId !== consultantId) {
      throw new NotFoundException('Relation not found');
    }
    const updated = await this.prisma.relation.update({
      where: { id: relationId },
      data: { notes },
      select: { id: true, notes: true },
    });
    return { relation: updated };
  }
}


