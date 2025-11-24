import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecordingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    relationId?: number | null;
    consultantId?: number | null;
    clientId?: number | null;
    mimeType: string;
    durationMs: number;
    data: Buffer;
  }) {
    const rec = await this.prisma.recording.create({
      data: {
        relationId: params.relationId ?? null,
        consultantId: params.consultantId ?? null,
        clientId: params.clientId ?? null,
        mimeType: params.mimeType,
        durationMs: params.durationMs,
        data: Buffer.from(params.data),
      },
      select: { id: true },
    });
    return { id: rec.id };
  }

  async getBinary(id: number) {
    const rec = await this.prisma.recording.findUnique({
      where: { id },
      select: { data: true, mimeType: true },
    });
    return rec;
  }

  async listByRelation(relationId: number) {
    return this.prisma.recording.findMany({
      where: { relationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        mimeType: true,
        durationMs: true,
        createdAt: true,
      },
    });
  }

  async listForClient(clientId: number) {
    const relations = await this.prisma.relation.findMany({
      where: { clientId, isDeleted: false },
      select: {
        id: true,
        consultant: { select: { id: true, email: true, phone: true, firstName: true, lastName: true } },
      },
    });
    const relationIds = relations.map((r) => r.id);
    if (relationIds.length === 0) return [];
    const recs = await this.prisma.recording.findMany({
      where: { relationId: { in: relationIds } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, mimeType: true, durationMs: true, createdAt: true, relationId: true },
    });
    const byId = new Map(relations.map((r) => [r.id, r]));
    return recs.map((r) => ({
      id: r.id,
      mimeType: r.mimeType,
      durationMs: r.durationMs,
      createdAt: r.createdAt,
      consultant: byId.get(r.relationId!)?.consultant ?? null,
    }));
  }

  async delete(id: number, userId: number) {
    const rec = await this.prisma.recording.findUnique({
      where: { id },
      select: { consultantId: true },
    });
    if (!rec) {
      throw new NotFoundException('Recording not found');
    }
    if (rec.consultantId !== userId) {
      throw new ForbiddenException();
    }
    await this.prisma.recording.delete({ where: { id } });
    return { ok: true };
  }
}


