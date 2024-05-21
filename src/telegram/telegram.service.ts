import { Injectable, Inject, Scope } from '@nestjs/common';
import {
  Bot,
  session,
  GrammyError,
  HttpError,
  InlineKeyboard,
  Keyboard,
} from 'grammy';
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
  COMMANDS_TELEGRAM,
  COMMAND_NAMES,
  FILE_FROM_BOT_URL,
  WEB_APP,
  STEP_COMMANDS,
  STEPS_TYPES,
  WEB_APP_TEST,
  COUNT_STEPS,
  TELEGRAM_CHAT_ID,
  STEPS,
} from './telegram.constants';
import { TelegramHttpService } from './telegram.http.service';
import {
  createInitialSessionData,
  getTextByNextStep,
  getTextForFirstStep,
  UpdateSessionByStep,
  UpdateSessionByField,
  sayHi,
  nextStep,
  getOffer,
  parseUrl,
} from './telegram.custom.functions';
import { FirebaseService } from 'src/firebase/firebase.service';
import { AirtableService } from 'src/airtable/airtable.service';
import { getGeoUrl, parseGeoResponse } from './telegram.geo';
import { OfferStatus } from 'src/airtable/types/IOffer.interface';
//import { parseQrCode } from './qrcode/grcode.parse';

@Injectable({ scope: Scope.DEFAULT })
export class TelegramService {
  bot: Bot<MyContext>;
  options: ITelegramOptions;

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

    const commentKeyboard = new InlineKeyboard().text(
      STEP_COMMANDS.next,
      'next',
    );
    const shareKeyboard = new Keyboard()
      .requestLocation('Геолокация')
      .placeholder('Я хочу поделиться...')
      .resized();

