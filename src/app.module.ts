import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AirtableModule } from './airtable/airtable.module';
import { TelegramModule } from './telegram/telegram.module';
import appConfig from './configs/app.config';
import telegramConfig from './telegram/configs/telegram.config';
import { FirebaseModule } from './firebase/firebase.module';
import { TelegramController } from './telegram/telegram.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
    }),
    AirtableModule,
    TelegramModule.forRootAsync({
      imports: [ConfigModule, FirebaseModule, AirtableModule, HttpModule],
      inject: [ConfigService],
      useFactory: telegramConfig,
    }),
    FirebaseModule,
  ],
  controllers: [AppController, TelegramController],
  providers: [AppService],
})
export class AppModule {}
