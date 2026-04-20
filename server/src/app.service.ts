import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      ok: true,
      service: 'vader-whiteout-production-desk-api',
    };
  }

  getCallSheets() {
    return {
      items: [],
      total: 0,
    };
  }
}
