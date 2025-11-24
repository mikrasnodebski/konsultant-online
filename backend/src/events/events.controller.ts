import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtGuard } from '../auth/jwt.guard';
import { Delete } from '@nestjs/common';

@Controller('events')
@UseGuards(JwtGuard)
export class EventsController {
  constructor(private readonly svc: EventsService) {}

  @Get('my')
  async my(@Req() req: any) {
    const userId = req.user?.userId as number;
    return this.svc.listMine(userId);
  }

  @Get('my-upcoming-client')
  async myUpcomingClient(@Req() req: any) {
    const userId = req.user?.userId as number;
    return this.svc.listUpcomingForClient(userId, 5);
  }

  @Post()
  async create(
    @Req() req: any,
    @Body()
    body: {
      title: string;
      start: string;
      end: string;
      relationId: number;
      source?: 'MANUAL' | 'AUTO';
      recordingId?: number | null;
      weekly?: boolean;
      eventGroupId?: number | null;
    },
  ) {
    const userId = req.user?.userId as number;
    return this.svc.create({
      consultantId: userId,
      title: body.title,
      start: new Date(body.start),
      end: new Date(body.end),
      relationId: Number(body.relationId),
      source: body.source,
      recordingId: body.recordingId ?? null,
      weekly: body.weekly,
      eventGroupId: body.eventGroupId ?? null,
    });
  }

  @Patch(':id/recording')
  @UseGuards(JwtGuard)
  async attachRecording(@Param('id') id: string, @Body() body: { recordingId: number }, @Req() req: any) {
    const userId = req.user?.userId as number;
    return this.svc.attachRecording(Number(id), userId, Number(body.recordingId));
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  async updateEnd(@Param('id') id: string, @Body() body: { start?: string; end: string; title?: string; recordingId?: number | null }, @Req() req: any) {
    const userId = req.user?.userId as number;
    return this.svc.updateEventEnd(
      Number(id),
      userId,
      new Date(body.end),
      body.recordingId ?? null,
      body.start ? new Date(body.start) : undefined,
      body.title,
    );
  }

  @Patch(':id/payment')
  async updatePayment(@Req() req: any, @Param('id') id: string, @Body() body: { status: 'PAID' | 'UNPAID' }) {
    const userId = req.user?.userId as number;
    return this.svc.updatePaymentStatus(Number(id), userId, body.status);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId as number;
    return this.svc.delete(Number(id), userId);
  }

  @Delete('group/:groupId')
  async removeGroup(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Body() body: { scope?: 'ALL' | 'FROM'; from?: string },
  ) {
    const userId = req.user?.userId as number;
    const scope = body?.scope ?? 'ALL';
    if (scope === 'FROM') {
      const from = body?.from ? new Date(body.from) : new Date();
      return this.svc.deleteGroupFrom(userId, Number(groupId), from);
    }
    return this.svc.deleteGroupAll(userId, Number(groupId));
  }

  @Patch('group/:groupId')
  async updateGroup(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Body() body: { fromOldStart: string; start: string; end: string },
  ) {
    const userId = req.user?.userId as number;
    return this.svc.updateGroupFrom(userId, Number(groupId), new Date(body.fromOldStart), new Date(body.start), new Date(body.end));
  }
}


