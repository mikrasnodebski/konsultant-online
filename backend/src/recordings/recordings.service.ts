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
    // Jeśli znamy relationId, wyprowadź prawidłowe consultantId i clientId z relacji
    let consultantId = params.consultantId ?? null;
    let clientId = params.clientId ?? null;
    if (params.relationId) {
      try {
        const rel = await this.prisma.relation.findUnique({
          where: { id: params.relationId },
          select: { consultantId: true, clientId: true },
        });
        if (rel) {
          consultantId = rel.consultantId ?? consultantId;
          clientId = rel.clientId ?? clientId;
        }
      } catch {}
    }
    const rec = await this.prisma.recording.create({
      data: {
        relationId: params.relationId ?? null,
        consultantId: consultantId ?? null,
        clientId: clientId ?? null,
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
    // Pobierz nagrania przypięte do relacji lub te przypisane bezpośrednio do klienta
    const recs = await this.prisma.recording.findMany({
      where: {
        OR: [
          relationIds.length > 0 ? { relationId: { in: relationIds } } : undefined,
          { clientId },
        ].filter(Boolean) as any,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, mimeType: true, durationMs: true, createdAt: true, relationId: true, consultantId: true },
    });
    const byId = new Map(relations.map((r) => [r.id, r]));

    // Zbierz konsultantów dla nagrań bez relationId
    const orphanConsultantIds = Array.from(
      new Set(recs.filter((r) => !r.relationId && r.consultantId).map((r) => r.consultantId!)),
    );
    const orphanConsultants =
      orphanConsultantIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: orphanConsultantIds } },
            select: { id: true, email: true, phone: true, firstName: true, lastName: true },
          })
        : [];
    const orphanById = new Map(orphanConsultants.map((u) => [u.id, u]));

    return recs.map((r) => {
      const fromRelation = r.relationId ? byId.get(r.relationId)?.consultant ?? null : null;
      const fromOrphan = !fromRelation && r.consultantId ? orphanById.get(r.consultantId) ?? null : null;
      return {
        id: r.id,
        mimeType: r.mimeType,
        durationMs: r.durationMs,
        createdAt: r.createdAt,
        consultant: fromRelation || fromOrphan || null,
      };
    });
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


