import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-rollbar';
import { ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AirtableModule } from './airtable/airtable.module';
import { TelegramModule } from './telegram/telegram.module';
import appConfig from './configs/app.config';
import telegramConfig from './telegram/configs/telegram.config';
import { AirtableService } from './airtable/airtable.service';
import { FirebaseModule } from './firebase/firebase.module';
import { TelegramController } from './telegram/telegram.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        accessToken: configService.get('ROLLBAR_TOKEN'),
        environment: configService.get('ENVIRONMENT'),
      }),
    }),
    AirtableModule,
    TelegramModule.forRootAsync({
      imports: [ConfigModule, FirebaseModule],
      inject: [ConfigService],
      useFactory: telegramConfig,
    }),
    FirebaseModule,
  ],
  controllers: [AppController, TelegramController],
  providers: [AppService],
})
export class AppModule {}
