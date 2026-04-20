import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CallsheetsService } from './callsheets.service';
import { CallSheetDraft } from './callsheet.types';

@Controller('api/callsheets')
export class CallsheetsController {
  constructor(private readonly callsheetsService: CallsheetsService) {}

  @Get()
  list() {
    return this.callsheetsService.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.callsheetsService.getById(id);
  }

  @Post()
  create(@Body() payload: Partial<CallSheetDraft>) {
    return this.callsheetsService.create(payload);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: Partial<CallSheetDraft>) {
    return this.callsheetsService.update(id, payload);
  }
}
