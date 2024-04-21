import { Body, Controller, Post } from '@nestjs/common';

@Controller('airtable')
export class AirtableController {
  @Post('signal')
  signal(@Body() data: any): string {
    console.log('data siganl=', data);
    return data;
  }
}
