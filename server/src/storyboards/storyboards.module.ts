import { StoryboardDocumentGuard } from './document.guard';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ShotlistsModule } from '../shotlists/shotlists.module';
import { StoryboardsService } from './storyboards.service';
import { StoryboardsController } from './storyboards.controller';
import { StoryboardStorage } from './storage';
import { StoryboardMedia } from './media';
@Module({
  imports: [AuthModule, ShotlistsModule],
  providers: [
    StoryboardDocumentGuard,
    StoryboardsService,
    StoryboardStorage,
    StoryboardMedia,
  ],
  controllers: [StoryboardsController],
  exports: [StoryboardsService],
})
export class StoryboardsModule {}
