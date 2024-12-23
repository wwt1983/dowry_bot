import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, lastValueFrom, map } from 'rxjs';

import { AIRTABLE_WEBHOOK_URL } from './airtable.constants';
import { TablesDowray, AIRTABLE_URL } from './airtable.constants';

@Injectable()
export class AirtableHttpService {
  authHeader = null;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authHeader = {
      Authorization: 'Bearer ' + this.configService.get('AIRTABLE_TOKEN'),
      'Content-Type': 'application/json',
    };
  }

  get(url: string, filter?: string) {
    const table = TablesDowray.find((x) => x.title === url).tableName;

    return lastValueFrom(
      this.httpService
        .get(`${AIRTABLE_URL}/${table}?cellFormat=json${filter || ''}`, {
          headers: this.authHeader,
          method: 'GET',
        })
        .pipe(map((response) => response.data)),
    );
  }
  /**
   * запрос к внешним апи
   */
  getMpstats(url: string) {
    return lastValueFrom(
      this.httpService
        .get(url, {
          headers: {
            'X-Mpstats-TOKEN': this.configService.get('MPSTATS_TOKEN'),
            'Content-Type': 'application/json',
          },
          method: 'GET',
        })
        .pipe(map((response) => response.data)),
    );
  }
  getById(url: string, id: string) {
    const table = TablesDowray.find((x) => x.title === url).tableName;

    return firstValueFrom(
      this.httpService
        .get(`${AIRTABLE_URL}/${table}/${id}`, {
          headers: this.authHeader,
          method: 'GET',
        })
        .pipe(map((response) => response.data)),
    );
  }

  update(name: string, id: string, data: any) {
    const table = TablesDowray.find((x) => x.title === name).tableName;
    return lastValueFrom(
      this.httpService
        .patch(
          `${AIRTABLE_URL}/${table}/${id}`,
          {
            fields: data,
          },
          {
            headers: this.authHeader,
            method: 'PATCH',
          },
        )
        .pipe(map((response) => response.data)),
    );
  }

  postWebhook(url: string, data: any): Promise<any> {
    return lastValueFrom(
      this.httpService
        .post(AIRTABLE_WEBHOOK_URL + url, data, {
          headers: this.authHeader,
          method: 'POST',
        })
        .pipe(map((response) => response.data)),
    );
  }

  post(name: string, data: any): Promise<any> {
    const table = TablesDowray.find((x) => x.title === name).tableName;
    return lastValueFrom(
      this.httpService
        .post(
          `${AIRTABLE_URL}/${table}`,
          {
            fields: data,
          },
          {
            headers: this.authHeader,
            method: 'POST',
          },
        )
        .pipe(map((response) => response.data)),
    );
  }
}
