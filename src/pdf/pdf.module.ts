import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PdfService } from './pdf.service';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { AirtableService } from 'src/airtable/airtable.service';

@Module({
  imports: [FirebaseModule, ConfigModule], // Import FirebaseModule here
  providers: [PdfService, AirtableService],
})
export class PdfModule {}
