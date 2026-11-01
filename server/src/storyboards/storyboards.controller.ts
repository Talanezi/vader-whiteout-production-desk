import { renderStoryboard, BoardPrint } from './pdf/export';
import {
  Body,
  Header,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SchedulerAuthGuard } from '../auth/scheduler-auth.guard';
import type { Collaborator } from '../shotlists/shotlists.service';
import { StoryboardsService } from './storyboards.service';
import { StoryboardDocumentGuard } from './document.guard';
import { StoryboardMedia, MAX_ARTWORK_BYTES } from './media';
@UseGuards(SchedulerAuthGuard)
@Controller('api/storyboards')
export class StoryboardsController {
  constructor(
    private readonly boards: StoryboardsService,
    private readonly media: StoryboardMedia,
  ) {}
  @Get() list(@Req() req: { user: Collaborator }) {
    return this.boards.list(req.user);
  }
  @Get('shotlinks') shotLinks(
    @Req() req: { user: Collaborator },
    @Query('listId') listId: string,
    @Query('shotId') shotId: string,
  ) {
    return this.boards.shotLinks(req.user, listId, shotId);
  }
  @Post() create(@Req() req: { user: Collaborator }, @Body() body: any) {
    return this.boards.create(req.user, body || {});
  }
  @Get(':id/session') session(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
  ) {
    return this.boards.session(id, req.user);
  }
  @Get(':id/snapshot') snapshot(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
  ) {
    return this.boards.snapshot(id, req.user);
  }
  @Post(':id/manage') manage(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.boards.manage(id, req.user, body || {});
  }
  @Header('Cache-Control', 'private, no-store')
  @Header('Vary', 'Authorization')
  @UseGuards(StoryboardDocumentGuard)
  @Post(':id/pdf')
  async pdf(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
    @Body() spec: BoardPrint,
  ) {
    if (!spec || typeof spec !== 'object' || Array.isArray(spec))
      throw new BadRequestException('Choose valid PDF options.');
    if (
      (spec.paper !== undefined && !['letter', 'a4'].includes(spec.paper)) ||
      (spec.orientation !== undefined &&
        !['landscape', 'portrait'].includes(spec.orientation)) ||
      ['notes', 'shots', 'annotations'].some(
        (key) =>
          (spec as Record<string, unknown>)[key] !== undefined &&
          typeof (spec as Record<string, unknown>)[key] !== 'boolean',
      )
    )
      throw new BadRequestException('Choose valid paper and display options.');
    const state = await this.boards.snapshot(id, req.user, true),
      revisions = state.revisions as Record<string, any>;
    const selected = spec.panels;
    if (
      selected &&
      (!Array.isArray(selected) ||
        selected.length > 3000 ||
        new Set(selected).size !== selected.length)
    )
      throw new BadRequestException('Invalid panel selection.');
    const records = Object.values(state.panels)
      .filter(
        (p: any) => !p.deletedAt && (!selected || selected.includes(p.id)),
      )
      .sort((a: any, b: any) => a.order - b.order) as any[];
    if (selected && records.length !== selected.length)
      throw new BadRequestException(
        'The selected panels changed. Refresh the preview.',
      );
    const pdf = await renderStoryboard(
      String(state.meta.name || 'Storyboard'),
      records.map((p) => ({
        ...p,
        assetId: revisions[p.activeRevision]?.assetId,
      })),
      spec,
      async (assetId) => (await this.media.read(id, assetId)).bytes,
      Object.values(state.annotations),
      (links) => this.boards.shotLabels(links, req.user),
    );
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: 'attachment; filename="whiteout-storyboard.pdf"',
    });
  }
  @Get(':id/assets') async assets(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
  ) {
    await this.boards.authorize(id, req.user);
    return { items: await this.media.list(id) };
  }
  @Post(':id/assets')
  @UseGuards(StoryboardDocumentGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_ARTWORK_BYTES, files: 1, fields: 0 },
    }),
  )
  async upload(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    await this.boards.authorize(id, req.user);
    if (!file) throw new BadRequestException('Choose artwork.');
    return this.media.upload(id, req.user.userID, file);
  }
  @Header('Cache-Control', 'private, no-store')
  @Header('Vary', 'Authorization')
  @Header('X-Content-Type-Options', 'nosniff')
  @Get(':id/assets/:assetId')
  async download(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @Query('thumbnail') thumbnail?: string,
  ) {
    await this.boards.authorize(id, req.user);
    const asset = await this.media.read(id, assetId, thumbnail === '1');
    return new StreamableFile(asset.bytes, {
      type: asset.mime,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(asset.filename)}`,
    });
  }
}
