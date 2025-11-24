import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(consultantId: number) {
    return this.prisma.event.findMany({
      where: { consultantId },
      orderBy: { start: 'asc' },
      select: {
        id: true,
        title: true,
        start: true,
        end: true,
        clientId: true,
        relationId: true,
        paymentStatus: true,
        source: true,
        recordingId: true,
        eventGroupId: true,
      },
    });
  }

  async listUpcomingForClient(clientId: number, limit = 5) {
    const now = new Date();
    const events = await this.prisma.event.findMany({
      where: { clientId, end: { gt: now } },
      orderBy: { start: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        start: true,
        end: true,
        relationId: true,
        relation: {
          select: {
            consultant: {
              select: { id: true, email: true, phone: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      relationId: e.relationId,
      consultant: e.relation.consultant,
    }));
  }

  async create(params: {
    consultantId: number;
    title: string;
    start: Date;
    end: Date;
    relationId: number;
    source?: 'MANUAL' | 'AUTO';
    recordingId?: number | null;
    weekly?: boolean;
    eventGroupId?: number | null;
  }) {
    const rel = await this.prisma.relation.findUnique({
      where: { id: params.relationId },
      select: { consultantId: true, clientId: true, isDeleted: true },
    });
    if (!rel || rel.isDeleted) {
      throw new NotFoundException('Relation not found');
    }
    if (rel.consultantId !== params.consultantId) {
      throw new ForbiddenException();
    }
    let groupId: number | null = params.eventGroupId ?? null;
    if (params.weekly && !groupId) {
      groupId = Math.floor(Date.now() / 1000);
    }

    if (params.weekly) {
      const durationMs = params.end.getTime() - params.start.getTime();
      const yearEnd = new Date(params.start.getFullYear(), 11, 31, 23, 59, 59, 999);
      const tasks: any[] = [];
      let occurrences = 0;
      let cursor = new Date(params.start);
      while (occurrences < 6 && cursor <= yearEnd) {
        const st = new Date(cursor);
        const en = new Date(st.getTime() + durationMs);
        tasks.push(
          this.prisma.event.create({
            data: {
              title: params.title,
              start: st,
              end: en,
              consultantId: params.consultantId,
              clientId: rel.clientId ?? null,
              relationId: params.relationId,
              source: (params.source as any) ?? 'MANUAL',
              recordingId: params.recordingId ?? null,
              eventGroupId: groupId ?? undefined,
            },
            select: {
              id: true,
              title: true,
              start: true,
              end: true,
              clientId: true,
              paymentStatus: true,
              recordingId: true,
              eventGroupId: true,
            },
          }),
        );
        cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
        occurrences += 1;
      }
      const createdAll = await this.prisma.$transaction(tasks);
      return createdAll[0];
    } else {
      const created = await this.prisma.event.create({
        data: {
          title: params.title,
          start: params.start,
          end: params.end,
          consultantId: params.consultantId,
          clientId: rel.clientId ?? null,
          relationId: params.relationId,
          source: (params.source as any) ?? 'MANUAL',
          recordingId: params.recordingId ?? null,
          eventGroupId: groupId ?? undefined,
        },
        select: { id: true, title: true, start: true, end: true, clientId: true, paymentStatus: true, recordingId: true, eventGroupId: true },
      });
      return created;
    }
  }

  async attachRecording(eventId: number, consultantId: number, recordingId: number) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { consultantId: true } });
    if (!event || event.consultantId !== consultantId) throw new ForbiddenException();
    return this.prisma.event.update({
      where: { id: eventId },
      data: { recordingId },
      select: { id: true, recordingId: true },
    });
  }

  async updateEventEnd(eventId: number, consultantId: number, end: Date, recordingId?: number | null, start?: Date, title?: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { consultantId: true } });
    if (!event || event.consultantId !== consultantId) throw new ForbiddenException();
    return this.prisma.event.update({
      where: { id: eventId },
      data: { end, start: start ?? undefined, title: title ?? undefined, recordingId: recordingId ?? undefined },
      select: { id: true, start: true, end: true, title: true, recordingId: true },
    });
  }

  async updatePaymentStatus(eventId: number, consultantId: number, paymentStatus: 'PAID' | 'UNPAID') {
    const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { consultantId: true } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.consultantId !== consultantId) throw new ForbiddenException();
    return this.prisma.event.update({
      where: { id: eventId },
      data: { paymentStatus },
      select: { id: true, paymentStatus: true },
    });
  }

  async delete(eventId: number, consultantId: number) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { consultantId: true } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.consultantId !== consultantId) throw new ForbiddenException();
    await this.prisma.event.delete({ where: { id: eventId } });
    return { id: eventId, deleted: true };
  }

  async deleteGroupAll(consultantId: number, groupId: number) {
    const res = await this.prisma.event.deleteMany({
      where: { consultantId, eventGroupId: groupId },
    });
    return { deletedCount: res.count };
  }

  async deleteGroupFrom(consultantId: number, groupId: number, from: Date) {
    const res = await this.prisma.event.deleteMany({
      where: { consultantId, eventGroupId: groupId, start: { gte: from } },
    });
    return { deletedCount: res.count };
  }

  async updateGroupFrom(consultantId: number, groupId: number, fromOldStart: Date, newStart: Date, newEnd: Date) {
    const items = await this.prisma.event.findMany({
      where: { consultantId, eventGroupId: groupId, start: { gte: fromOldStart } },
      orderBy: { start: 'asc' },
      select: { id: true },
    });
    const durationMs = newEnd.getTime() - newStart.getTime();
    const tx: any[] = [];
    for (let i = 0; i < items.length; i++) {
      const st = new Date(newStart.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const en = new Date(st.getTime() + durationMs);
      tx.push(this.prisma.event.update({ where: { id: items[i].id }, data: { start: st, end: en } }));
    }
    if (tx.length === 0) return { updated: 0 };
    await this.prisma.$transaction(tx);
    return { updated: tx.length };
  }
}