    this.bot.command(COMMAND_NAMES.start, async (ctx) => {
      const { first_name, last_name, username, id } = ctx.from;
      ctx.session = createInitialSessionData(
        id?.toString(),
        username || `${first_name} ${last_name}`,
      );

      await this.saveToAirtable(ctx.session);

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

      const dataBuyer = await this.commandService.getDistributionTableByFilter(
        ctx.session.user,
      );
      if (!dataBuyer)
        return await ctx.api.sendMessage(id, 'Пока вы ничего не купили 😢', {
          parse_mode: 'HTML',
        });
      const allCash = dataBuyer.reduce(function (newArr, record) {
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

    this.bot.on(':location', async (ctx) => {
      const data = await commandService.get(
        getGeoUrl(
          ctx.message.location.longitude,
          ctx.message.location.latitude,
        ),
      );
      const location = parseGeoResponse(data);
      if (location) {
        ctx.session = UpdateSessionByField(ctx.session, 'location', location);
      }
      await ctx.reply(
        location
          ? 'Спасибо за геолокацию! Продолжайте шаг 1️⃣'
          : 'Локация не определена',
        {
          reply_markup: { remove_keyboard: true },
        },
      );
    });

    this.bot.on('message:photo', async (ctx) => {
      const { step, data } = ctx.session;
      if (!data)
        return ctx.reply('Вам нужно нажать на кнопку ⬆️ "Dowry раздачи"');

      if (!STEPS_TYPES.image.includes(step)) {
        return ctx.reply('На этом шаге должно быть текстовое сообщение');
      }

      const path = await ctx.getFile();
      const url = `${FILE_FROM_BOT_URL}${this.options.token}/${path.file_path}`;
      ctx.session.lastMessage = ctx.message.message_id;
      ctx.session = UpdateSessionByField(ctx.session, 'lastLoadImage', url);

      return ctx.reply('Это точное фото?', { reply_markup: stepKeyboard });
    });

    this.bot.callbackQuery('del', async (ctx) => {
      ctx.session.images = ctx.session.images.filter(
        (item) => item !== ctx.session.lastLoadImage,
      );
      this.bot.api
        .deleteMessage(ctx.session.chat_id, ctx.session.lastMessage)
        .catch(() => {});

      await ctx.callbackQuery.message.editText('Загрузите новое фото');
    });

    this.bot.callbackQuery('next', async (ctx) => {
      if (!STEPS_TYPES.text.includes(ctx.session.step)) {
        ctx.session.lastMessage = null;
        const statusMessage = await ctx.reply('Загрузка...');

        const firebaseUrl = await this.firebaseService.uploadImageAsync(
          ctx.session.lastLoadImage,
        );

        await statusMessage.editText('Фото успешно загружено!');
        setTimeout(() => statusMessage.delete().catch(() => {}), 2000);

        ctx.session = UpdateSessionByStep(ctx.session, firebaseUrl, true);
      } else {
        ctx.session = nextStep(ctx.session);
      }

      await this.updateToAirtable(ctx.session);

      await ctx.callbackQuery.message.editText(
        getTextByNextStep(ctx.session.step),
      );

      if (ctx.session.step === STEPS.FINISH) {
        await ctx.react('🎉');
      }
    });

    this.bot.on('callback_query', async (ctx) => {
      await ctx.answerCallbackQuery();
    });

    this.bot.on('message', async (ctx) => {
      try {
        const { text } = ctx.update.message;
        let data = null;

        if (!ctx.session.data && !text.includes('query_id')) {
          return await ctx.reply(`✌️`);
        }

        if (!ctx.session.data) {
          data = JSON.parse(text) as ITelegramWebApp;
          console.log('==== WEB API ====');
          ctx.session = UpdateSessionByField(ctx.session, 'data', data);
          ctx.session = UpdateSessionByField(
            ctx.session,
            'offerId',
            data.offerId,
          );
          ctx.session = UpdateSessionByStep(ctx.session);
          /*Удаляем первый ответ от сайта он формате объекта*/
          if (ctx.msg.text.includes('query_id')) {
            ctx.message.delete().catch(() => {});
          }
          if (data.location && data.location !== 'undefined') {
            await ctx.reply(`Поделиться локацией`, {
              reply_markup: shareKeyboard.oneTime(),
            });
          }
        }

        console.log('===== message from chat === ');

        const { step } = ctx.session;

        if (!STEPS_TYPES.text.find((x) => x === step)) {
          return await ctx.reply(
            'На этом шаге должно быть отправлено фото' + step,
          );
        }

        //старт
        if (STEPS.CHOOSE_OFFER === step && data) {
          await this.updateToAirtable(ctx.session);

          ctx.session = nextStep(ctx.session);

          return await this.bot.api.sendMediaGroup(
            ctx.message.from.id,
            getTextForFirstStep(data) as any[],
          );
          //return await ctx.replyWithPhoto(`${WEB_APP}/images/wb-search.jpg`);
        }

        //проверка артикула
        if (STEPS.CHECK_ARTICUL === step) {
          if (!parseUrl(text, ctx.session.data.articul)) {
            const helpText = ctx.session.data.positionOnWB
              ? `Эта позиция находится примерно на ${ctx.session.data.positionOnWB} странице`
              : '';
            return ctx.reply(
              'Артикулы не совпадат. Проверьте, пожалуйста, правильно ли вы нашли товар.' +
                helpText,
            );
          }
          ctx.session = nextStep(ctx.session);
          return await ctx.reply(getTextByNextStep(ctx.session.step));
        }

        console.log('STEPS =', step);
        //отзыв пользователя
        if (step === STEPS.COMMENT_ON_CHECK) {
          ctx.session = UpdateSessionByField(
            ctx.session,
            'comment',
            ctx.message.text,
          );
          ctx.session = UpdateSessionByField(
            ctx.session,
            'status',
            'Отзыв на проверке',
          );

          await this.updateToAirtable(ctx.session);

          return ctx.reply('Если ваш отзыв одобрен, нажмите "Продолжить"', {
            reply_markup: commentKeyboard,
          });
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
  async saveToAirtable(session: ISessionData): Promise<any> {
    return await this.airtableService.saveToAirtable({
      SessionId: session.sessionId,
      User: session.user,
      Bot: true,
      chat_id: session.chat_id,
      Статус: session.status,
    });
  }

  async updateToAirtable(session: ISessionData): Promise<any> {
    return await this.airtableService.updateToAirtable({
      SessionId: session.sessionId,
      Артикул: session.data.articul,
      StartTime: session.startTime,
      ['Время выкупа']: session.stopBuyTime,
      OfferId: session.offerId,
      Статус: session.status,
      Location: session.location,
      Раздача: session.data.title,
      Images: session.images,
      StopTime: session.stopTime,
      Отзыв: session.comment,
      Финиш: session.isFinish,
    });
  }

  async sendOfferToChat(id: string): Promise<number> {
    try {
      const offerAirtable = await this.airtableService.getOffer(id);
      const medias = getOffer(offerAirtable);

      const result = await this.bot.api.sendMediaGroup(
        TELEGRAM_CHAT_ID,
        medias,
      );

      console.log('<===> result <===>', result.at(-1).message_id);
      return result.at(-1).message_id;
    } catch (e) {
      console.log('sendOfferToChat', e);
    }
  }
  async closeOfferInChat(
    messageId: number,
    status: OfferStatus,
  ): Promise<string> {
    try {
      const text =
        status === 'Done'
          ? `❗️❗️❗️ Раздача закрыта ❗️❗️❗️`
          : `❗️❗️❗️ Раздача временно остановлена ❗️❗️❗️`;
      await this.bot.api.editMessageCaption(TELEGRAM_CHAT_ID, messageId, {
        caption: text,
      });

      return 'Ok';
    } catch (e) {
      console.log('sendOfferToChat', e);
    }
  }
}
