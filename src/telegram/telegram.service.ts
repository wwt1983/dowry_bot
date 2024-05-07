import { Injectable, Inject, Scope } from '@nestjs/common';
import { Bot, session, GrammyError, HttpError, InlineKeyboard } from 'grammy';
import { hydrateApi, hydrateContext } from '@grammyjs/hydrate';

import {
  ITelegramOptions,
  MyContext,
  MyApi,
  ISessionData,
  ITelegramWebApp,
} from './telegram.interface';
import {
  TELEGRAM_MODULE_OPTIONS,
  HELP_TEXT,
  TELEGRAM_SECRET_CHAT_ID,
  COMMANDS_TELEGRAM,
  COMMAND_NAMES,
  FILE_FROM_BOT_URL,
  WEB_APP,
  STEP_COMMANDS,
  STEPS_TYPES,
  WEB_APP_TEST,
  STEPS_FOR_SEND_DATA_TO_DB,
  COUNT_STEPS,
} from './telegram.constants';
import { TelegramHttpService } from './telegram.http.service';
import {
  createInitialSessionData,
  getTextByNextStep,
  getTextForFirstStep,
  createMsgToSecretChat,
  UpdateSessionByStep,
  UpdateSessionByField,
  sayHi,
} from './telegram.custom.functions';
import { FirebaseService } from 'src/firebase/firebase.service';
import { User } from '@grammyjs/types';
import { AirtableService } from 'src/airtable/airtable.service';
//import { parseQrCode } from './qrcode/grcode.parse';

@Injectable({ scope: Scope.DEFAULT })
export class TelegramService {
  bot: Bot<MyContext>;
  options: ITelegramOptions;
  user: string | null;

  TEST_USER = '@Julia_bogdanova88';

  constructor(
    @Inject(TELEGRAM_MODULE_OPTIONS) options: ITelegramOptions,
    private readonly commandService: TelegramHttpService,
    private readonly firebaseService: FirebaseService,
    private readonly airtableService: AirtableService,
  ) {
    this.options = options;

    console.log('------- START BOT --------');
    console.log('process.env.NODE_ENV=', process.env.NODE_ENV);

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
      ctx.session = createInitialSessionData();
      const { first_name, last_name, username } = ctx.from;
      this.user = username || `${first_name} ${last_name}`;

      ctx.reply(sayHi(first_name, username), {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Dowry раздачи',
                web_app: {
                  url:
                    process.env.NODE_ENV === 'development'
                      ? WEB_APP_TEST
                      : WEB_APP,
                },
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
      const { first_name, last_name, username, id } = ctx.from;
      const dataBuyerTest =
        await this.commandService.getDistributionTableByFilter(this.TEST_USER);
      const allCash = dataBuyerTest.reduce(function (newArr, record) {
        if (record.fields['Кэш выплачен']) {
          newArr.push(
            `${record.fields['Дата заказа']} ${record.fields['Раздача']}: ${record.fields['Кэшбек']} руб.`,
          );
        }
        return newArr;
      }, []);
      await ctx.api.sendMessage(id, allCash.join('\n'), {
        parse_mode: 'HTML',
      });
    });

    this.bot.command(COMMAND_NAMES.help, (ctx) => {
      ctx.reply(HELP_TEXT);
    });

    // this.bot.on('', async (ctx) => {
    //   return ctx.reply('В бот нужно отправлять только картинки');
    // });

    this.bot.on('message:photo', async (ctx) => {
      const { step, data } = ctx.session;
      if (!data)
        return ctx.reply('Вам нужно нажать на кнопку ⬆️ "Dowry раздачи"');

      if (!STEPS_TYPES.image.includes(step)) {
        return ctx.reply('На этом шаге должно быть текстовое сообщение');
      }

      const path = await ctx.getFile();
      const url = `${FILE_FROM_BOT_URL}${this.options.token}/${path.file_path}`;

      ctx.session.lastMessage = ctx.message;
      ctx.session = UpdateSessionByField(ctx.session, 'lastLoadImage', url);

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

      await statusMessage.editText('Фото успешно загружено!');
      setTimeout(() => statusMessage.delete().catch(() => {}), 2000);

      ctx.session = UpdateSessionByStep(ctx.session, firebaseUrl, true);

      if (STEPS_FOR_SEND_DATA_TO_DB.includes(ctx.session.step)) {
        console.log('SEND DATA TO DB');
        await this.sendDataToAirtable(ctx.session, ctx.from.username);
      }

      if (ctx.session.step === COUNT_STEPS) {
        await ctx.react('🎉');
      }

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
          ctx.session = UpdateSessionByField(ctx.session, 'data', data);
          ctx.session = UpdateSessionByField(
            ctx.session,
            'chat_id',
            ctx.message.from.id.toString(),
          );

          /*Удаляем первый ответ от сайта он формате объекта*/
          if (ctx.msg.text.includes('query_id')) {
            ctx.message.delete().catch(() => {});
          }

          await ctx.api.sendMessage(
            ctx.message.from.id,
            getTextForFirstStep(data),
            {
              parse_mode: 'HTML',
            },
          );

          return await ctx.replyWithPhoto(`${WEB_APP}/images/wb-search.jpg`);
        } else {
          const { step, data } = ctx.session;
          if (step === 3) {
            ctx.session = UpdateSessionByStep(ctx.session, ctx.message.text);

            await this.bot.api
              .sendMessage(
                TELEGRAM_SECRET_CHAT_ID,
                createMsgToSecretChat(
                  ctx.from as User,
                  ctx.message.text,
                  data?.title,
                ),
              )
              .catch((e: GrammyError) =>
                console.log('secret chat bad ---', e.message),
              );

            return await ctx.reply(getTextByNextStep(ctx.session.step));
          } else {
            console.log('===== message from chat === ');
            if (!STEPS_TYPES.text.includes(ctx.session.step)) {
              return await ctx.reply(
                'На этом шаге должно быть отправлено фото',
              );
            } else {
              return await ctx.reply(`✌️`);
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
  /*
отправляем заполненные данные пользоваетля через веб-хук в airtable
*/
  async sendDataToAirtable(session: ISessionData, user: string): Promise<any> {
    console.log(session);
    return await this.airtableService.sendDataToWebhookAirtable({
      SessionId: session.sessionId,
      User: user,
      Артикул: session.data.articul,
      Images: session.Images,
      Раздача: session.data.title,
      StartTime: session.startTime,
      StopBuyTime: session.stopBuyTime,
      StopTime: session.stopTime,
      Bot: true,
      Отзыв: session.comment,
      chat_id: session.chat_id,
      IsFinishUser: session.isFinish,
    });
  }
}

//

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
