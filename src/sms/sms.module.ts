import { Module } from '@nestjs/common';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30000,
    }),
    FirebaseModule,
  ],
  controllers: [SmsController],
  providers: [SmsService],
})
export class SmsModule {}
