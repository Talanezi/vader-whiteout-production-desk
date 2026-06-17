import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RosterPersonEntity } from './entities/roster-person.entity';
import { RosterController } from './roster.controller';
import { RosterService } from './roster.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RosterPersonEntity]),
    AuthModule,
  ],
  controllers: [RosterController],
  providers: [RosterService],
  exports: [RosterService],
})
export class RosterModule {}
