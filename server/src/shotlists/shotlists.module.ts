import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ShotlistsService } from './shotlists.service';
import { ShotlistsController } from './shotlists.controller';

@Module({
  imports: [AuthModule],
  providers: [ShotlistsService],
  controllers: [ShotlistsController],
  exports: [ShotlistsService],
})
export class ShotlistsModule {}
