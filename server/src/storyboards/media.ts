import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import type SharpFactory from 'sharp';
const sharp: typeof SharpFactory = require('sharp');
import { PDFDocument } from 'pdf-lib';
import { StoryboardStorage } from './storage';
export const MAX_ARTWORK_BYTES = 128 * 1024 * 1024;
@Injectable()
export class StoryboardMedia {
  constructor(
    private readonly db: DataSource,
    private readonly storage: StoryboardStorage,
  ) {}
  /** Called only after document authorization; file type is verified from bytes, never the suffix. */
  async upload(
    documentId: string,
    userId: number,
    file: { buffer: Buffer; originalname: string },
  ) {
    const bytes = file?.buffer;
    if (!bytes?.length || bytes.length > MAX_ARTWORK_BYTES)
      throw new BadRequestException('Choose artwork up to 128 MB.');
    const digest = createHash('sha256').update(bytes).digest('hex');
    const existing = await this.db.query(
      'SELECT id,filename,mime,width,height,bytes FROM storyboard_assets WHERE document_id=$1 AND sha256=$2',
      [documentId, digest],
    );
    if (existing[0]) return existing[0];
    let mime: string,
      width: number | undefined,
      height: number | undefined,
      thumbnail: Buffer | undefined;
    if (bytes.subarray(0, 5).toString() === '%PDF-') {
      try {
        const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
        if (pdf.getPageCount() > 500) throw new Error();
      } catch {
        throw new BadRequestException(
          'Choose a readable, unencrypted PDF with at most 500 pages.',
        );
      }
      mime = 'application/pdf';
    } else {
      try {
        const image = sharp(bytes, {
            limitInputPixels: 80_000_000,
            failOn: 'error',
          }),
          info = await image.metadata();
        if (
          !['png', 'jpeg', 'webp'].includes(info.format || '') ||
          !info.width ||
          !info.height ||
          (info.pages || 1) > 1
        )
          throw new Error();
        mime = 'image/' + (info.format === 'jpeg' ? 'jpeg' : info.format);
        width = info.width;
        height = info.height;
        thumbnail = await image
          .rotate()
          .resize({
            width: 800,
            height: 800,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        throw new BadRequestException(
          'Choose a valid PNG, JPG or WebP image (up to 80 megapixels).',
        );
      }
    }
    // Content-addressed keys make retry/race uploads converge. Never delete originals here.
    const key = `whiteout/storyboards/${documentId}/${digest}`,
      thumb = thumbnail ? key + '.thumb.webp' : null;
    await this.storage.put(key, bytes, mime);
    if (thumbnail) await this.storage.put(thumb!, thumbnail, 'image/webp');
    const rows = await this.db.query(
      `INSERT INTO storyboard_assets(id,document_id,storage_key,filename,mime,bytes,sha256,width,height,thumbnail_key,creator_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(document_id,sha256) DO UPDATE SET sha256=EXCLUDED.sha256
    RETURNING id,filename,mime,bytes,width,height`,
      [
        randomUUID(),
        documentId,
        key,
        file.originalname.replace(/[\x00-\x1f\/\\]/g, '_').slice(0, 200),
        mime,
        bytes.length,
        digest,
        width ?? null,
        height ?? null,
        thumb,
        userId,
      ],
    );
    return rows[0];
  }
  async list(documentId: string) {
    return this.db.query(
      'SELECT id,filename,mime,bytes,width,height,created_at AS "createdAt" FROM storyboard_assets WHERE document_id=$1 ORDER BY created_at,id',
      [documentId],
    );
  }
  async read(documentId: string, id: string, thumbnail = false) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        id,
      )
    )
      throw new NotFoundException('Artwork is unavailable.');
    const [asset] = await this.db.query(
      'SELECT * FROM storyboard_assets WHERE document_id=$1 AND id=$2',
      [documentId, id],
    );
    if (!asset) throw new NotFoundException('Artwork is unavailable.');
    const useThumb = thumbnail && asset.thumbnail_key;
    return {
      bytes: await this.storage.get(
        useThumb ? asset.thumbnail_key : asset.storage_key,
      ),
      mime: useThumb ? 'image/webp' : asset.mime,
      filename: asset.filename,
    };
  }
}
