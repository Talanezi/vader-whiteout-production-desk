import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CallsheetsModule } from './callsheets/callsheets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CallsheetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
