//import { injectable, inject } from 'inversify';
import { IAirtableService } from './airtable.service.interface';
import { AirtableDto } from './dto/data.dto';
import 'reflect-metadata';
import Airtable from 'airtable';
import { Base, DataDowray } from './types';

//@injectable()
export class AirtableService implements IAirtableService {
  airtable: Airtable;

  constructor() {}
  // constructor(@inject(TYPES_DI.IConfigService) private config: IConfigService) {
  // 	this.airtable = new Airtable({ apiKey: config.get('AIRTABLE_TOKEN') });
  // }

  get(): void {
    this.airtable.base(Base).table(DataDowray[0].tableName);
  }
  getData(dto: AirtableDto): void {
    console.log(dto);
  }
}
