import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { Observable, lastValueFrom, map } from 'rxjs';
import { AIRTABLE_WEBHOOK_URL } from './airtable.constants';

@Injectable()
export class AirtableHttpService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    //
  }
  get<T>(url: string): Observable<AxiosResponse<T>> {
    try {
      const response = this.httpService.get(url);
      return response;
    } catch (error) {
      console.log(error);
    }
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
