import { AirtableDto } from './dto/data.dto';

export interface IAirtableService {
  getData: (dto: AirtableDto) => void;
}
