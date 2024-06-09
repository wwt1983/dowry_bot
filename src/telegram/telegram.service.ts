import { Injectable, Inject, Scope } from '@nestjs/common';
import { Bot, session, GrammyError, HttpError } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
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
  STEPS_TYPES,
  TELEGRAM_CHAT_ID,
  STEPS,
  STOP_TEXT,
  COUNT_TRY_ERROR,
  ADMIN_COMMANDS_TELEGRAM,
  STEPS_VALUE,
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
  LocationCheck,
  createMsgToSecretChat,
  getSecretChatId,
  getNotificationValue,
  scheduleNotification,
  createContinueSessionData,
  getTextForArticleError,
  getArticulErrorStatus,
} from './telegram.custom.functions';
import { FirebaseService } from 'src/firebase/firebase.service';
import { AirtableService } from 'src/airtable/airtable.service';
import { getGeoUrl, parseGeoResponse } from './telegram.geo';
import { OfferStatus } from 'src/airtable/types/IOffer.interface';
import {
  commentKeyboard,
  getArticulCommand,
  stepKeyboard,
  deliveryDateKeyboard,
  createHistoryKeyboard,
  createLabelHistory,
  operatorKeyboard,
} from './telegram.command';
import { message } from './conversation/telegram.message.conversation';
import { BotStatus } from 'src/airtable/types/IBot.interface';
import { NotificationStatisticStatuses } from 'src/airtable/types/INotificationStatistic.interface';
import { dateFormat, dateFormatWithTZ } from 'src/common/date/date.methods';
import { parseTextFromPhoto } from 'src/common/parsing/image.parser';
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

    console.log('------- START BOT --------', process.env.NODE_ENV);

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

    this.bot.use(conversations());
    this.bot.use(createConversation(message, 'message'));

    this.bot.api.setMyCommands(COMMANDS_TELEGRAM, {
      scope: { type: 'all_private_chats' },
    });

    this.bot.api.setMyCommands(ADMIN_COMMANDS_TELEGRAM, {
      scope: { type: 'default' },
    });

    this.bot.command(COMMAND_NAMES.messageSend, async (ctx) => {
      await ctx.conversation.enter('message');
      ctx.session.lastCommand = COMMAND_NAMES.messageSend;
    });

    this.bot.command(COMMAND_NAMES.start, async (ctx) => {
      const { first_name, last_name, username, id } = ctx.from;
      ctx.session = createInitialSessionData(
        id?.toString(),
        username || `${first_name} ${last_name || ''}`,
      );
      const dataBuyer = await this.commandService.getBotByFilter(
        id.toString(),
        'chat_id',
      );
      const historyButtons = createHistoryKeyboard(dataBuyer, true);
      ctx.session.lastCommand = COMMAND_NAMES.start;

      await this.saveToAirtable(ctx.session);

      ctx.reply(sayHi(first_name, username), {
        reply_markup: historyButtons,
      });
    });

    this.bot.command(COMMAND_NAMES.help, (ctx) => {
      ctx.session.lastCommand = COMMAND_NAMES.help;
      return ctx.reply(HELP_TEXT);
    });

    this.bot.command(COMMAND_NAMES.call, async (ctx) => {
      ctx.session.lastCommand = COMMAND_NAMES.call;
      return await ctx.reply('Опишите вашу проблему');
    });

    /*======== HISTORY =======*/
    this.bot.command(COMMAND_NAMES.history, async (ctx) => {
      try {
        ctx.session.lastCommand = COMMAND_NAMES.history;

        const { id } = ctx.from;

        const dataBuyer = await this.commandService.getBotByFilter(
          id.toString(),
          'chat_id',
        );
        if (!dataBuyer) {
          return await ctx.api.sendMessage(id, 'Пока вы ничего не купили 😢');
        }
        const orderButtons = createHistoryKeyboard(dataBuyer);

        return await ctx.reply(
          orderButtons
            ? 'Выберите раздачу, чтобы продолжить заполнение ⤵️'
            : 'Все раздачи завершены ✌️',
          {
            reply_markup: orderButtons,
          },
        );
      } catch (e) {
        console.log('history', e);
        return await ctx.reply('Раздел обновляется');
      }
    });

    /*======== LOCATION =======*/
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
      const locationResult = LocationCheck(ctx.session.data.location, location);

      if (!locationResult.status) {
        ctx.session = UpdateSessionByField(
          ctx.session,
          'status',
          'Проблема с локацией',
        );
        ctx.session.errorStatus = 'locationError';
      }

      await this.updateToAirtable(ctx.session);

      await ctx.reply(locationResult.text, {
        reply_markup: { remove_keyboard: true },
      });
    });

    /*======== PHOTO =======*/
    this.bot.on('message:photo', async (ctx) => {
      if (ctx.session.lastCommand === COMMAND_NAMES.messageSend)
        return ctx.reply('📵');

      const { step, data } = ctx.session;
      if (ctx.session.step < 0) return ctx.reply(STOP_TEXT);

      if (!data) {
        return await this.sendMessageWithKeyboardHistory(ctx.from.id);
      }

      if (!STEPS_TYPES.image.includes(step)) {
        return ctx.reply('На этом шаге должно быть текстовое сообщение');
      }

      const path = await ctx.getFile();
      const url = `${FILE_FROM_BOT_URL}${this.options.token}/${path.file_path}`;
      ctx.session.lastMessage = ctx.message.message_id;
      ctx.session = UpdateSessionByField(ctx.session, 'lastLoadImage', url);

      return ctx.reply('Это точное фото?', { reply_markup: stepKeyboard });
    });

    /*======== CANCEL =======*/
    this.bot.callbackQuery('cancel', async (ctx) => {
      this.bot.api
        .editMessageReplyMarkup(ctx.session.chat_id, ctx.session.lastMessage)
        .catch(() => {});
    });

    /*======== OPERATOR =======*/
    this.bot.callbackQuery('operator', async (ctx) => {
      if (ctx.session.step === STEPS.FINISH.step) {
        return ctx.reply('Напишите сообщение оператору и ожидайте ответа🧑‍💻');
      }
      ctx.session = UpdateSessionByField(ctx.session, 'status', 'Вызов');
      ctx.session.errorStatus = 'operator';
      await this.updateToAirtable(ctx.session);
      return ctx.reply('Опишите вашу проблему и ожидайте ответа оператора🧑‍💻');
    });

    this.bot.callbackQuery('check_articul', async (ctx) => {
      ctx.session.errorStatus = 'check_articul';
      if (!parseUrl(ctx.callbackQuery.data, ctx.session.data.articul)) {
        await ctx.reply(
          getTextForArticleError(
            ctx.session.data.positionOnWB,
            ctx.session.countTryError,
            ctx.session.errorStatus,
          ),
          getArticulCommand(ctx.session.countTryError, ctx.session.errorStatus),
        );
      } else {
        ctx.session.errorStatus = null;
        nextStep(ctx.session);
      }
    });

    /*======== NO DELIVERY =======*/
    this.bot.callbackQuery('no_delivery_date', async (ctx) => {
      ctx.session.step = STEPS.RECEIVED.step;
      await ctx.callbackQuery.message.editText(
        getTextByNextStep(ctx.session.step, ctx.session.startTime),
      );
    });

    /*======== DEL =======*/
    this.bot.callbackQuery('del', async (ctx) => {
      ctx.session.images = ctx.session.images.filter(
        (item) => item !== ctx.session.lastLoadImage,
      );
      this.bot.api
        .deleteMessage(ctx.session.chat_id, ctx.session.lastMessage)
        .catch(() => {});

      await ctx.callbackQuery.message.editText('Загрузите новое фото');
    });

    /*======== NEXT =======*/
    this.bot.callbackQuery('next', async (ctx) => {
      //IMAGE
      if (STEPS_TYPES.image.includes(ctx.session.step)) {
        if (!ctx.session.lastMessage) {
          return;
        }
        ctx.session.lastMessage = null;
        const statusMessage = await ctx.reply('⏳');

        const firebaseUrl = await this.firebaseService.uploadImageAsync(
          ctx.session.lastLoadImage,
        );

        const parseResult = await parseTextFromPhoto(
          ctx.session.lastLoadImage,
          ctx.session.status,
          ctx.session.data.articul,
          ctx.session.data.title,
        );
        await statusMessage.editText('Фото загружено! ' + parseResult || '');
        setTimeout(() => statusMessage.delete().catch(() => {}), 6000);

        ctx.session = UpdateSessionByStep(ctx.session, firebaseUrl, true);
      } else {
        //TEXT MESSAGE
        ctx.session = nextStep(ctx.session);
      }

      await this.updateToAirtable(ctx.session);

      if (ctx.session.step === STEPS.DELIVERY_DATE.step) {
        ctx.session.lastMessage = ctx.callbackQuery.message.message_id;
      }

      await ctx.callbackQuery.message.editText(
        getTextByNextStep(ctx.session.step, ctx.session.startTime),
        ctx.session.step === STEPS.DELIVERY_DATE.step
          ? { reply_markup: deliveryDateKeyboard }
          : null,
      );
      ctx.session.lastMessage = ctx.callbackQuery.message.message_id;
      if (ctx.session.step === STEPS.FINISH.step) {
        await ctx.react('🎉');
        await ctx.reply('👩‍💻', {
          reply_markup: operatorKeyboard,
        });
      }
    });

    /*======== CALBACK_QUERY =======*/
    this.bot.on('callback_query', async (ctx) => {
      /*продолжение раздачи*/
      if (!ctx.callbackQuery.data.includes('sessionId_'))
        return await ctx.answerCallbackQuery();
      this.bot.api
        .deleteMessage(ctx.session.chat_id, ctx.session.lastMessage)
        .catch(() => {});
      const sessionId = ctx.callbackQuery.data.replace('sessionId_', '').trim();

      const data = await this.commandService.getBotByFilter(
        sessionId,
        'SessionId',
      );

      const { first_name, last_name, username, id } = ctx.from;
      const { Images, StopTime, StartTime, Статус, OfferId, Артикул, Раздача } =
        data[0].fields;

      const value: ISessionData = {
        sessionId: sessionId,
        user: username || `${first_name} ${last_name || ''}`,
        chat_id: id.toString(),
        startTime: dateFormatWithTZ(StartTime),
        stopBuyTime: dateFormatWithTZ(data[0].fields['Время выкупа']),
        stopTime: dateFormatWithTZ(StopTime),
        step:
          Статус === 'Заказ'
            ? STEPS_VALUE[Статус].step + 2
            : STEPS_VALUE[Статус].step + 1,
        images:
          Images && Array.isArray(Images) ? Images?.map((x) => x.url) : [],
        offerId: OfferId[0],
        status: Статус,
        deliveryDate: dateFormat(data[0]?.fields['Дата получения']),
      };

      ctx.session = createContinueSessionData(value, Артикул, Раздача);
      const response = await ctx.reply(
        getTextByNextStep(ctx.session.step, ctx.session.startTime),
      );
      ctx.session.lastMessage = response.message_id;
      await ctx.answerCallbackQuery();
    });

    /*======== MESSAGE =======*/
    this.bot.on('message', async (ctx) => {
      try {
        if (ctx.session.errorStatus === 'locationError')
          return ctx.reply(STOP_TEXT);

        const { text } = ctx.update.message;

        if (
          ctx.session.lastCommand === COMMAND_NAMES.call ||
          ctx.session.step === STEPS.FINISH.step
        ) {
          const msgToSecretChat = createMsgToSecretChat(
            ctx.from,
            text,
            ctx.session?.data?.articul || '',
            ctx.from.id.toString(),
            ctx.session?.data?.title || '',
            ctx.session.status,
          );
          await ctx.api.sendMessage(getSecretChatId(), msgToSecretChat);

          return await ctx.reply(
            'Ваше сообщение отправлено! Мы уже готовим вам ответ 🧑‍💻',
          );
        }

        if (!ctx.session.data && !text?.includes('query_id')) {
          return await ctx.reply('✌️');
        }

        let data = null;

        //ответ от веб-интерфейса с выбором раздачи
        if (ctx.msg.text.includes('query_id')) {
          if (ctx.session.lastCommand !== COMMAND_NAMES.start) {
            const { first_name, last_name, username, id } = ctx.from;
            ctx.session = createInitialSessionData(
              id?.toString(),
              username || `${first_name} ${last_name || ''}`,
            );
            await this.saveToAirtable(ctx.session);
          }

          const webData = JSON.parse(text) as ITelegramWebApp;
          /*Удаляем первый ответ от сайта он формате объекта*/
          ctx.message.delete().catch(() => {});

          data = await this.getOfferFromWeb(
            webData.offerId,
            webData.id,
            webData.title,
          );
          console.log('==== WEB API ====', data);
          ctx.session = UpdateSessionByField(ctx.session, 'data', data);
          ctx.session = UpdateSessionByField(
            ctx.session,
            'offerId',
            data.offerId,
          );
          ctx.session = UpdateSessionByField(
            ctx.session,
            'status',
            'Выбор раздачи',
          );
          ctx.session = UpdateSessionByStep(ctx.session);
        } else {
          const { step } = ctx.session;
          if (!STEPS_TYPES.text.find((x) => x === step)) {
            return await ctx.reply('На этом шаге должно быть отправлено фото');
          }
        }

        const { step } = ctx.session;

        //первый шаг
        if (STEPS.CHOOSE_OFFER.step === step && data) {
          ctx.session = nextStep(ctx.session);

          await this.updateToAirtable(ctx.session);

          const response = await this.bot.api.sendMediaGroup(
            ctx.message.from.id,
            getTextForFirstStep(data) as any[],
          );

          ctx.session.lastMessage = response[response.length - 1].message_id;
          return response;

          //return await ctx.replyWithPhoto(`${WEB_APP}/images/wb-search.jpg`);
        }

        //проверка артикула
        if (STEPS.CHECK_ARTICUL.step === step) {
          if (!parseUrl(text, ctx.session.data.articul)) {
            const { countTryError } = ctx.session;

            if (
              countTryError === COUNT_TRY_ERROR ||
              ctx.session.errorStatus === 'operator'
            ) {
              ctx.session = UpdateSessionByField(
                ctx.session,
                'comment',
                ctx.message.text,
              );

              await this.updateToAirtable(ctx.session);

              const msgToSecretChat = createMsgToSecretChat(
                ctx.from,
                text,
                ctx.session?.data?.articul || '',
                ctx.from.id.toString(),
                ctx.session?.data?.title || '',
                ctx.session.status,
              );
              await ctx.api.sendMessage(getSecretChatId(), msgToSecretChat);
            }
            ctx.session.lastMessage = ctx.message.message_id;
            ctx.session.countTryError++;

            if (ctx.session.countTryError < COUNT_TRY_ERROR) {
              ctx.session = UpdateSessionByField(
                ctx.session,
                'status',
                'Проблема с артикулом',
              );

              if (ctx.session.countTryError === 1) {
                await this.updateToAirtable(ctx.session);
              }
            }

            await ctx.reply(
              getTextForArticleError(
                ctx.session.data.positionOnWB,
                ctx.session.countTryError,
                ctx.session.errorStatus,
              ),
              getArticulCommand(
                ctx.session.countTryError,
                ctx.session.errorStatus,
              ),
            );

            ctx.session.errorStatus = getArticulErrorStatus(
              ctx.session.errorStatus,
            );
            return;
          } else {
            ctx.session.errorStatus = null;
            ctx.session.countTryError = 0;
            ctx.session = UpdateSessionByField(
              ctx.session,
              'status',
              'Артикул правильный',
            );

            ctx.session = nextStep(ctx.session);
            await this.updateToAirtable(ctx.session);
            return await ctx.reply(
              getTextByNextStep(ctx.session.step, ctx.session.startTime),
            );
          }
        }

        //дата доставки
        if (step === STEPS.DELIVERY_DATE.step) {
          ctx.session.deliveryDate = dateFormat(text);
          ctx.session = nextStep(ctx.session);
          await this.updateToAirtable(ctx.session);
          this.bot.api
            .deleteMessage(ctx.session.chat_id, ctx.session.lastMessage)
            .catch(() => {});
          return await ctx.reply(
            getTextByNextStep(ctx.session.step, ctx.session.startTime),
          );
        }

        //отзыв пользователя
        if (step === STEPS.COMMENT_ON_CHECK.step) {
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

          const msgToSecretChat = createMsgToSecretChat(
            ctx.from,
            ctx.message.text,
            ctx.session.data.articul,
            ctx.session.chat_id,
            ctx.session?.data?.title || '',
            ctx.session.status,
          );
          await ctx.api.sendMessage(getSecretChatId(), msgToSecretChat);

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
получаем раздачу
*/
  async getOfferFromWeb(
    offerId: string,
    id: string,
    title: string,
  ): Promise<ITelegramWebApp> {
    const offerAirtable = await this.airtableService.getOffer(offerId);
    return {
      id: id,
      articul: offerAirtable.fields['Артикул'].toString(),
      offerId,
      title,
      cash: offerAirtable.fields['Кешбэк'],
      priceForYou: offerAirtable.fields['Ваша цена'],
      priceWb: offerAirtable.fields['Цена WB'],
      image: offerAirtable.fields['Фото'][0].url,
      keys: offerAirtable.fields['Ключевые слова'],
      description: offerAirtable.fields['Описание'],
      location: offerAirtable.fields['Региональность'],
      positionOnWB: offerAirtable.fields['Позиция в WB'],
    };
  }
  /*
отправляем заполненные данные пользоваетля в airtable
*/
  async saveToAirtable(session: ISessionData): Promise<any> {
    return await this.airtableService.saveToAirtable(session);
  }
  /*
обновляем данные в airtable
*/
  async updateToAirtable(session: ISessionData): Promise<void> {
    return await this.airtableService.updateToAirtable(session);
  }

  /*public offer in work chat*/
  async sendOfferToChat(id: string): Promise<number> {
    try {
      const offerAirtable = await this.airtableService.getOffer(id);
      const medias = getOffer(offerAirtable);

      const result = await this.bot.api.sendMediaGroup(
        TELEGRAM_CHAT_ID,
        medias,
      );
      return result.at(-1).message_id;
    } catch (e) {
      console.log('sendOfferToChat', e);
    }
  }
  /*work chat close*/
  async closeOfferInChat(
    messageId: number,
    status: OfferStatus,
  ): Promise<string> {
    try {
      const text =
        status === 'Done'
          ? `❗️❗️❗️ Раздача закрыта ❗️❗️❗️`
          : `❗️❗️❗️ Раздача временно остановлена ❗️❗️❗️`;

      if (!messageId) return 'no messageId';

      await this.bot.api.editMessageCaption(TELEGRAM_CHAT_ID, messageId, {
        caption: text,
      });
      return 'Ok';
    } catch (e) {
      console.log('sendOfferToChat', e);
    } finally {
      return 'No';
    }
  }

  /*
обновляем данные в airtable from notification user таблица "Оповещения статистика"
*/
  async updateNotificationStatistic(
    sessionId: string,
    status: NotificationStatisticStatuses,
    count: number,
    BotId: string,
    PatternId: string,
  ): Promise<void> {
    await this.airtableService.updateToAirtableNotificationStatistic({
      SessionId: sessionId,
      ['Количество отправок']: count,
      Статус: status,
      Бот: BotId,
      Шаблон: PatternId,
    });
  }
  /*
добавляем данные в airtable from notification user таблица "Оповещения статистика"
*/
  async addNotificationStatistic(
    sessionId: string,
    status: NotificationStatisticStatuses,
    count: number,
    BotId: string,
    PatternId: string,
  ): Promise<void> {
    await this.airtableService.addToAirtableNotificationStatistic({
      SessionId: sessionId,
      ['Количество отправок']: count,
      Статус: status,
      Бот: BotId,
      Шаблон: PatternId,
    });
  }
  /*NOTIFICATION*/
  async sendNotificationToUser(
    chat_id: number | string,
    sessionId: string,
    botId: string,
    status: BotStatus,
    startTime: string,
    stopTime: string,
    offerName: string,
    dateDelivery: string,
  ): Promise<void> {
    try {
      console.log(chat_id, sessionId, botId, status);
      if (
        status === 'Бот удален' ||
        status === 'Ошибка' ||
        status === 'Время истекло'
      )
        return;
      const notifications = await this.airtableService.getNotifications();
      const statisticNotifications =
        await this.airtableService.getNotificationStatistics(sessionId);

      const value = getNotificationValue(
        notifications,
        statisticNotifications,
        status,
        startTime,
      );

      if (!value || value?.statistic?.fields?.Статус === 'Остановлено') return;

      if (value.status === 'Время истекло') {
        await this.airtableService.updateStatusInBotTableAirtable(
          sessionId,
          value.status,
        );
        await this.updateNotificationStatistic(
          sessionId,
          'Остановлено',
          value?.statistic?.fields
            ? value.statistic.fields['Количество отправок']
            : 1,
          botId,
          value.notification.fields.Id,
        );

        await this.bot.api.sendMessage(
          chat_id,
          value.notification.fields.Сообщение + `\n➡️Раздача: ${offerName}`,
        );
        await this.sendMessageWithKeyboardHistory(chat_id);
        return;
      }
      if (
        !scheduleNotification(
          status,
          stopTime || startTime,
          startTime,
          value?.statistic?.fields['Количество отправок'] || 0,
          dateDelivery,
        )
      ) {
        return;
      }

      if (value.statistic && value.statistic.fields) {
        await this.updateNotificationStatistic(
          sessionId,
          value.statistic.fields['Количество отправок'] + 1 <
            value.notification.fields['Количество попыток']
            ? 'Доставлено'
            : 'Остановлено',
          value.statistic.fields['Количество отправок'] + 1,
          botId,
          value.notification.fields.Id,
        );
      } else {
        await this.addNotificationStatistic(
          sessionId,
          value.notification.fields['Количество попыток'] === 1
            ? 'Остановлено'
            : 'Доставлено',
          1,
          botId,
          value.notification.fields.Id,
        );
      }
      await this.airtableService.updateStatusInBotTableAirtable(
        sessionId,
        value.status,
      );

      await this.bot.api.sendMessage(
        chat_id,
        value.notification.fields.Сообщение + `\n➡️Раздача: ${offerName}`,
      );
    } catch (error: any) {
      if (error instanceof Error) {
        console.log('sendNotificationToUser error=', error);
        if (error.message.includes('403')) {
          await this.airtableService.updateStatusInBotTableAirtable(
            sessionId,
            'Бот удален',
          );
        }
      }
    }
  }

  async sendMessageWithKeyboardHistory(chatId: number | string) {
    const dataBuyer = await this.commandService.getBotByFilter(
      chatId.toString(),
      'chat_id',
    );
    const historyButtons = createHistoryKeyboard(dataBuyer, true);
    const countWorkLabels = createLabelHistory(dataBuyer).length;

    await this.bot.api.sendMessage(
      chatId.toString(),
      `${countWorkLabels > 0 ? 'Выберите новую раздачу или продолжите ⤵️' : '⤵️'}`,
      {
        reply_markup: historyButtons,
      },
    );
  }
}
