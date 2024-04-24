import { Injectable, Inject, Scope } from '@nestjs/common';
import {
  ITelegramAirtableHelperData,
  ITelegramOptions,
  MyContext,
} from './telegram.interface';
import { TELEGRAM_MODULE_OPTIONS } from './telegram.constants';
import { TablesName } from '../airtable/airtable.constants';
import { Bot } from 'grammy';
import { TelegramCommandsService } from './telegram.commands.service';

@Injectable({ scope: Scope.DEFAULT })
export class TelegramService {
  bot: Bot<MyContext>;
  options: ITelegramOptions;

  constructor(
    @Inject(TELEGRAM_MODULE_OPTIONS) options: ITelegramOptions,
    private readonly commandService: TelegramCommandsService,
  ) {
    this.options = options;

    if (!this.bot) {
      console.log('------- START BOT --------');

      this.bot = new Bot<MyContext>(this.options.token);
    }

    this.bot.command('start', (ctx) => ctx.reply('Welcome! Up and running.'));

    this.bot.on('message', async (ctx) => {
      console.log('ctx ==> ', ctx);

      console.log('tsble', TablesName.Test);
      const dataHelpers = await this.commandService.getHelperTable(
        TablesName.Helpers,
      );
      const filterDataDistributions =
        await this.commandService.getDistributionTableByFilter(
          TablesName.Distributions,
          '2024-04-20',
        );
      console.log('distributions ==> ', filterDataDistributions);
      const { first_name, last_name, username } = ctx.update.message.from;

      ctx.reply(
        'Привет, ' +
          first_name +
          ' сейчас предложений ' +
          filterDataDistributions.length +
          ' id distribution =  ' +
          filterDataDistributions[0].fields.Артикул +
          ' Артикул WB = ' +
          filterDataDistributions[0].fields['Артикул WB'] +
          ' Артикул = ' +
          JSON.stringify(filterDataDistributions[0].fields.Артикул) +
          ' helper = ' +
          dataHelpers.records[0].fields.Name,
      );
    });

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
