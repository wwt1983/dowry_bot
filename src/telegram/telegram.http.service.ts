import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

import { AirtableHttpService } from '../airtable/airtable.http.service';

import { firstValueFrom, map } from 'rxjs';

@Injectable()
export class TelegramHttpService {
  constructor(
    private readonly airtableHttpService: AirtableHttpService,
    private readonly httpService: HttpService,
  ) {
    //
  }

  get(url: string) {
    return firstValueFrom(
      this.httpService
        .get(url, {
          method: 'GET',
        })
        .pipe(map((response) => response.data)),
    );
  }
}
