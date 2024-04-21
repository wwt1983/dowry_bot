import { Body, Controller, Post } from '@nestjs/common';
import { AirtableService } from './airtable.service';
import { ConfigService } from '@nestjs/config';

@Controller('airtable')
export class AirtableController {
  constructor(
    private readonly airtableService: AirtableService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signal')
  signal(@Body() data: any): string {
    const url = this.configService.get(
      'AIRTABLE_WEBHOOK_URL_FOR_TABlE_TEST_API',
    );
    console.log('data siganl=', url);
    this.airtableService.sendDataToWebhookAirtable(url, data);
    return data;
  }
}
