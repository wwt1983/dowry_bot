import { Injectable } from '@nestjs/common';

import { AirtableHttpService } from './airtable.http.service';
import { TelegramService } from 'src/telegram/telegram.service';

@Injectable()
export class AirtableService {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly airtableHttpService: AirtableHttpService,
  ) {
    //
  }

  async sendDataToWebhookAirtable(tableUrl: string, data: any): Promise<any> {
    const response = await this.airtableHttpService.postWebhook(tableUrl, data);
    console.log('postWebhook ===>', response);
    if (response) {
      this.telegramService.sendMessageToChat(data);
    }
    return response;
  }
}
