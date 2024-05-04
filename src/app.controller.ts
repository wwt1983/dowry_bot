import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('test')
  test(): string {
    console.log('test hello nest hello https');
    return this.appService.getHello();
  }  
  
  //метод нужен для запуска туннеля как входная точка
  @Get('')
  start(): string {
    console.log('test hello https - 1');
    return 'test https';
  }
  @Get('startbot')
  getHello(): string {
    console.log('test hello bot');
    return this.appService.getHello();
  }
}
