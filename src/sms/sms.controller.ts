import { Body, Controller, Post } from '@nestjs/common';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('sendSms')
  async sendSms(
    @Body() data: { phone: string },
  ): Promise<{ id: string } | string> {
    console.log('sms===', data);
    return { id: 'raoydbdetxuicd1awsgdyagtmjjlr6hy' };
    return await this.smsService.sendSms(data.phone);
  }

  @Post('checkCode')
  async checkCode(
    @Body() data: { id: string; code: string },
  ): Promise<boolean> {
    console.log('id ===', data);
    return await this.smsService.checkCode(data.id, data.code);
  }
}
