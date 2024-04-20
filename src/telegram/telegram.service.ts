import { Injectable, Inject } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import * as LocalSession from 'telegraf-session-local';

import { ITelegramOptions } from './telegram.interface';
import { TELEGRAM_MODULE_OPTIONS } from './telegram.constants';

@Injectable()
export class TelegramService {
  bot: Telegraf;
  options: ITelegramOptions;

  constructor(@Inject(TELEGRAM_MODULE_OPTIONS) options: ITelegramOptions) {
    this.options = options;
    this.bot = new Telegraf(options.token);
    this.bot
      .use(
        new LocalSession({
          database: 'telegram_db.json',
          property: 'session',
          storage: LocalSession.storageFileAsync,
          format: {
            serialize: (obj) => JSON.stringify(obj, null, 2),
            deserialize: (str) => JSON.parse(str),
          },
          state: { messages: [] },
        }),
      )
      .middleware();
  }

  async sendMessage(message: string, chatId: string = this.options.chatId) {
    await this.bot.telegram.sendMessage(chatId, message);
  }
}
