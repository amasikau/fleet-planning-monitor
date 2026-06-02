import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { basename, extname, join, resolve, sep } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'documents');
const UPLOADS_ROOT = resolve(UPLOADS_DIR);
const DOCUMENT_FILENAME_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpe?g|png|webp)$/i;
const ALLOWED_MIMES_BY_EXT: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
};

function resolveDocumentPath(filename: string) {
  if (basename(filename) !== filename || !DOCUMENT_FILENAME_RE.test(filename)) {
    throw new BadRequestException('Некорректное имя файла');
  }

  const filePath = resolve(UPLOADS_ROOT, filename);
  if (!filePath.startsWith(`${UPLOADS_ROOT}${sep}`)) {
    throw new BadRequestException('Некорректное имя файла');
  }

  return filePath;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post('documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const allowedMimes = ALLOWED_MIMES_BY_EXT[ext] ?? [];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Допустимые форматы: PDF, JPEG, PNG, WebP'),
            false,
          );
        }
      },
    }),
  )
  uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    return {
      fileName: file.originalname,
      filePath: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Get('documents/:filename')
  getDocument(@Param('filename') filename: string, @Res() res: any) {
    const filePath = resolveDocumentPath(filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Файл не найден');
    }
    res.sendFile(filePath);
  }
}
