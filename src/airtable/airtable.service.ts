import { Injectable } from '@nestjs/common';

import { AirtableHttpService } from './airtable.http.service';
import { ConfigService } from '@nestjs/config';
import { FILTER_BY_FORMULA, TablesName } from './airtable.constants';
import { IOffer, IOffers } from './types/IOffer.interface';

@Injectable()
export class AirtableService {
  constructor(
    private readonly airtableHttpService: AirtableHttpService,
    private readonly configService: ConfigService,
  ) {}

  async saveToAirtable(data: any): Promise<any> {
    const tableUrl = this.configService.get(
      'AIRTABLE_WEBHOOK_URL_FOR_TABlE_BOT',
    );
    const response = await this.airtableHttpService.postWebhook(tableUrl, data);
    console.log('postWebhook ===>', response);
    return response;
  }
  async updateToAirtable(data: any): Promise<any> {
    const tableUrl = this.configService.get(
      'AIRTABLE_WEBHOOK_URL_FOR_TABlE_BOT_UPDATE',
    );
    const response = await this.airtableHttpService.postWebhook(tableUrl, data);
    console.log('postWebhook ===>', response);
    return response;
  }
  async getDistribution(): Promise<any> {
    const filter = `&${FILTER_BY_FORMULA}=SEARCH("In progress",{Status})`;
    return await this.airtableHttpService.get(TablesName.Distributions, filter);
  }
  async getOffers(): Promise<IOffers> {
    const filter = `&${FILTER_BY_FORMULA}=OR({Status}="In progress", {Status}="Scheduled")`;
    return await this.airtableHttpService.get(TablesName.Offers, filter);
  }
  async getOffer(id: string): Promise<IOffer> {
    return await this.airtableHttpService.getById(TablesName.Offers, id);
  }
}
