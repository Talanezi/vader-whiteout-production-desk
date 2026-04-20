import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CallsheetsModule } from './callsheets/callsheets.module';
import { CallSheetDraftEntity } from './callsheets/entities/callsheet-draft.entity';

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
      }),
    }),
    TypeOrmModule.forFeature([CallSheetDraftEntity]),
    CallsheetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
