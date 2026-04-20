import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      ok: true,
      service: 'vader-whiteout-ad-console-api',
    };
  }

  getCallSheets() {
    return {
      items: [],
      total: 0,
    };
  }
}
