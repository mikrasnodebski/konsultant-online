import { Body, Controller, Delete, Get, Param, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RecordingsService } from './recordings.service';
import type { Response } from 'express';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('recordings')
export class RecordingsController {
  constructor(private readonly svc: RecordingsService) {}

  @Post()
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('recording', {
      storage: memoryStorage(),
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: any,
    @Body() body: { relationId?: string; durationMs?: string; mimeType?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.userId as number | undefined;
    if (!file || !file.buffer) {
      throw new Error('No file uploaded');
    }
    const duration = Number(body?.durationMs ?? 0) || 0;
    const mime = body?.mimeType || file.mimetype || 'video/webm';
    const saved = await this.svc.create({
      relationId: body?.relationId ? Number(body.relationId) : null,
      consultantId: userId ?? null,
      clientId: null,
      mimeType: mime,
      durationMs: duration,
      data: Buffer.from(file.buffer),
    });
    return saved;
  }

  // Ważne: statyczna ścieżka przed dynamiczną ':id'
  @Get('my-client')
  @UseGuards(JwtGuard)
  async listMineAsClient(@Req() req: any) {
    const userId = req.user?.userId as number;
    return this.svc.listForClient(userId);
  }

  @Get()
  @UseGuards(JwtGuard)
  async list(@Query('relationId') relationId?: string) {
    if (!relationId) return [];
    const rid = Number(relationId);
    if (!Number.isFinite(rid)) return [];
    return this.svc.listByRelation(rid);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const rec = await this.svc.getBinary(id);
    if (!rec) {
      return res.status(404).send('Not found');
    }
    res.setHeader('Content-Type', rec.mimeType || 'video/webm');
    res.setHeader('Cache-Control', 'private, max-age=31536000');
    const bin = (rec.data as unknown) as Buffer | Uint8Array;
    const buf = Buffer.isBuffer(bin) ? bin : Buffer.from(bin);
    return res.end(buf);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.userId as number;
    return this.svc.delete(id, userId);
  }
}


