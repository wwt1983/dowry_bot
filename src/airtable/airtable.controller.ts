import { Body, Controller, Get, Post } from '@nestjs/common';
import { AirtableService } from './airtable.service';
import { ITest } from './types/ITest.interface';
@Controller('airtable')
export class AirtableController {
  constructor(private readonly airtableService: AirtableService) {}

  @Post('signal')
  signal(@Body() data: any): string {
    return data;
  }

  @Get('distribution')
  async distribution(): Promise<ITest> {
    return await this.airtableService.getDistribution();
  }
}
