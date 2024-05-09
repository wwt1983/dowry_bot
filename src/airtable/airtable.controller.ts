import { Body, Controller, Get, Post } from '@nestjs/common';
import { AirtableService } from './airtable.service';

@Controller('airtable')
export class AirtableController {
  constructor(private readonly airtableService: AirtableService) {}

  @Post('signal')
  signal(@Body() data: any): string {
    return data;
  }

  @Get('offers')
  async offers(): Promise<any> {
    const result = await this.airtableService.getOffers();
    return result;
  }
}
