import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    console.log('test hello nest');
    return this.appService.getHello();
  }
  @Get(':id')
  test(@Param('id') id: string): string {
    console.log('test bot=' + id);
    return this.appService.testUrl();
  }
}
