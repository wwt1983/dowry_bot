import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PdfService } from './pdf.service';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { AirtableService } from 'src/airtable/airtable.service';
import { BotLoggerModule } from 'src/logs/botlogger.module';

@Module({
  imports: [FirebaseModule, ConfigModule, BotLoggerModule], // Import FirebaseModule here
  providers: [PdfService, AirtableService],
})
export class PdfModule {}
