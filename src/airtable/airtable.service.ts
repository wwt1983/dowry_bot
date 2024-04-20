import { Injectable } from '@nestjs/common';
import Airtable from 'airtable';

import { Base, DataDowray } from './types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AirtableService {
  airtable: Airtable;

  constructor(private readonly configService: ConfigService) {
    // this.airtable = new Airtable({
    //   apiKey: configService.get('AIRTABLE_TOKEN_TEST'),
    // });
    console.log('test_token=', configService.get('AIRTABLE_TOKEN_TEST'));
  }

  get(): void {
    this.airtable.base(Base).table(DataDowray[0].tableName);
  }
}
