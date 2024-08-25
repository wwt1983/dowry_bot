import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';
import { SMS_URL, CALL_PASSWORD } from './sms.constants';
import { SmsResponse } from './sms.types';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class SmsService {
  authHeader = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService,
  ) {
    this.authHeader = {
      'X-Token': this.configService.get('VITE_SMS'),
      'Content-Type': 'application/json; charset=UTF-8',
    };
  }
  async sendSms(phone: string): Promise<{ id: string } | string> {
    const result: SmsResponse = await lastValueFrom(
      this.httpService
        .post(
          SMS_URL + CALL_PASSWORD,
          JSON.stringify({
            recipient: phone,
          }),
          {
            headers: this.authHeader,
            method: 'POST',
          },
        )
        .pipe(map((response) => response.data)),
    );
    if (result && result.success) {
      this.firebaseService.saveSmsCode(result.result.id, result.result.code);
      return { id: result.result.id };
    }
    return result?.error?.descr;
  }

  async checkCode(id: string, code: string): Promise<boolean> {
    return await this.firebaseService.checkSmsCode(id, code);
  }
}
