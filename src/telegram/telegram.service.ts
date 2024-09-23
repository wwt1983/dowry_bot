import { Injectable, Inject, Scope } from '@nestjs/common';
import { Bot, session, GrammyError, HttpError } from 'grammy';
import { hydrateApi, hydrateContext } from '@grammyjs/hydrate';
import {
  ITelegramOptions,
  MyContext,
  MyApi,
  ISessionData,
  ITelegramWebApp,
  FeedbackStatus,
} from './telegram.interface';
import {
  TELEGRAM_MODULE_OPTIONS,
  createHelpText,
  COMMANDS_TELEGRAM,
  COMMAND_NAMES,
  FILE_FROM_BOT_URL,
  TELEGRAM_CHAT_ID,
  STOP_TEXT,
  COUNT_TRY_ERROR,
  ADMIN_COMMANDS_TELEGRAM,
  STEP_EXAMPLE_TEXT_UP,
  TELEGRAM_MESSAGE_CHAT_TEST,
  TELEGRAM_MESSAGE_CHAT_PROD,
  STEP_EXAMPLE_TEXT_DOWN,
  //FOOTER,
  TELEGRAM_CHAT_ID_OFFERS,
  MESSAGE_LIMIT_ORDER,
  MESSAGE_WAITING,
} from './telegram.constants';
import { TelegramHttpService } from './telegram.http.service';
import {
  createInitialSessionData,
  getTextByNextStep,
  getTextForFirstStep,
  updateSessionByStep,
  updateSessionByField,
  sayHi,
  nextStep,
  getOffer,
  parseUrl,
  locationCheck,
  getTextToChatMessage,
  getAdminChatId,
  getNotificationValue,
  scheduleNotification,
  createContinueSessionData,
  getTextForArticulError,
  getArticulErrorStatus,
  createCommentForDb,
  getUserName,
  getErrorTextByStep,
  createMediaForArticul,
  getLastSession,
  getLinkForOffer,
  getUserOfferIdsIsFinsih,
  getTextForSubscriber,
  getUserOffersReady,
  getUserBenefit,
  getArticulesByUser,
  checkOnExistArticuleByUserOrders,
  getTextForFeedbackByStatus,
  getChatIdFormText,
  getNumberStepByStatus,
  checkTypeStepByName,
  //itsSubscriber,
  //getFilterDistribution,
} from './telegram.custom.functions';
import { FirebaseService } from 'src/firebase/firebase.service';
import { AirtableService } from 'src/airtable/airtable.service';
import { getGeoUrl, parseGeoResponse } from './telegram.geo';
import { OfferStatus } from 'src/airtable/types/IOffer.interface';
import {
  //commentKeyboard,
  getArticulCommand,
  stepKeyboard,
  deliveryDateKeyboard,
  createHistoryKeyboard,
  createLabelHistory,
  operatorKeyboard,
  helpKeyboard,
} from './telegram.command';
import { BotStatus } from 'src/airtable/types/IBot.interface';
import { NotificationStatisticStatuses } from 'src/airtable/types/INotificationStatistic.interface';
import {
  FORMAT_DATE,
  FORMAT_DATE_SIMPLE_NO_TIME,
  dateFormat,
  getDateWithTz,
  getTimeWithTz,
  getTimesFromTimesTable,
} from 'src/common/date/date.methods';
//import { parseTextFromPhoto } from 'src/common/parsing/image.parser';
import { ChatMember, User } from '@grammyjs/types';
import { getOffersLink } from 'src/airtable/airtable.custom';
import { ErrorKeyWord } from 'src/airtable/airtable.constants';
//import { getParseWbInfo } from './puppeteer';

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

    //this.bot.use(conversations());
    //this.bot.use(createConversation(message, 'message'));

    this.bot.api.setMyCommands(COMMANDS_TELEGRAM, {
      scope: { type: 'all_private_chats' },
    });

    this.bot.api.setMyCommands(ADMIN_COMMANDS_TELEGRAM, {
      scope: { type: 'default' },
    });

    this.bot.command(COMMAND_NAMES.messageSend, async (ctx) => {
      await ctx.reply('Введите номер пользователя (поле chat_id)');
      ctx.session.lastCommand = COMMAND_NAMES.messageSend;
    });

    /*START*/
    this.bot.command(COMMAND_NAMES.start, async (ctx) => {
      const { id, first_name } = ctx.from;
      const userValue = getUserName(ctx.from);
      ctx.session = createInitialSessionData(
        id?.toString(),
        userValue.userName || userValue.fio,
      );
      const userHistory = await this.getUserHistory(ctx.from, true, true);

      ctx.session.lastCommand = COMMAND_NAMES.start;
      ctx.session.itsSubscriber = userHistory.itsSubscriber;
      ctx.session.userArticules = userHistory?.userArticules;

      await this.saveToAirtable(ctx.session);

      await ctx.reply(sayHi(first_name, userValue.userName, ctx.from.id), {
        reply_markup: userHistory.orderButtons,
      });

      await ctx.reply(
        '💰Кешбэк будет выплачен только при соблюдении всех условий инструкции на 15-17 день.😉',
        {
          reply_markup: helpKeyboard,
        },
      );

      await this.bot.api.sendMessage(
        id,
        `${userHistory.benefit}\n${userHistory.subscribe}`,
        {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
        },
      );
      //await ctx.api.sendMessage(id, FOOTER);

      let existArticleByUser: boolean = false;
      if (ctx.match) {
        const sessionData: ITelegramWebApp = await this.getOfferFromWeb(
          ctx.match,
          id.toString(),
        );

        existArticleByUser = checkOnExistArticuleByUserOrders(
          sessionData.articul,
          ctx.session.userArticules,
        );

        ctx.session = updateSessionByField(
          ctx.session,
          'status',
          existArticleByUser ? 'Лимит заказов' : 'Выбор раздачи',
        );
        ctx.session = updateSessionByStep(ctx.session);
        ctx.session = updateSessionByField(ctx.session, 'data', sessionData);
        ctx.session = updateSessionByField(
          ctx.session,
          'offerId',
          sessionData.offerId,
        );

        if (existArticleByUser) {
          await this.updateToAirtable(ctx.session);
          await ctx.api.sendMessage(ctx.from.id, MESSAGE_LIMIT_ORDER);
          return await this.getKeyboardHistoryWithWeb(ctx.from.id);
        }
        //продолжаем двигаться только если не было заказов с таким артикулом
        if (!existArticleByUser) {
          ctx.session = nextStep(ctx.session, true);
          await this.updateToAirtable(ctx.session);
          await this.sendMediaByStep(ctx.session.status, ctx);
          await this.bot.api.sendMediaGroup(
            ctx.session.chat_id,
            getTextForFirstStep(sessionData) as any[],
          );
        }
        ctx.session.lastCommand = null;
      }
    });

    this.bot.command(COMMAND_NAMES.help, async (ctx) => {
      ctx.session.lastCommand = COMMAND_NAMES.help;
      await this.getInstruction(ctx);

      const response = await this.getKeyboardHistoryWithWeb(ctx.from.id);
      ctx.session.lastMessage = response.message_id;
    });

    this.bot.command(COMMAND_NAMES.call, async (ctx) => {
      ctx.session.lastCommand = COMMAND_NAMES.call;
      return await ctx.reply('Опишите вашу проблему 😕');
    });

    /*======== HISTORY =======*/
    this.bot.command(COMMAND_NAMES.history, async (ctx) => {
      try {
        ctx.session.lastCommand = COMMAND_NAMES.history;

        const { id } = ctx.from;
        const userInfo = await this.getUserHistory(ctx.from, false, true);

        await ctx.api.sendMessage(
          id,
          `Ваш номер 👉${id}\n\n${userInfo.benefit}\n${userInfo.offersReady}\n` +
            userInfo.subscribe,
          {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
          },
        );

        await ctx.reply(
          userInfo.orderButtons
            ? 'Продолжите ⤵️'
            : !userInfo || userInfo.sum === 0
              ? 'Вы пока ничего не купили 😢'
              : 'Все раздачи завершены ✌️',
          {
            reply_markup: userInfo.orderButtons,
          },
        );
        const buttonsForUserStop = await this.getBottonsForStopOfUserOrder(
          ctx.from,
          false,
        );

        if (buttonsForUserStop && buttonsForUserStop.orderButtons) {
          return await ctx.reply('Доступны для отмены ❌', {
            reply_markup: buttonsForUserStop.orderButtons,
          });
        }
      } catch (e) {
        console.log('history=', e);
        return await ctx.reply('Раздел обновляется');
      }
    });

    /*======== Раздачи =======*/
    this.bot.command(COMMAND_NAMES.offers, async (ctx) => {
      try {
        ctx.session.lastCommand = COMMAND_NAMES.offers;

        const { id } = ctx.from;
        const offers = await this.airtableService.getOffers();

        if (offers?.records?.length > 0) {
          return await ctx.api.sendMessage(id, getOffersLink(offers), {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
          });
        }
        await this.bot.api.sendMessage(
          id,
          'Ждем новых раздач 😉 \n' + getTextForSubscriber(null).text,
          {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
          },
        );
      } catch (e) {
        console.log('offers=', e);
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
        ctx.session = updateSessionByField(ctx.session, 'location', location);
      }
      const locationResult = locationCheck(ctx.session.data.location, location);

      if (!locationResult.status) {
        ctx.session = updateSessionByField(
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
      try {
        const path = await ctx.getFile();
        const url = `${FILE_FROM_BOT_URL}${this.options.token}/${path.file_path}`;
        if (
          ctx?.session?.lastCommand === COMMAND_NAMES.call ||
          ctx?.session?.errorStatus ||
          ctx?.session?.lastCommand === COMMAND_NAMES.saveMessage
        ) {
          const firebaseUrl = await this.firebaseService.uploadImageAsync(url);
          if (ctx?.session?.lastCommand === COMMAND_NAMES.saveMessage) {
            const msgToChatMessage = await ctx.api.sendMessage(
              ctx.session.comment,
              firebaseUrl,
            );
            this.addNumberToMessageInChatMessage(
              msgToChatMessage.message_id,
              firebaseUrl,
            );
            await this.airtableService.updateCommentInBotTableAirtable(
              ctx.from,
              createCommentForDb(firebaseUrl, true),
              true,
            );
          } else {
            const msgToChat = await this.saveComment(
              ctx.from,
              firebaseUrl,
              ctx.session?.data?.articul || '',
              ctx.session?.data?.title || '',
              ctx.session.status,
            );
            const responseMsg = await ctx.api.sendMessage(
              getAdminChatId(),
              msgToChat,
            );

            await this.addNumberToMessageInChatMessage(
              responseMsg.message_id,
              msgToChat,
            );
          }
          return await ctx.reply(
            'Ваше сообщение отправлено! Мы уже готовим вам ответ 🧑‍💻',
          );
        }

        if (ctx?.session?.lastCommand === COMMAND_NAMES.messageSend) {
          return await ctx.reply('📵');
        }

        const { data } = ctx?.session;
        if (ctx?.session?.step < 0) return await ctx.reply(STOP_TEXT);

        if (!data || !ctx.session || !ctx.session.step) {
          const dataBuyer = await this.airtableService.getBotForContinue(
            ctx.from.id.toString(),
          );

          const lastSession = getLastSession(dataBuyer);
          if (!lastSession)
            return await this.getKeyboardHistoryWithWeb(ctx.from.id);

          ctx.session = await this.restoreSession(ctx, lastSession);
        }

        if (!checkTypeStepByName(ctx.session.status, 'image')) {
          await ctx.api.sendMessage(
            ctx.from.id,
            getErrorTextByStep(ctx.session.status)?.error || '⤵️',
            {
              link_preview_options: {
                is_disabled: true,
              },
            },
          );
          return;
        }

        ctx.session.lastMessage = ctx.message.message_id;
        ctx.session = updateSessionByField(ctx.session, 'lastLoadImage', url);

        return ctx.reply('Это точное фото?', { reply_markup: stepKeyboard });
      } catch (e) {
        console.log('message:photo', e, ctx.from.id, ctx.session);
      }
    });

    /*======== CANCEL =======*/
    this.bot.callbackQuery('cancel', async (ctx) => {
      this.bot.api
        .editMessageReplyMarkup(ctx.session.chat_id, ctx.session.lastMessage)
        .catch(() => {});
    });

    /*======== OPERATOR =======*/
    this.bot.callbackQuery('operator', async (ctx) => {
      if (ctx.session.step === getNumberStepByStatus('Финиш')) {
        return ctx.reply('Напишите сообщение оператору и ожидайте ответа🧑‍💻');
      }
      //ctx.session = updateSessionByField(ctx.session, 'status', 'Вызов');
      ctx.session.errorStatus = 'operator';
      await this.updateToAirtable(ctx.session);
      return ctx.reply('Опишите вашу проблему😕 и ожидайте ответа оператора🧑‍💻');
    });

    this.bot.callbackQuery('check_articul', async (ctx) => {
      ctx.session.errorStatus = 'check_articul';
      if (!parseUrl(ctx.callbackQuery.data, ctx.session.data.articul)) {
        await ctx.reply(
          getTextForArticulError(
            ctx.session.data.positionOnWB,
            ctx.session.countTryError,
            ctx.session.errorStatus,
            ctx.session.data.filter,
          ),
          getArticulCommand(ctx.session.countTryError, ctx.session.errorStatus),
        );
      } else {
        ctx.session.errorStatus = null;
        ctx.session = nextStep(ctx.session, true);
      }
    });

    /*======== дата доставки (когда нажали пропустить) =======*/
    this.bot.callbackQuery('no_delivery_date', async (ctx) => {
      if (!ctx.session?.chat_id) {
        const dataBuyer = await this.airtableService.getBotForContinue(
          ctx.from.id.toString(),
        );
        const lastSession = getLastSession(dataBuyer);
        if (!lastSession)
          return await this.getKeyboardHistoryWithWeb(ctx.from.id);

        ctx.session = await this.restoreSession(ctx, lastSession);
      }
      ctx.session = nextStep(ctx.session, true);
      ctx.session.step = getNumberStepByStatus(ctx.session.status);
      await this.updateToAirtable(ctx.session);

      await ctx.callbackQuery.message.editText(
        getTextByNextStep(
          ctx.session.status,
          ctx.session.startTime,
          ctx.session.data.title,
        ),
      );
      await this.sendMediaByStep(ctx.session.status, ctx);
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

    /*======== HELP =======*/
    this.bot.callbackQuery('help', async (ctx) => {
      for (const value of createHelpText()) {
        await this.bot.api.sendMediaGroup(ctx.from.id, [value]);
      }
      const response = await this.getKeyboardHistoryWithWeb(ctx.from.id);
      ctx.session.lastMessage = response.message_id;
    });

    /*======== NEXT =======*/
    this.bot.callbackQuery('next', async (ctx) => {
      //IMAGE
      if (checkTypeStepByName(ctx.session.status, 'image')) {
        if (!ctx.session.lastMessage) {
          return;
        }
        ctx.session.lastMessage = null;
        const statusMessage = await ctx.reply('⏳');

        const firebaseUrl = await this.firebaseService.uploadImageAsync(
          ctx.session.lastLoadImage,
        );

        await statusMessage.editText('Фото загружено! ');
        setTimeout(() => statusMessage.delete().catch(() => {}), 500);

        ctx.session = updateSessionByStep(ctx.session, firebaseUrl, true);
        ctx.session = nextStep(ctx.session, true);
      } else {
        //TEXT MESSAGE
        if (!ctx.session.chat_id) {
          const dataBuyer = await this.airtableService.getBotForContinue(
            ctx.from.id.toString(),
          );

          const lastSession = getLastSession(dataBuyer);
          if (!lastSession)
            return await this.getKeyboardHistoryWithWeb(ctx.from.id);

          ctx.session = await this.restoreSession(ctx, lastSession);
        } else {
          ctx.session = nextStep(ctx.session, true);
        }
      }

      await this.updateToAirtable(ctx.session);

      if (ctx.session.step === getNumberStepByStatus('Дата доставки')) {
        ctx.session.lastMessage = ctx.callbackQuery.message.message_id;
      }

      await ctx.callbackQuery.message.editText(
        getTextByNextStep(
          ctx.session.status,
          ctx.session.startTime,
          ctx.session.data.title,
        ),
        ctx.session.step === getNumberStepByStatus('Дата доставки')
          ? { reply_markup: deliveryDateKeyboard }
          : null,
      );

      await this.sendMediaByStep(ctx.session.status, ctx);
      await this.getKeyboardHistory(ctx.from.id, ctx.session.sessionId);

      ctx.session.lastMessage = ctx.callbackQuery.message.message_id;
    });

    /*======== CALBACK_QUERY (продолжение раздачи через кнопку)=======*/
    this.bot.on('callback_query', async (ctx) => {
      if (!ctx.callbackQuery.data.includes('sessionId_'))
        return await ctx.answerCallbackQuery();

      let sessionId = ctx.callbackQuery.data.replace('sessionId_', '').trim();

      //запрос пользователя на отмену заказа
      if (ctx.callbackQuery.data.includes('del')) {
        sessionId = ctx.callbackQuery.data
          .replace('_del', '')
          .replace('sessionId_', '')
          .trim();
        return await this.cancelUserStop(sessionId, ctx.from.id);
      }

      ctx.session = await this.restoreSession(ctx, sessionId);

      if (!ctx.session?.status) return;

      let response = null;

      if (ctx.session.status === 'Выбор раздачи') {
        response = await this.bot.api.sendMediaGroup(
          ctx.session.chat_id,
          getTextForFirstStep(ctx.session.data) as any[],
        );
        await this.sendMediaByStep(ctx.session.status, ctx);
        response = await this.bot.api.sendMediaGroup(
          ctx.from.id,
          createMediaForArticul() as any,
        );
      } else {
        if (ctx.session.status === 'Проблема с артикулом') {
          response = await ctx.api.sendMessage(
            ctx.session.chat_id,
            getTextByNextStep(
              ctx.session.status,
              ctx.session.startTime,
              ctx.session.data.title,
            ),
            {
              link_preview_options: {
                is_disabled: true,
              },
            },
          );
        } else {
          response = await ctx.reply(
            getTextByNextStep(
              ctx.session.status,
              ctx.session.startTime,
              ctx.session.data.title,
            ),
          );
        }
        await this.sendMediaByStep(ctx.session.status, ctx);
        await this.getKeyboardHistory(ctx.from.id, ctx.session.sessionId);
      }

      ctx.session.lastMessage = response.message_id;
      await ctx.answerCallbackQuery();
    });

    /*======== Все текстовые сообщения =======*/
    this.bot.on('message', async (ctx) => {
      try {
        if (ctx.session.errorStatus === 'locationError')
          return ctx.reply(STOP_TEXT);

        //REPLAY сообщения из служебного чата
        if (
          ctx.message.reply_to_message &&
          !ctx.message?.text?.includes('query_id')
        ) {
          const replayResult = await this.replayMessage(ctx);
          if (replayResult && replayResult.chat_id) {
            await this.airtableService.updateCommentInBotTableAirtable(
              {
                id: +replayResult.chat_id,
                is_bot: false,
                first_name: ctx.from.first_name,
              },
              createCommentForDb(
                `Ответ от ${ctx.from.first_name}\n` + replayResult.replyText,
                true,
              ),
              true,
            );
          }
          return;
        }

        const { text } = ctx.update.message; //text = chat_id user
        switch (ctx.session.lastCommand) {
          case COMMAND_NAMES.messageSend:
            const chatId = text;
            const isDigitsOnly = /^\d+$/.test(chatId);
            if (!isDigitsOnly)
              return await ctx.reply('В номере должны быть только цифры');

            ctx.session.comment = chatId;
            ctx.session.lastCommand = COMMAND_NAMES.saveMessage;
            return await ctx.reply('Введите текст для [' + chatId + ']');
          case COMMAND_NAMES.saveMessage:
            ctx.session.lastCommand = null;
            await ctx.api.sendMessage(chatId, 'Ответ оператора🧑‍💻 \n→ ' + text);
            await this.airtableService.updateCommentInBotTableAirtable(
              {
                id: chatId as any as number,
                is_bot: false,
                first_name: ctx.from.first_name,
              },
              createCommentForDb(
                `Ответ от ${ctx.from.first_name}\n` + text,
                true,
              ),
              true,
            );
            await ctx.reply(`Ваше сообщение отправлено!`);
            return;
        }

        if (
          ctx.session.lastCommand === COMMAND_NAMES.call ||
          (ctx.session.step === getNumberStepByStatus('Финиш') &&
            ctx.session.dataForCash)
        ) {
          const msgToChatMessage = await this.saveComment(
            ctx.from,
            text,
            ctx.session?.data?.articul || '',
            ctx.session?.data?.title || '',
            ctx.session.status,
          );

          const responseMsg = await ctx.api.sendMessage(
            getAdminChatId(),
            msgToChatMessage,
          );

          await this.addNumberToMessageInChatMessage(
            responseMsg.message_id,
            msgToChatMessage,
          );
          return await ctx.reply(
            'Ваше сообщение отправлено! Мы уже готовим вам ответ 🧑‍💻',
          );
        }

        //сохраняем данные по выплатам
        if (
          ctx.session.step === getNumberStepByStatus('Финиш') &&
          !ctx.session.dataForCash
        ) {
          ctx.session.dataForCash = text;
          await this.updateToAirtable(ctx.session);

          await ctx.reply('Принято!✌️');
          await ctx.reply('Мы будем рады получить оценку нашей работы 😉');
          return await ctx.reply('👩‍💻', {
            reply_markup: operatorKeyboard,
          });
        }

        if (!ctx.session.data && !text?.includes('query_id')) {
          if (
            ctx.message.chat.id.toString() === TELEGRAM_MESSAGE_CHAT_TEST ||
            ctx.message.chat.id.toString() === TELEGRAM_MESSAGE_CHAT_PROD
          ) {
            return await ctx.reply(`/${COMMAND_NAMES.messageSend}`);
          }
          const { id, first_name } = ctx.from;
          const userValue = getUserName(ctx.from);
          const dataBuyer = await this.airtableService.getBotForContinue(
            id.toString(),
          );
          const lastSession = getLastSession(dataBuyer);
          if (!lastSession)
            return await this.getKeyboardHistoryWithWeb(ctx.from.id);
          //
          ctx.session = await this.restoreSession(ctx, lastSession);

          if (!ctx.session.isRestore) {
            const historyButtons = createHistoryKeyboard(dataBuyer, true);
            await ctx.reply(
              sayHi(first_name, userValue.userName, ctx.from.id),
              {
                reply_markup: historyButtons,
              },
            );
          }
        }

        let data: ITelegramWebApp = null;

        //ответ от веб-интерфейса с выбором раздачи
        if (ctx.msg?.text?.includes('query_id')) {
          const { id } = ctx.from;
          const userValue = getUserName(ctx.from);

          ctx.session = createInitialSessionData(
            id?.toString(),
            userValue.userName || userValue.fio,
          );

          await this.saveToAirtable(ctx.session);

          const webData = JSON.parse(text) as ITelegramWebApp;
          /*Удаляем первый ответ от сайта он формате объекта*/
          ctx.message.delete().catch(() => {});

          data = await this.getOfferFromWeb(
            webData.offerId,
            webData.id,
            webData.title,
          );

          console.log('==== WEB API ====', data, ctx.session);

          const userHistory = await this.getUserHistory(ctx.from, true, true);
          ctx.session.userArticules = userHistory?.userArticules;

          ctx.session = updateSessionByField(ctx.session, 'data', data);
          ctx.session = updateSessionByField(
            ctx.session,
            'offerId',
            data.offerId,
          );

          const existArticulByUser = checkOnExistArticuleByUserOrders(
            data.articul,
            userHistory?.userArticules,
          );
          ctx.session = updateSessionByField(
            ctx.session,
            'status',
            existArticulByUser
              ? 'Лимит заказов'
              : data.keys === ErrorKeyWord
                ? 'В ожидании'
                : 'Выбор раздачи',
          );

          if (existArticulByUser || data.keys === ErrorKeyWord) {
            await this.updateToAirtable(ctx.session);
            await ctx.api.sendMessage(
              ctx.from.id,
              existArticulByUser ? MESSAGE_LIMIT_ORDER : MESSAGE_WAITING,
            );
            return await this.getKeyboardHistoryWithWeb(ctx.from.id);
          }
        } else {
          ctx.session = updateSessionByStep(ctx.session);

          //дата доставки или дата получения или цена
          if (
            ctx.session.status === 'Дата доставки' ||
            ctx.session.status === 'Дата получения' ||
            ctx.session.status === 'Цена'
          ) {
            switch (ctx.session.status) {
              case 'Дата доставки':
                ctx.session.deliveryDate = text;
                break;
              case 'Дата получения':
                ctx.session.recivingDate = text;
                break;
              case 'Цена':
                ctx.session.price = text;
                break;
              default:
                break;
            }

            this.bot.api
              .deleteMessage(ctx.session.chat_id, ctx.session.lastMessage)
              .catch(() => {});

            ctx.session = nextStep(ctx.session, true);
            await this.updateToAirtable(ctx.session);
            await this.nextStepHandler(ctx);

            return;
          }

          if (
            ctx.session.status !== 'Проблема с артикулом' &&
            checkTypeStepByName(ctx.session.status, 'text')
          ) {
            ctx.session = nextStep(ctx.session, true);
          }

          const { status } = ctx.session;
          if (status && !checkTypeStepByName(ctx.session.status, 'text')) {
            await ctx.api.sendMessage(
              ctx.from.id,
              getErrorTextByStep(status).error || '⤵️',
              {
                link_preview_options: {
                  is_disabled: true,
                },
              },
            );
            await this.sendMediaByStep(status, ctx);
            return;
          }
        }

        const { status } = ctx.session;

        //первый шаг
        if ('Выбор раздачи' === status && data) {
          const loader = await ctx.reply('⏳');
          ctx.session = nextStep(ctx.session, true);
          await this.updateToAirtable(ctx.session);

          // const wbScreen = await getParseWbInfo(ctx.session.data.articul);
          // let wbUrl: string;
          // if (wbScreen) {
          //   wbUrl = await firebaseService.uploadBufferAsync(wbScreen);
          // }
          setTimeout(() => loader.delete().catch(() => {}), 100);

          let response = await this.bot.api.sendMediaGroup(
            ctx.message.from.id,
            getTextForFirstStep(data) as any[],
          );

          response = await this.bot.api.sendMediaGroup(
            ctx.message.from.id,
            createMediaForArticul() as any,
          );

          ctx.session.lastMessage = response[response.length - 1].message_id;
          return response;
        }
        //проверка артикула
        if (
          'Артикул правильный' === status ||
          'Проблема с артикулом' === status
        ) {
          ctx.session = updateSessionByField(
            ctx.session,
            'stopTime',
            getTimeWithTz(),
          );
          if (!parseUrl(text, ctx.session.data.articul)) {
            const { countTryError } = ctx.session;
            if (
              countTryError === COUNT_TRY_ERROR ||
              ctx.session.errorStatus === 'operator'
            ) {
              ctx.session = updateSessionByField(
                ctx.session,
                'comment',
                ctx.message.text,
              );

              await this.updateToAirtable(ctx.session);

              const msgToChat = await this.saveComment(
                ctx.from,
                text,
                ctx.session?.data?.articul || '',
                ctx.session?.data?.title || '',
                ctx.session.status,
              );

              const responseMsg = await ctx.api.sendMessage(
                getAdminChatId(),
                msgToChat,
              );

              await this.addNumberToMessageInChatMessage(
                responseMsg.message_id,
                msgToChat,
              );
            }

            ctx.session.lastMessage = ctx.message.message_id;
            ctx.session.countTryError++;

            if (ctx.session.countTryError <= COUNT_TRY_ERROR) {
              ctx.session = updateSessionByField(
                ctx.session,
                'status',
                'Проблема с артикулом',
              );

              if (ctx.session.countTryError === 1) {
                await this.updateToAirtable(ctx.session);
              }
            }

            await ctx.reply(
              getTextForArticulError(
                ctx.session.data.positionOnWB,
                ctx.session.countTryError,
                ctx.session.errorStatus,
                ctx.session.data.filter,
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
            ctx.session = updateSessionByField(
              ctx.session,
              'status',
              'Артикул правильный',
            );
            ctx.session.step = getNumberStepByStatus('Артикул правильный');

            ctx.session = nextStep(ctx.session, true);
            await this.updateToAirtable(ctx.session);

            await this.nextStepHandler(ctx);
            return;
          }
        } //конец проверки артикула
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
    title?: string,
  ): Promise<ITelegramWebApp> {
    const offerAirtable = await this.airtableService.getOffer(
      offerId,
      true,
      true,
    );

    return {
      id: id,
      articul: offerAirtable.fields['Артикул']?.toString(),
      offerId,
      title: title || offerAirtable.fields.Name,
      cash: offerAirtable.fields['Кешбэк'],
      priceForYou: offerAirtable.fields['Ваша цена'],
      priceWb: offerAirtable.fields['Цена WB'],
      image: offerAirtable.fields['Фото'][0].thumbnails.full.url,
      keys: offerAirtable.fields['Ключевые слова'],
      description: offerAirtable.fields['Описание'],
      location: offerAirtable.fields['Региональность'],
      positionOnWB: offerAirtable.fields['Позиция в WB'],
      times: getTimesFromTimesTable(offerAirtable.fields['Время бронь']),
      countTryError: 0,
      errorStatus: null,
      filter: offerAirtable.fields.Фильтр,
    };
  }
  /**
   *отправляем заполненные данные пользователя в airtable
   */
  async saveToAirtable(session: ISessionData): Promise<any> {
    return await this.airtableService.saveToAirtable(session);
  }

  /**
   * обновляем данные в airtable
   */

  async updateToAirtable(session: ISessionData): Promise<void> {
    return await this.airtableService.updateToAirtable(session);
  }

  async nextStepHandler(ctx: MyContext): Promise<void> {
    try {
      await ctx.reply(
        getTextByNextStep(
          ctx.session.status,
          ctx.session.startTime,
          ctx.session.data.title,
        ),
      );
      await this.sendMediaByStep(ctx.session.status, ctx);
      await this.getKeyboardHistory(ctx.from.id, ctx.session.sessionId);
    } catch (error) {
      console.log('nextStepHandler', error);
    }
  }
  /**
   *публикация раздачи в чате
   */
  async sendOfferToChat(id: string): Promise<number> {
    try {
      const offerAirtable = await this.airtableService.getOffer(id);
      const medias = getOffer(offerAirtable);

      const result = await this.bot.api.sendMediaGroup(
        TELEGRAM_CHAT_ID,
        medias,
      );
      const offerLink = getLinkForOffer(offerAirtable);
      if (offerLink) {
        await this.bot.api.sendMessage(TELEGRAM_CHAT_ID, offerLink, {
          parse_mode: 'HTML',
        });
      }

      return result.at(-1).message_id;
    } catch (e) {
      console.log('sendOfferToChat= возможно не опубликован в чате или ', e);
    }
  }

  /**
   * публикация заявки с сайта
   */
  async sendOrderToChat(
    phone: string,
    name: string,
    articul: string,
  ): Promise<number> {
    try {
      const result = await this.bot.api.sendMessage(
        TELEGRAM_CHAT_ID,
        'Заявка с сайта \n' +
          'телефон: ' +
          phone +
          '\nФИО: ' +
          name +
          '\nАртикул: ' +
          articul +
          `\nДата заявки: ${getTimeWithTz()}`,
        {
          parse_mode: 'HTML',
        },
      );

      return result?.message_id;
    } catch (e) {
      console.log('sendOrderToChat= возможно не опубликован в чате или ', e);
      return -1;
    }
  }

  /**
   * закрытие раздачи в чате
   */
  async closeOfferInChat(
    messageId: number,
    status: OfferStatus,
  ): Promise<void> {
    try {
      const text =
        status === 'Done'
          ? `❗️ Раздача закрыта ❗️`
          : `❗️ Раздача временно остановлена ❗️`;

      if (!messageId) return;

      await this.bot.api.editMessageCaption(TELEGRAM_CHAT_ID, messageId, {
        caption: text,
      });
    } catch (e) {
      console.log('sendOfferToChat', e);
    }
  }

  /**
   *обновляем данные в airtable from notification user таблица "Оповещения статистика"
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
    outFromOffer: boolean,
  ): Promise<void> {
    try {
      console.log(
        'sendNotificationToUser',
        chat_id,
        sessionId,
        botId,
        status,
        getDateWithTz(startTime),
      );
      if (
        status === 'Бот удален' ||
        status === 'Ошибка' ||
        status === 'Время истекло'
      )
        return;
      if (outFromOffer) {
        await this.bot.api.sendMessage(
          chat_id,
          `\n❌ Раздача: ${offerName} закрыта для продолжения ❌`,
        );
        return;
      }
      const notifications = await this.airtableService.getNotifications();
      if (status === 'В боте') {
        await this.bot.api.sendMessage(
          chat_id,
          notifications.records.find((x) => x.fields.Название === 'В боте')
            .fields.Сообщение,
        );
        await this.getKeyboardHistoryWithWeb(chat_id);
        return;
      }
      const statisticNotifications =
        await this.airtableService.getNotificationStatistics(sessionId);

      const value = getNotificationValue(
        notifications,
        statisticNotifications,
        status,
        getDateWithTz(startTime),
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
        await this.getKeyboardHistoryWithWeb(chat_id);
        return;
      }
      if (
        !scheduleNotification(
          status,
          getDateWithTz(stopTime) || getDateWithTz(startTime),
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
          value.notification?.fields['Количество попыток'] === 1
            ? 'Остановлено'
            : 'Доставлено',
          1,
          botId,
          value.notification.fields.Id,
        );
      }

      await this.bot.api.sendMessage(
        chat_id,
        value.notification.fields.Сообщение + `\n➡️Раздача: ${offerName}`,
      );
      await this.getKeyboardHistoryWithWeb(chat_id);
    } catch (error: any) {
      console.log(error);

      if (error instanceof Error) {
        if (error.message.includes('403')) {
          await this.airtableService.updateStatusInBotTableAirtable(
            sessionId,
            'Бот удален',
          );
        }
      }
    }
  }
  async getKeyboardHistory(chatId: number | string, sessionId: string) {
    let dataBuyer = await this.airtableService.getBotForContinue(
      chatId.toString(),
    );
    if (!dataBuyer || dataBuyer.length === 0) return;
    if (sessionId) {
      dataBuyer = dataBuyer.filter((x) => x.fields.SessionId !== sessionId);
    }
    const historyButtons = createHistoryKeyboard(dataBuyer, false);
    const countWorkLabels = createLabelHistory(dataBuyer).length;

    if (countWorkLabels > 0) {
      return await this.bot.api.sendMessage(
        chatId.toString(),
        'Вы можете продолжить раздачу ⤵️',
        {
          reply_markup: historyButtons,
        },
      );
    }
    return;
  }

  async getKeyboardHistoryWithWeb(chatId: number | string) {
    const dataBuyer = await this.airtableService.getBotForContinue(
      chatId.toString(),
    );

    const historyButtons = createHistoryKeyboard(dataBuyer, true);
    const countWorkLabels = createLabelHistory(dataBuyer).length;

    return await this.bot.api.sendMessage(
      chatId.toString(),
      `${countWorkLabels > 0 ? 'Выберите новую раздачу или продолжите ⤵️' : 'Выберите новую раздачу ⤵️'}`,
      {
        reply_markup: historyButtons,
      },
    );
  }

  async saveComment(
    from: User,
    comment: string,
    order: string,
    name: string,
    status?: BotStatus,
  ) {
    const msgToChat = getTextToChatMessage(
      from,
      comment,
      order,
      from.id,
      name,
      status,
    );

    await this.airtableService.updateCommentInBotTableAirtable(
      from,
      createCommentForDb(comment),
    );
    return msgToChat;
  }
  /**
   * сохраняем отзыв в базу
   */
  async saveFeedback(from: User, comment: string) {
    await this.airtableService.updateCommentInBotTableAirtable(
      from,
      createCommentForDb(comment),
    );
    return;
  }

  async sendMediaByStep(
    statusName: BotStatus,
    ctx: MyContext,
    caption?: 'up' | 'down',
  ) {
    try {
      const url = getErrorTextByStep(statusName);
      if (url && url?.url) {
        return await this.bot.api.sendMediaGroup(ctx.from.id, [
          {
            type: 'photo',
            media: url.url,
            caption:
              caption && caption === 'down'
                ? STEP_EXAMPLE_TEXT_DOWN
                : STEP_EXAMPLE_TEXT_UP,
          },
        ]);
      }
    } catch (e) {
      console.log('sendMediaByStep=', statusName, e);
    }
  }

  /**
   * восстановление раздачи по сессии
   * */
  async restoreSession(ctx: MyContext, sessionId: string) {
    try {
      //sort by StopTime - this will be last session
      const data = await this.airtableService.getBotByFilter(
        sessionId,
        'SessionId',
      );

      console.log('restore ', sessionId, data);

      const { id } = ctx.from;

      if (!data || data.length === 0) {
        await this.getKeyboardHistoryWithWeb(id);
        return;
      }
      const { Images, StopTime, StartTime, Статус, OfferId, Артикул, Раздача } =
        data[0].fields;

      const userValue = getUserName(ctx.from);

      const value: ISessionData = {
        sessionId: sessionId,
        user: userValue.userName || userValue.fio,
        chat_id: id.toString(),
        startTime: dateFormat(StartTime, FORMAT_DATE),
        stopBuyTime: dateFormat(data[0].fields['Время выкупа'], FORMAT_DATE),
        stopTime: dateFormat(StopTime, FORMAT_DATE),
        step: getNumberStepByStatus(Статус),
        images: Images?.map((x) => x.url),
        offerId: OfferId[0],
        status: Статус,
        deliveryDate: data[0]?.fields['Дата получения'],
        recivingDate: data[0]?.fields['Факт дата получения'],
        isRestore: true,
        price: data[0].fields?.Цена,
      };

      let session = createContinueSessionData(
        value,
        Артикул,
        Раздача,
        data[0].fields['Ключевое слово'],
      );

      const sessionData: ITelegramWebApp = await this.getOfferFromWeb(
        session.offerId,
        session.chat_id,
      );

      session = updateSessionByField(session, 'data', sessionData);

      if (Статус === 'Проблема с артикулом') {
        session.errorStatus = 'check_articul';
      } else {
        //session = nextStep(session, true);
        // с поиска начинаются прикрепляться картинки
        if (
          getNumberStepByStatus(Статус) < 0 ||
          (getNumberStepByStatus(Статус) > getNumberStepByStatus('Поиск') &&
            (!Images || Images.length === 0))
        ) {
          await this.getKeyboardHistoryWithWeb(id);
          return;
        }
      }

      return session;
    } catch (error) {
      console.log(error, sessionId);
    }
  }

  async getInstruction(ctx: MyContext) {
    for (const value of createHelpText()) {
      await this.bot.api.sendMediaGroup(ctx.from.id, [value]);
    }
  }
  //full - берем данные из таблицы Раздачи и Бот
  async getUserHistory(from: User, web?: boolean, full?: boolean) {
    const { id } = from;
    const dataBuyer = await this.airtableService.getBotForContinue(
      id.toString(),
    );
    const name = getUserName(from);
    const sum = 0;
    const offersFromDistributions = '';
    if (full && (name.fio || name.userName)) {
      //if (name.userName === 'val_tom') name.userName = 'OxanaWeber';
      // const dataDistributions =
      //   await this.airtableService.getDistributionTableByNick(
      //     name.userName || name.fio,
      //   );
      // const filterDistributions = getFilterDistribution(
      //   dataDistributions,
      //   dataBuyer,
      // );
      //sum = filterDistributions?.sum;
      //offersFromDistributions = filterDistributions.offers;
    }
    const orderButtons = createHistoryKeyboard(dataBuyer, web);
    let member: ChatMember;
    try {
      member = await this.bot.api.getChatMember(TELEGRAM_CHAT_ID_OFFERS, id);
    } catch (e) {
      //console.log(e);
    }
    const subscribe = getTextForSubscriber(member);

    if (!dataBuyer && sum === 0) {
      const benefit = getUserBenefit(null, sum);
      return {
        orderButtons,
        benefit: benefit.text,
        sum: benefit.sum + sum,
        offersReady: '',
        subscribe: subscribe.text,
        itsSubscriber: subscribe.status,
        userArticules: getArticulesByUser(dataBuyer),
      };
    }

    const offerIdsStatusCheck = getUserOfferIdsIsFinsih(dataBuyer);
    const userOffers =
      await this.airtableService.getUserOffers(offerIdsStatusCheck);
    const benefit = getUserBenefit(userOffers, sum);
    let offersReady = '';
    if (userOffers && userOffers.records && userOffers.records.length > 0) {
      offersReady = getUserOffersReady(dataBuyer);
    }

    return {
      orderButtons,
      benefit: benefit.text,
      sum: benefit.sum + sum,
      offersReady: offersReady + offersFromDistributions,
      subscribe: subscribe.text,
      itsSubscriber: subscribe.status,
      userArticules: getArticulesByUser(dataBuyer),
    };
  }

  /**
   * кнопки для остановки раздачи пользователем
   */
  async getBottonsForStopOfUserOrder(from: User, web?: boolean) {
    const { id } = from;
    const dataBuyer = await this.airtableService.getBotForContinue(
      id.toString(),
    );

    const orderButtons = createHistoryKeyboard(dataBuyer, web, true);
    return {
      orderButtons,
    };
  }

  /**
   * раздача останавливается пользователем
   */
  async cancelUserStop(sessionId: string, chat_id: number) {
    if (!sessionId) {
      return await this.bot.api.sendMessage(
        chat_id,
        `Что-то пошло не так 😟. Напишите нам о проблеме, мы ее обязательно решим.`,
        {
          parse_mode: 'HTML',
        },
      );
    }

    await this.airtableService.updateStatusInBotTableAirtable(
      sessionId,
      'Отмена пользователем',
    );
    return await this.bot.api.sendMessage(
      chat_id,
      `Заказ отменен. Выберите новую раздачу.`,
      {
        parse_mode: 'HTML',
      },
    );
  }
  /**
   *сообщение пользователю о публикации отзыва
   */
  async sendFeadbackToUser(
    status: FeedbackStatus,
    chat_id: string,
    datePublishFeedback: string,
    userName: string,
    sessionId: string,
  ): Promise<boolean> {
    try {
      if (dateFormat(datePublishFeedback, FORMAT_DATE)) {
        const textForFeedback = getTextForFeedbackByStatus(
          status,
          dateFormat(datePublishFeedback, FORMAT_DATE_SIMPLE_NO_TIME),
        );
        await this.bot.api.sendMessage(chat_id, textForFeedback, {
          parse_mode: 'HTML',
        });
        await this.airtableService.updateCommentInBotTableAirtable(
          { id: +chat_id, is_bot: false, first_name: userName },
          textForFeedback,
          true,
        );

        const comments = await this.airtableService.getCommetByChatId(chat_id);
        const comment = comments.records.find((x) =>
          x.fields['Комментарии'].includes(sessionId),
        );

        const regex = /\[([^\]]+)\]/g;
        const matches = comment?.fields['Комментарии']?.match(regex);
        if (matches) {
          const originalMessageId = matches
            .find((x) => x.includes(sessionId))
            .slice(1, -1)
            .replace(sessionId, '')
            .replace('\\', '')
            .replace('_', '');
          const message = await this.bot.api.forwardMessage(
            getAdminChatId(),
            getAdminChatId(),
            +originalMessageId,
          );
          //console.log('Сообщение:', message.message_id, message.text);
          await this.bot.api.editMessageText(
            getAdminChatId(),
            +originalMessageId,
            '✅ ' + message.text,
          );
          await this.bot.api.deleteMessage(
            getAdminChatId(),
            message.message_id,
          );
        } else {
          await this.bot.api.sendMessage(
            getAdminChatId(),
            'Admin. Сообщение не отправлено chat_id=' +
              chat_id +
              ', sessionId=' +
              sessionId,
            {
              parse_mode: 'HTML',
            },
          );
        }
        return true;
      }
      console.log("sendFedbackToUser do'not send");
      return false;
    } catch (e) {
      await this.bot.api.sendMessage(
        getAdminChatId(),
        'Admin. Сообщение не отправлено chat_id=' +
          chat_id +
          ', sessionId=' +
          sessionId +
          e,
        {
          parse_mode: 'HTML',
        },
      );
      console.log('sendFedbackToUser= ', e);
    }
  }
  /**
   * Ответ на сообщение через replay
   */
  async replayMessage(ctx: MyContext) {
    try {
      // Проверяем, является ли сообщение ответом на другое сообщение
      if (ctx.message.reply_to_message) {
        const originalMessageId = ctx.message.reply_to_message.message_id;
        const replyText = ctx.message.text;
        await this.bot.api.editMessageText(
          getAdminChatId(),
          originalMessageId,
          '✅ ' + ctx.message.reply_to_message.text,
        );
        const chat_id = getChatIdFormText(ctx.message.reply_to_message.text);
        if (chat_id) {
          await ctx.api.sendMessage(
            chat_id,
            'Ответ оператора🧑‍💻 \n→ ' + replyText,
          );
          return { replyText, chat_id };
        }
        await ctx.reply(`Проблема с отправкой сообщения 😟 chat_id не найден.`);
        return null;
      }
    } catch (error) {
      await ctx.reply(`Проблема с отправкой сообщения 😟.`);
      return null;
    }
  }

  /**
   * отметка об ответе в чате сообщений
   */
  async addNumberToMessageInChatMessage(
    messageId: number,
    text: string,
  ): Promise<boolean> {
    try {
      if (!messageId) return;

      await this.bot.api.editMessageText(
        getAdminChatId(),
        messageId,
        '📌[' + messageId + '] ' + text,
      );
      return true;
    } catch (e) {
      console.log('checkMessageInChatMessage', e);
      return false;
    }
  }
  /**
   * перенос данных из таблицы Бот в таблицу Раздачи
   */
  async transferBotToDistributions(
    sessionId: string,
    chat_id: string,
    userName: string,
    images: string[],
    articul: string,
    dataForCash: string,
    key: string,
  ) {
    try {
      console.log('session=', sessionId, images, dataForCash);

      let distribustion =
        await this.airtableService.getDistributionByFilterArticulAndNick(
          articul,
          userName,
        );

      if (!distribustion) {
        distribustion =
          await this.airtableService.getDistributionByFilterArticulAndNick(
            articul,
            null,
            chat_id,
          );
      }

      //console.log('distribustion = ', distribustion);

      if (distribustion && distribustion.id) {
        this.airtableService.updateDistribution({
          id: distribustion.id,
          searchScreen: images[0],
          cartScreen: images[1],
          orderScreen: images[2],
          reciveScreen: images[3],
          shtrihCodeScreen: images[4],
          checkScreen: images[5],
          chat_id: chat_id,
          articul: articul,
          dataForCash: dataForCash,
          key: key,
        });
        await this.airtableService.updateStatusTransferInBot(
          'Успешно перенесены',
          sessionId,
        );
      }
    } catch (error) {
      console.log('transferBotToDistributions', error);
      await this.airtableService.updateStatusTransferInBot(
        'Ошибка переноса',
        sessionId,
      );
    }
  }
}
