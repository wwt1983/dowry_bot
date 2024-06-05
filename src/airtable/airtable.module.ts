import { Global, Module } from '@nestjs/common';
import { AirtableService } from './airtable.service';
import { ConfigModule } from '@nestjs/config';
import { AirtableHttpService } from './airtable.http.service';
import { HttpModule } from '@nestjs/axios';
import { AirtableController } from './airtable.controller';
import { TelegramModule } from 'src/telegram/telegram.module';

@Global()
@Module({
  imports: [
    TelegramModule,
    ConfigModule,
    HttpModule.register({
      timeout: 30000,
    }),
  ],
  providers: [AirtableService, AirtableHttpService],
  exports: [AirtableService, AirtableHttpService],
  controllers: [AirtableController],
})
export class AirtableModule {}
