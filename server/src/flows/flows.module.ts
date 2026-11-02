import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ShotlistsModule } from '../shotlists/shotlists.module';
import { StoryboardStorage } from '../storyboards/storage';
import { FlowsService } from './flows.service';
import { FlowsController } from './flows.controller';
@Module({
  imports: [AuthModule, ShotlistsModule],
  providers: [FlowsService, StoryboardStorage],
  controllers: [FlowsController],
})
export class FlowsModule {}
