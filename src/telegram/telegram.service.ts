import { Injectable, Inject, Scope } from '@nestjs/common';
import { Bot, session, GrammyError, HttpError } from 'grammy';

import {
  ITelegramAirtableHelperData,
  ITelegramOptions,
  MyContext,
  ISessionData,
  ITelegramWebApp,
} from './telegram.interface';
import {
  TELEGRAM_MODULE_OPTIONS,
  HELP_TEXT,
  TELEGRAM_CHAT_ID,
  TELEGRAM_SECRET_CHAT_ID,
  COMMANDS_TELEGRAM,
  COMMAND_NAMES,
  FILE_FROM_BOT_URL,
  WEB_APP,
  WEB_APP_TEST,
} from './telegram.constants';
import { TelegramCommandsService } from './telegram.commands.service';
import {
  createInitialSessionData,
  getTextByStep,
  getTextForFirstStep,
  sendMsgToSecretChat,
} from './telegram.custom.functions';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable({ scope: Scope.DEFAULT })
export class TelegramService {
  bot: Bot<MyContext>;
  options: ITelegramOptions;
  user: string | null;

  TEST_USER = '@Julia_bogdanova88';

  constructor(
    @Inject(TELEGRAM_MODULE_OPTIONS) options: ITelegramOptions,
    private readonly commandService: TelegramCommandsService,
    private readonly firebaseService: FirebaseService,
  ) {
    this.options = options;

    console.log('------- START BOT --------');

    this.bot = new Bot<MyContext>(this.options.token);
    this.bot.use(
      session({
        initial(): ISessionData {
          return createInitialSessionData();
        },
      }),
    );
    this.bot.api.setMyCommands(COMMANDS_TELEGRAM);

    this.bot.command(COMMAND_NAMES.start, async (ctx) => {
      console.log('!!!!!!!! START!!!!!!!');
      const { first_name, username } = ctx.from;
      ctx.reply(`Привет, ${first_name || username}`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Dowray раздачи',
                web_app: { url: WEB_APP },
              },
            ],
          ],
        },
      });
      //const { first_name, last_name, username } = ctx.from;
      // console.log(ctx.from);
      // this.user = username || `${first_name} ${last_name}`;

      // const dataBuyerTest = await this.commandService.findBuyer(this.TEST_USER);
      // const dataBuyer = await this.commandService.findBuyer(this.user);
      // const dataArticlesInWork = await this.commandService.getArticlesInWork();
      // const sticker = dataBuyer ? '🤟' : '👶';
      // ctx.reply(
      //   'Привет, ' +
      //     first_name +
      //     ' ' +
      //     sticker +
      //     '\n' +
      //     HEADER +
      //     FIRST_STEP +
      //     dataArticlesInWork[0].fields.Name +
      //     '\n' +
      //     ' сейчас предложений (таблица Артикулы) = ' +
      //     dataArticlesInWork?.length +
      //     '\n' +
      //     ' Артикул WB = ' +
      //     dataArticlesInWork[0].fields['Артикул WB'] +
      //     '\n' +
      //     ' таблица Артикулы пример = ' +
      //     JSON.stringify(dataArticlesInWork[0]) +
      //     '\n' +
      //     ' buyer real test = ' +
      //     JSON.stringify(dataBuyerTest) +
      //     '\n' +
      //     ' no in base = ' +
      //     JSON.stringify(dataBuyer),
      // );
    });

    this.bot.command(COMMAND_NAMES.history, (ctx) => ctx.reply('Меню'));
    this.bot.command(COMMAND_NAMES.help, (ctx) => {
      ctx.reply(HELP_TEXT);
    });
    this.bot.command(COMMAND_NAMES.support, async (ctx) => {
      const result = await this.bot.api.sendMessage(
        TELEGRAM_SECRET_CHAT_ID,
        sendMsgToSecretChat(ctx),
      );
      console.log(TELEGRAM_SECRET_CHAT_ID, result);
    });

    this.bot.on('message:photo', async (ctx) => {
      const { step } = ctx.session;
      const path = await ctx.getFile();
      const url = `${FILE_FROM_BOT_URL}${this.options.token}/${path.file_path}`;
      const firebaseUrl = await this.firebaseService.uploadImageAsync(url);
      switch (step) {
        case 0:
          ctx.session.isLoadImageSearch = true;
          break;
        case 1:
          ctx.session.isLoadImageGiveGood = true;
          break;
        default:
      }

      ctx.session.step++;
      ctx.session.Images = [...ctx.session.Images, firebaseUrl];
      console.log('session =', ctx.session);

      return ctx.reply(getTextByStep(step, firebaseUrl));
    });

    this.bot.on('message', async (ctx) => {
      try {
        const { via_bot, text } = ctx.update.message;
        if (via_bot?.is_bot) {
          console.log('WEB API');
          const data = JSON.parse(text) as ITelegramWebApp;
          console.log(data);
          ctx.session.data = data;
          return ctx.reply(getTextForFirstStep(data));
        } else {
          console.log('===== message from chat  === ', ctx.update);
          ctx.reply(`🤝`);
        }
      } catch (e) {
        console.log(e);
      }
    });

    this.bot.catch((err) => {
      const ctx = err.ctx;
      console.log(`Error while handling update ${ctx.update.update_id}`);

      const e = err.error;

      if (e instanceof GrammyError) {
        console.error('Error in request: ', e.description);
      } else if (e instanceof HttpError) {
        console.error('Could not contact Telegram', e);
      } else {
        console.error('Unknow error: ', e);
      }
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

    await this.bot.api.sendMessage(TELEGRAM_CHAT_ID, messageString, {
      parse_mode: 'HTML',
    });
  }
}
