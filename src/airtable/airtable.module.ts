import { Module } from '@nestjs/common';
import { AirtableService } from './airtable.service';
import { ConfigModule } from '@nestjs/config';
import { AirtableWebhookService } from './airtable.webhook.service';

@Module({
  imports: [ConfigModule],
  providers: [AirtableService, AirtableWebhookService],
  exports: [AirtableService, AirtableWebhookService]
})
export class AirtableModule {}
