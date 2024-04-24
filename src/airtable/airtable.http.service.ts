import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';

import { AIRTABLE_WEBHOOK_URL } from './airtable.constants';
import { Base, TablesDowray, AIRTABLE_URL } from './airtable.constants';

@Injectable()
export class AirtableHttpService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    //
  }

  getTable(url: string) {
    const table = TablesDowray.find((x) => x.title === url).tableName;

    console.log(`${AIRTABLE_URL}${Base}/${table}?cellFormat=json`);
    return lastValueFrom(
      this.httpService
        .get(`${AIRTABLE_URL}${Base}/${table}?cellFormat=json`, {
          headers: {
            Authorization: 'Bearer ' + this.configService.get('AIRTABLE_TOKEN'),
            'Content-Type': 'application/json',
          },
          method: 'GET',
        })
        .pipe(map((response) => response.data)),
    );
  }

  postWebhook(url: string, data: any): Promise<any> {
    return lastValueFrom(
      this.httpService
        .post(AIRTABLE_WEBHOOK_URL + url, data, {
          headers: {
            Authorization: 'Bearer ' + this.configService.get('AIRTABLE_TOKEN'),
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })
        .pipe(map((response) => response.data)),
    );
  }
}
