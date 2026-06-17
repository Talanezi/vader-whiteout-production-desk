import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CallsheetsModule } from './callsheets/callsheets.module';
import { CallSheetDraftEntity } from './callsheets/entities/callsheet-draft.entity';
import { RosterPersonEntity } from './roster/entities/roster-person.entity';
import { RosterModule } from './roster/roster.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: configService.get<string>('DATABASE_URL')?.includes('railway')
          ? { rejectUnauthorized: false }
          : false,
        entities: [CallSheetDraftEntity, RosterPersonEntity],
      }),
    }),
    CallsheetsModule,
    RosterModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
