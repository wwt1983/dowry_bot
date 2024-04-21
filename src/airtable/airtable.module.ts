import { Module } from '@nestjs/common';
import { AirtableService } from './airtable.service';
import { ConfigModule } from '@nestjs/config';
import { AirtableHttpService } from './airtable.http.service';
import { HttpModule } from '@nestjs/axios';
import { AirtableController } from './airtable.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 6000,
    }),
  ],
  providers: [AirtableService, AirtableHttpService],
  exports: [AirtableService, AirtableHttpService],
  controllers: [AirtableController],
})
export class AirtableModule {}
