import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  //метод нужен для запуска туннеля как входная точка
  @Get('test')
  test(): string {
    console.log('test hello nest hello http');
    return this.appService.getHello();
  }
  @Get('test2')
  test(): string {
    console.log('test hello nest hello http');
    return 'test';
  }
  @Get('startbot')
  getHello(): string {
    console.log('test hello bot');
    return this.appService.getHello();
  }
}
