import { Injectable, Inject, Scope } from '@nestjs/common';
import { Bot, session, GrammyError, HttpError, InlineKeyboard } from 'grammy';
import { hydrateApi, hydrateContext } from '@grammyjs/hydrate';

import {
  ITelegramAirtableData,
  ITelegramOptions,
  MyContext,
  MyApi,
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
  STEP_COMMANDS,
  STEPS_TYPES,
} from './telegram.constants';
import { TelegramCommandsService } from './telegram.commands.service';
import {
  createInitialSessionData,
  getTextByNextStep,
  getTextForFirstStep,
  createMsgToSecretChat,
} from './telegram.custom.functions';
import { FirebaseService } from 'src/firebase/firebase.service';
import { User } from '@grammyjs/types';
import { format } from 'date-fns';
import { AirtableService } from 'src/airtable/airtable.service';

@Injectable({ scope: Scope.DEFAULT })
export class TelegramService {
  bot: Bot<MyContext>;
  options: ITelegramOptions;
  user: string | null;
  nextStep = (session: ISessionData) => (session.step = session.step + 1);

  TEST_USER = '@Julia_bogdanova88';

  constructor(
    @Inject(TELEGRAM_MODULE_OPTIONS) options: ITelegramOptions,
    private readonly commandService: TelegramCommandsService,
    private readonly firebaseService: FirebaseService,
    private readonly airtableService: AirtableService,
  ) {
    this.options = options;

    console.log('------- START BOT --------');

    this.bot = new Bot<MyContext, MyApi>(this.options.token);
    this.bot.use(hydrateContext());
    this.bot.api.config.use(hydrateApi());

    this.bot.use(
      session({
        initial(): ISessionData {
          return createInitialSessionData();
        },
      }),
    );
    this.bot.api.setMyCommands(COMMANDS_TELEGRAM);

    const stepKeyboard = new InlineKeyboard()
      .text(STEP_COMMANDS.del, 'del')
      .text(STEP_COMMANDS.next, 'next');

    this.bot.command(COMMAND_NAMES.start, async (ctx) => {
      console.log('!!!!!!!! START!!!!!!!');

      ctx.session = createInitialSessionData();

      const { first_name, username } = ctx.from;

      ctx.reply(`Привет, ${first_name || username}!`, {
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
    });

    const userMenu = new InlineKeyboard().text('История раздач', 'showOrders');
    this.bot.command(COMMAND_NAMES.history, (ctx) =>
      ctx.reply('🛍️', {
        reply_markup: userMenu,
      }),
    );
    this.bot.callbackQuery('showOrders', async (ctx) => {
      const { first_name, last_name, username } = ctx.from;
      const dataBuyerTest = await this.commandService.findBuyer(this.TEST_USER);
      //const dataBuyer = await this.commandService.findBuyer(this.user);
      return ctx.reply(
        JSON.stringify(dataBuyerTest[0].fields['Раздачи'].join(',')),
      );
    });

    this.bot.command(COMMAND_NAMES.help, (ctx) => {
      ctx.reply(HELP_TEXT);
    });
    this.bot.on('message:photo', async (ctx) => {
      const path = await ctx.getFile();
      const url = `${FILE_FROM_BOT_URL}${this.options.token}/${path.file_path}`;
      ctx.session.lastLoadImage = url;
      ctx.session.lastMessage = ctx.message;

      const { step } = ctx.session;

      if (!STEPS_TYPES.image.includes(step)) {
        return ctx.reply('На этом шаге должно быть текстовое сообщение');
      }

      switch (step) {
        case 0:
          ctx.session.isLoadImageSearch = true;
          break;
        case 1:
          ctx.session.isLoadImageOrderWithPVZ = true;
          break;
        case 2:
          ctx.session.isLoadImageGiveGood = true;
          break;
        case 3:
          //comment user send secret chat text
          break;
        case 4:
          ctx.session.isLoadImageOnComment = true;
          break;
        case 5:
          ctx.session.isLoadImageBrokeCode = true;
          break;
        case 6:
          ctx.session.isLoadImageCheck = true;
          break;
        case 7:
          ctx.session.stopTime = format(new Date(), 'dd.MM.yyyy H:mm');
          await this.sendDataToAirtable(ctx.session, ctx.from.username);
          break;
        default:
          break;
      }
      return ctx.reply('Это точное фото?', { reply_markup: stepKeyboard });
    });

    this.bot.callbackQuery('del', async (ctx) => {
      ctx.session.Images = ctx.session.Images.filter(
        (item) => item !== ctx.session.lastLoadImage,
      );
      ctx.session.lastMessage.delete().catch(() => {});

      await ctx.callbackQuery.message.editText('Загрузите новое фото');
    });

    this.bot.callbackQuery('next', async (ctx) => {
      ctx.session.lastMessage = null;
      const statusMessage = await ctx.reply('Загрузка...');

      const firebaseUrl = await this.firebaseService.uploadImageAsync(
        ctx.session.lastLoadImage,
      );

      await statusMessage.editText('Фото успешно отправлено на проверку!');
      setTimeout(() => statusMessage.delete().catch(() => {}), 2000);

      ctx.session.step = this.nextStep(ctx.session);
      ctx.session.Images = [...ctx.session.Images, firebaseUrl];
      ctx.session.lastLoadImage = firebaseUrl;

      await ctx.callbackQuery.message.editText(
        getTextByNextStep(ctx.session.step),
      );
    });

    this.bot.on('callback_query', async (ctx) => {
      await ctx.answerCallbackQuery();
    });

    this.bot.on('message', async (ctx) => {
      try {
        const { via_bot, text } = ctx.update.message;
        if (via_bot?.is_bot) {
          const data = JSON.parse(text) as ITelegramWebApp;
          console.log('==== WEB API ====', data);
          ctx.session.data = data;
          return ctx.reply(getTextForFirstStep(data));
        } else {
          const { step, data } = ctx.session;
          if (step === 3) {
            ctx.session.comment = ctx.message.text;
            await this.bot.api.sendMessage(
              TELEGRAM_SECRET_CHAT_ID,
              createMsgToSecretChat(
                ctx.from as User,
                ctx.message.text,
                data?.title,
              ),
            );
            ctx.session.step = this.nextStep(ctx.session);
            return await ctx.reply(getTextByNextStep(ctx.session.step));
          } else {
            console.log('===== message from chat === ');
            if (!STEPS_TYPES.text.includes(ctx.session.step)) {
              return await ctx.reply('Это точно фото? :))))');
            } else {
              return await ctx.reply(`msg`);
            }
          }
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

  async sendDataToAirtable(session: ISessionData, user: string) {
    await this.airtableService.sendDataToWebhookAirtable({
      User: user,
      Артикул: session.data.articul.toString(),
      Images: session.Images,
      Раздача: session.data.title,
      StartTime: session.startTime,
      StopTime: session.stopTime,
      Bot: true,
      Отзыв: session.comment,
    });
  }
}

// this.user = username || `${first_name} ${last_name}`;

// const dataArticlesInWork = await this.commandService.getArticlesInWork();
// ctx.reply(
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
