import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { SchedulerAuthGuard } from '../auth/scheduler-auth.guard';
import type { Collaborator } from '../shotlists/shotlists.service';
import { StoryboardStorage } from '../storyboards/storage';
import { FlowsService } from './flows.service';
import { FlowPrint, renderFlow } from './pdf';
/** Check the ZIP central directory before storing an XLSX. No workbook formulas are executed. */
export function checkWorkbook(b: Buffer) {
  if (
    b.length > 12 * 1024 * 1024 ||
    b.length < 22 ||
    b.readUInt32LE(0) !== 0x04034b50
  )
    throw new BadRequestException('Choose a valid XLSX up to 12 MB.');
  let e = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--)
    if (b.readUInt32LE(i) === 0x06054b50) {
      e = i;
      break;
    }
  if (e < 0) throw new BadRequestException('Invalid XLSX archive.');
  const count = b.readUInt16LE(e + 10),
    size = b.readUInt32LE(e + 12),
    offset = b.readUInt32LE(e + 16);
  if (count > 2000 || offset + size > e)
    throw new BadRequestException('Workbook archive is too large.');
  let p = offset,
    total = 0,
    types = false;
  for (let i = 0; i < count; i++) {
    if (p + 46 > b.length || b.readUInt32LE(p) !== 0x02014b50)
      throw new BadRequestException('Invalid archive directory.');
    const bytes = b.readUInt32LE(p + 24),
      n = b.readUInt16LE(p + 28),
      extra = b.readUInt16LE(p + 30),
      comment = b.readUInt16LE(p + 32),
      name = b.subarray(p + 46, p + 46 + n).toString();
    if (name === '[Content_Types].xml') types = true;
    if (/vbaProject|\.bin$/i.test(name))
      throw new BadRequestException(
        'Macro-enabled workbooks are not supported.',
      );
    total += bytes;
    if (total > 60 * 1024 * 1024 || bytes > 25 * 1024 * 1024)
      throw new BadRequestException(
        'Expanded workbook exceeds safe processing limits.',
      );
    p += 46 + n + extra + comment;
    if (p > offset + size)
      throw new BadRequestException('Invalid archive directory.');
  }
  if (!types) throw new BadRequestException('Choose an XLSX workbook.');
}
@UseGuards(SchedulerAuthGuard)
@Controller('api/flows')
export class FlowsController {
  constructor(
    private readonly flows: FlowsService,
    private readonly storage: StoryboardStorage,
    private readonly db: DataSource,
  ) {}
  @Get() list(@Req() r: { user: Collaborator }) {
    return this.flows.list(r.user);
  }
  @Post() create(@Req() r: { user: Collaborator }, @Body() b: any) {
    return this.flows.create(r.user, b);
  }
  @Get(':id/session') session(
    @Req() r: { user: Collaborator },
    @Param('id') id: string,
  ) {
    return this.flows.session(id, r.user);
  }
  @Get(':id/snapshot') snapshot(
    @Req() r: { user: Collaborator },
    @Param('id') id: string,
  ) {
    return this.flows.resolved(id, r.user);
  }
  @Post(':id/manage') manage(
    @Req() r: { user: Collaborator },
    @Param('id') id: string,
    @Body() b: any,
  ) {
    return this.flows.manage(id, r.user, b);
  }
  @Get(':id/revisions') revisions(
    @Req() r: { user: Collaborator },
    @Param('id') id: string,
  ) {
    return this.flows.revisions(id, r.user);
  }
  @Get(':id/revisions/:revision') revision(
    @Req() r: { user: Collaborator },
    @Param('id') id: string,
    @Param('revision') revision: string,
  ) {
    return this.flows.revisions(id, r.user, revision);
  }
  @Post(':id/pdf')
  @Header('Cache-Control', 'private, no-store')
  @Header('Vary', 'Authorization')
  async pdf(
    @Req() r: { user: Collaborator },
    @Param('id') id: string,
    @Body() b: FlowPrint,
  ) {
    const { state, source } = await this.flows.resolved(id, r.user);
    try {
      const bytes = await renderFlow(state, source, b);
      const key = await this.flows.recordPrint(
        id,
        r.user,
        { state, source },
        b,
        bytes,
      );
      return new StreamableFile(bytes, {
        type: 'application/pdf',
        disposition: `attachment; filename="whiteout-flow-${key.slice(0, 10)}.pdf"`,
      });
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }
  @Get(':id/prints/:key')
  @Header('Cache-Control', 'private, no-store')
  async artifact(
    @Req() r: { user: Collaborator },
    @Param('id') id: string,
    @Param('key') key: string,
  ) {
    return new StreamableFile(await this.flows.printArtifact(id, key, r.user), {
      type: 'application/pdf',
    });
  }
  @Post(':id/sources')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 12 * 1024 * 1024, files: 1, fields: 0 },
    }),
  )
  async upload(
    @Req() r: { user: Collaborator },
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    await this.flows.authorize(id, r.user);
    if (!file) throw new BadRequestException('Choose a workbook.');
    checkWorkbook(file.buffer);
    const hash = createHash('sha256').update(file.buffer).digest('hex'),
      key = `flows/${id}/sources/${hash}.xlsx`;
    await this.storage.put(
      key,
      file.buffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await this.db.query(
      'INSERT INTO flow_sources(id,document_id,storage_key,filename,sha256,bytes,creator_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(document_id,sha256) DO NOTHING',
      [
        randomUUID(),
        id,
        key,
        String(file.originalname).slice(0, 250),
        hash,
        file.buffer.length,
        r.user.userID,
      ],
    );
    return { sha256: hash };
  }
  @Get(':id/sources/:hash')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async source(
    @Req() r: { user: Collaborator },
    @Param('id') id: string,
    @Param('hash') hash: string,
  ) {
    await this.flows.authorize(id, r.user);
    const [row] = await this.db.query(
      'SELECT storage_key,filename FROM flow_sources WHERE document_id=$1 AND sha256=$2',
      [id, hash],
    );
    if (!row) throw new BadRequestException('Original workbook unavailable.');
    return new StreamableFile(await this.storage.get(row.storage_key), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(row.filename)}`,
    });
  }
}
