import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AirtableService } from './airtable.service';

@Controller('airtable')
export class AirtableController {
  constructor(private readonly airtableService: AirtableService) {}

  @Post('signal')
  signal(@Body() data: any): string {
    return data;
  }

  @Get('offers')
  async offers(@Query('type') type?: 'stop' | 'schedule'): Promise<any> {
    try {
      const result = await this.airtableService.getOffers(type);
      return result;
    } catch (error) {
      console.log('offers', error);
      return null;
    }
  }

  @Post('checkPhone')
  async checkPhone(@Body() data: { phone: string }): Promise<boolean> {
    console.log('data ===', data);
    return await this.airtableService.checkPhone(data.phone);
  }

  @Get('buyers')
  async buyers(): Promise<any> {
    try {
      const result = await this.airtableService.findBuyersWithChatId();
      return result;
    } catch (error) {
      console.log('buyers', error);
      return null;
    }
  }
}
