import { Injectable } from '@nestjs/common';
import Airtable from 'airtable';

import { Base, DataDowray } from './airtable.constants';
import { ConfigService } from '@nestjs/config';
import { AirtableHttpService } from './airtable.http.service';

@Injectable()
export class AirtableService {
  airtable: Airtable;

  constructor(
    private readonly configService: ConfigService,
    private readonly airtableHttpService: AirtableHttpService,
  ) {
    // this.airtable = new Airtable({
    //   apiKey: configService.get('AIRTABLE_TOKEN_TEST'),
    // });
  }

  get(): void {
    this.airtable.base(Base).table(DataDowray[0].tableName);
  }
  async sendDataToWebhookAirtable(tableUrl: string, data: any): Promise<any> {
    const response = await this.airtableHttpService.postWebhook(tableUrl, data);
    console.log('postWebhook ===>', response);
    return response;
  }
}
