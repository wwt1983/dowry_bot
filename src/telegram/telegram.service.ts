import { Injectable, Inject, Scope } from '@nestjs/common';
import {
  ITelegramAirtableHelperData,
  ITelegramOptions,
} from './telegram.interface';
import { TELEGRAM_MODULE_OPTIONS } from './telegram.constants';
import { Bot } from 'grammy';

@Injectable({ scope: Scope.DEFAULT })
export class TelegramService {
  bot: Bot;
  options: ITelegramOptions;

  constructor(@Inject(TELEGRAM_MODULE_OPTIONS) options: ITelegramOptions) {
    this.options = options;

    if (!this.bot) {
      console.log('start bot');

      this.bot = new Bot(this.options.token);
    }

    this.bot.command('start', (ctx) => ctx.reply('Welcome! Up and running.'));

    this.bot.on('message', (ctx) => {
      console.log(ctx.update.message.from);
      console.log('ctx ==> ', ctx);
      const { first_name, last_name, username } = ctx.update.message.from
      ctx.reply('hi ' + first_name);
    });

    // Start the bot.
    this.bot.start();
  }

  async sendMessageToChat(message: ITelegramAirtableHelperData) {
    const messageString =
      'Данные из airtable = ' +
      message.Name +
      '  ' +
      message.Notes +
      ' ' +
      `https://www.wildberries.ru/catalog/${message.Articul}/detail.aspx`;

    await this.bot.api.sendMessage(this.options.chatId, messageString, {
      parse_mode: 'HTML',
    });
  }
}
