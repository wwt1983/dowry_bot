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
import { SmsModule } from './sms/sms.module';
//import { TypeOrmModule } from '@nestjs/typeorm';
//import { LogsController } from './logs/logs.controller';
//import { Log } from './logs/log.entity';
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
    SmsModule,
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: 'localhost',
    //   port: 5432,
    //   username: 'your_username',
    //   password: 'your_password',
    //   database: 'your_database',
    //   entities: [Log],
    //   synchronize: true, // Включите только для разработки
    // }),
    // TypeOrmModule.forFeature([Log]),
  ],
  controllers: [AppController, TelegramController],
  providers: [AppService],
})
export class AppModule {}
