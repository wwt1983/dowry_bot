import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  //метод нужен для запуска туннеля как входная точка
  @Get()
  sayHi(): string {
    console.log('test hello nest');
    return this.appService.getHello();
  }
  
  @Get('startbot')
  getHello(): string {
    console.log('test hello nest');
    return this.appService.getHello();
  }
}
