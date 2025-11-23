import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import type { Response } from 'express';

function filename(_, file: any, cb: (error: Error | null, filename: string) => void) {
  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  cb(null, unique + extname(file.originalname || ''));
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename,
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file: any) {
    return { url: `/uploads/${file.filename}` };
  }

  @Post('db')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadDb(@UploadedFile() file: any) {
    if (!file || !file.buffer) {
      throw new Error('No file uploaded');
    }
    let pngBuffer: Buffer = file.buffer;
    let mimeType = 'image/png';

    try {
      const sharp = require('sharp');
      pngBuffer = await sharp(file.buffer).png().toBuffer();
      mimeType = 'image/png';
    } catch {
      pngBuffer = file.buffer;
      mimeType = file.mimetype || 'application/octet-stream';
    }

    const image = await this.prisma.image.create({
      data: { mimeType, data: Buffer.from(pngBuffer) as any },
      select: { id: true },
    });
    return { url: `/uploads/db/${image.id}` };
  }

  @Get('db/:id')
  async getDb(@Param('id') id: string, @Res() res: Response) {
    const image = await this.prisma.image.findUnique({ where: { id: Number(id) } });
    if (!image) {
      return res.status(404).send('Not found');
    }
    res.setHeader('Content-Type', image.mimeType || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.end(Buffer.from(image.data as any));
  }
}


