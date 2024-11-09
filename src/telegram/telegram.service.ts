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
  //TELEGRAM_CHAT_ID_OFFERS,
  MESSAGE_LIMIT_ORDER,
  WAITING_IMAGE,
  CACHE_WAIT_STATUS,
  IGNORED_STATUSES,
  WEB_APP,
  ERROR_DATE_MESSAGE,
  ADMIN_CHAT_ID,
  MESSAGE_ANSWER_FOR_ASK,
  LIMIT_TIME_IN_MINUTES_FOR_ORDER,
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
  getPhotoForArticulLink,
  getLastSession,
  getLinkForOffer,
  getUserOfferIdsIsFinsih,
  //getTextForSubscriber,
  getUserOffersReady,
  getUserBenefit,
  getOffersByUser,
  checkOnExistOfferByUserOrders,
  getTextForFeedbackByStatus,
  getChatIdFormText,
  getNumberStepByStatus,
  checkTypeStepByName,
  getCorrectStatus,
  parseCheckUrl,
  getTimeoutArticles,
  getTextForHistoryOrders,
  filterNotificationValue,
  itRequestWithCachQuestion,
  sleep,
  getTextForIntervalTime,
  checkOnStopStatus,
  groupByOfferId,
  findFreeKeywords,
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
  //deliveryDateKeyboard,
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
  getDate,
  getDifferenceInDays,
  convertDateFromString,
  parsedDate,
  addMinutesToInterval,
  getDifferenceInMinutes,
  formatMinutesToHoursAndMinutes,
} from 'src/common/date/date.methods';
//import { parseTextFromPhoto } from 'src/common/parsing/image.parser';
import { User } from '@grammyjs/types';
import {
  getOffersLink,
  getOffersLinkForNotification,
} from 'src/airtable/airtable.custom';
import { NotificationName } from 'src/airtable/types/INotification.interface';
import { IOCRResponse } from 'src/common/parsing/image.interface';
import { checkParseImage } from 'src/common/parsing/image.parser';

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

      const userHistory = await this.getUserHistory(ctx.from, true);
      ctx.session = createInitialSessionData(
        id?.toString(),
        userValue.userName || userValue.fio,
      );
      ctx.session.lastCommand = COMMAND_NAMES.start;
      //ctx.session.itsSubscriber = userHistory.itsSubscriber;
      ctx.session.userOffers = userHistory?.userOffers;

      await ctx.reply(sayHi(first_name, userValue.userName, id), {
        reply_markup: userHistory.orderButtons,
      });

      await ctx.reply('Пример раздачи ⤵️', {
        reply_markup: helpKeyboard,
      });

      await this.bot.api.sendMessage(
        id,
        `${userHistory.benefit}\n${userHistory.subscribe}`,
        {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
        },
      );

      if (!ctx.match) {
        await this.saveToAirtable(ctx.session);
      }

      let checkOnLimitUserOffer: boolean = false;

      //запрос через ссылку
      if (ctx.match) {
        const sessionData: ITelegramWebApp = await this.getOfferFromWeb(
          ctx.match,
          id.toString(),
        );

        if (sessionData.errorStatus)
          return await ctx.api.sendMessage(
            ctx.from.id,
            sessionData.errorStatus,
          );

        checkOnLimitUserOffer = checkOnExistOfferByUserOrders(
          sessionData.offerId,
          ctx.session.userOffers,
        );

        ctx.session = updateSessionByField(
          ctx.session,
          'status',
          checkOnLimitUserOffer ? 'Лимит заказов' : 'Выбор раздачи',
        );
        ctx.session = updateSessionByStep(ctx.session);
        ctx.session = updateSessionByField(ctx.session, 'data', sessionData);
        ctx.session = updateSessionByField(
          ctx.session,
          'offerId',
          sessionData.offerId,
        );

        if (checkOnLimitUserOffer) {
          await this.saveToAirtable(ctx.session);
          await ctx.api.sendMessage(ctx.from.id, MESSAGE_LIMIT_ORDER);
          return await this.getKeyboardHistoryWithWeb(ctx.from.id);
        }
        //продолжаем двигаться только если не было заказов с таким артикулом
        const lastInterval = await this.airtableService.getLastIntervalTime(
          sessionData.offerId,
          sessionData.interval,
        );

        ctx.session = updateSessionByField(
          ctx.session,
          'startTime',
          lastInterval,
        );

        // console.log(
        //   'update session',
        //   ctx.session.sessionId,
        //   ctx.session.status,
        // );

        await this.saveToAirtable(ctx.session);

        ctx.session = nextStep(ctx.session, true);
        await this.sendMediaByStep(ctx.session.status, ctx);
        await this.bot.api.sendMediaGroup(
          ctx.session.chat_id,
          getTextForFirstStep(sessionData) as any[],
        );

        const messageId = await this.getGiveawayDetails(
          ctx.message.from.id,
          sessionData.keys,
          lastInterval,
          false,
          ctx.session.sessionId,
          ctx.session.offerId,
          ctx.session.startTime,
        );
        ctx.session.messageId = messageId?.toString();
        ctx.session.lastCommand = null;

        await this.sendDetailsForNoKeyUsers();
      }
    });

    this.bot.command(COMMAND_NAMES.help, async (ctx) => {
      ctx.session.lastCommand = COMMAND_NAMES.help;

      const messageIds = await this.getInstruction(ctx);
      ctx.session.instructionMessages = messageIds;

      const response = await this.getKeyboardHistoryWithWeb(ctx.from.id);
      ctx.session.lastMessage = response.message_id;
    });

    this.bot.command(COMMAND_NAMES.call, async (ctx) => {
      if (ctx?.session?.instructionMessages) {
        await this.clearInstruction(ctx.session, ctx.from.id);
        ctx.session.instructionMessages = null;
      }

      ctx.session.lastCommand = COMMAND_NAMES.call;
      return await ctx.reply('Опишите вашу проблему 😕');
    });

    /*======== HISTORY =======*/
    this.bot.command(COMMAND_NAMES.history, async (ctx) => {
      try {
        if (ctx?.session?.instructionMessages) {
          await this.clearInstruction(ctx.session, ctx.from.id);
          ctx.session.instructionMessages = null;
        }

        ctx.session.lastCommand = COMMAND_NAMES.history;

        const { id } = ctx.from;
        const userInfo = await this.getUserHistory(ctx.from, false);

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
            ? 'Активные раздачи 🫰'
            : getTextForHistoryOrders(
                userInfo?.sum || 0,
                userInfo?.timeoutArticles,
              ),

          {
            reply_markup: userInfo.orderButtons,
          },
        );

        if (userInfo.canStopArticles) {
          return await ctx.reply('Можно отменить👇', {
            reply_markup: userInfo.canStopArticles,
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
        if (ctx?.session?.instructionMessages) {
          await this.clearInstruction(ctx.session, ctx.from.id);
          ctx.session.instructionMessages = null;
        }

        ctx.session.lastCommand = COMMAND_NAMES.offers;

        const { id } = ctx.from;
        const offers = await this.airtableService.getOffers();

        if (offers?.records?.length > 0) {
          return await ctx.api.sendMessage(id, getOffersLink(offers), {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
          });
        }
        await this.bot.api.sendMediaGroup(id, [
          {
            type: 'photo',
            media: WEB_APP + 'images/waiting.webp',
            caption: 'Ждем новых раздач 😉',
          },
        ]);
      } catch (e) {
        console.log('offers=', e);
        return await ctx.reply(
          'Данные обновляются. Попробуйте обновить позже😿',
        );
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

    /*======== VIDEO =======*/
    this.bot.on('message:video', async (ctx) => {
      try {
        const path = await ctx.getFile();
        const url = `${FILE_FROM_BOT_URL}${this.options.token}/${path.file_path}`;
        const firebaseUrl = await this.firebaseService.uploadVideoAsync(url);
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
        return await ctx.reply(
          'Ваше видео сообщение отправлено! Мы уже готовим вам ответ 🧑‍💻',
        );
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('Bad Request: file is too big')) {
            await ctx.api.sendMessage(
              ctx.from.id,
              'Файл слишком тяжелый. Надо уменьшить 🥹',
            );
          }
        }
      }

      return;
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
          return await ctx.reply(MESSAGE_ANSWER_FOR_ASK);
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
          ctx.session = nextStep(ctx.session, true);
        }

        if (!checkTypeStepByName(ctx.session.status, 'image')) {
          await this.sendErrorMessageByStatus(ctx, ctx.session.status);
          return;
        }

        ctx.session.lastMessage = ctx.message.message_id;
        ctx.session = updateSessionByField(ctx.session, 'lastLoadImage', url);

        const responseMsg = await ctx.reply('Это точное фото?', {
          reply_markup: stepKeyboard,
        });

        ctx.session.lastMessage = responseMsg.message_id;
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
      if (ctx?.session?.instructionMessages) {
        await this.clearInstruction(ctx.session, ctx.from.id);
        ctx.session.instructionMessages = null;
      }

      if (!ctx.session?.chat_id) {
        const dataBuyer = await this.airtableService.getBotForContinue(
          ctx.from.id.toString(),
        );
        const lastSession = getLastSession(dataBuyer);
        if (!lastSession)
          return await this.getKeyboardHistoryWithWeb(ctx.from.id);

        ctx.session = await this.restoreSession(ctx, lastSession);
      }
      await this.updateToAirtable(ctx.session);

      ctx.session = nextStep(ctx.session, true);
      ctx.session.step = getNumberStepByStatus(ctx.session.status);

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
      let firebaseUrl: string;

      if (checkTypeStepByName(ctx.session.status, 'image')) {
        // await ctx.editMessageReplyMarkup({
        //   reply_markup: { inline_keyboard: [] },
        // });

        if (!ctx.session.lastMessage) {
          return;
        }

        await ctx.api.editMessageText(
          ctx.session.chat_id,
          ctx.session.lastMessage,
          '⏳',
        );

        firebaseUrl = await this.firebaseService.uploadImageAsync(
          ctx.session.lastLoadImage,
        );

        /* проверка изображений по шагам*/
        try {
          const parseImageData = (await this.commandService.get(
            `https://api.ocr.space/parse/imageurl?apikey=K87126672788957&url=${firebaseUrl}&language=rus&isOverlayRequired=true`,
          )) as IOCRResponse;

          const resultCheckImage = checkParseImage(
            parseImageData,
            ctx.session?.status,
            ctx.session?.data?.keys,
          );
          if (resultCheckImage) {
            ctx.session.checkParseImages = [
              ...ctx.session.checkParseImages,
              ctx.session.status,
            ];
          }
        } catch (error) {
          console.log('parseImageData error= ', error);
        }
        await ctx.api.editMessageText(
          ctx.session.chat_id,
          ctx.session.lastMessage,
          'Фото загружено!',
        );

        ctx.session = updateSessionByStep(ctx.session, firebaseUrl, true);
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
        }
      }

      const checkOnGoNext = await this.canGoNext(
        ctx.session.sessionId,
        ctx.session.status,
      );
      if (!checkOnGoNext) {
        await ctx.reply(`❌${STOP_TEXT}❌`);
        return await this.getKeyboardHistoryWithWeb(ctx.from.id);
      }

      //пока проверки фото нет -- картинка чека всегда будет верной
      if (ctx.session.status === 'Чек неверный') {
        ctx.session.status = 'ЧекWb';
        ctx.session.step = getNumberStepByStatus('ЧекWb');
        ctx.session.checkWb = firebaseUrl;
      }

      await this.updateToAirtable(ctx.session);
      ctx.session = nextStep(ctx.session, true);

      if (ctx.session.step === getNumberStepByStatus('Дата доставки')) {
        ctx.session.lastMessage = ctx.callbackQuery.message.message_id;
      }

      await ctx.callbackQuery.message.editText(
        getTextByNextStep(
          ctx.session.status,
          ctx.session.startTime,
          ctx.session.data.title,
        ),
        // ctx.session.step === getNumberStepByStatus('Дата доставки')
        //   ? { reply_markup: deliveryDateKeyboard }
        //   : null,
      );

      await this.sendMediaByStep(ctx.session.status, ctx);
      await this.getKeyboardHistoryWithWeb(ctx.from.id, ctx.session.sessionId);

      ctx.session.lastMessage = ctx.callbackQuery.message.message_id;
    });

    /*======== CALBACK_QUERY (продолжение раздачи через нажатие кнопки)=======*/
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

      if (!ctx?.session?.status) {
        this.bot.api
          .deleteMessage(ctx.from.id, ctx.callbackQuery.message.message_id)
          .catch(() => {});
        return;
      }

      let response = null;
      if (ctx.session.status === 'Выбор раздачи') {
        response = await this.bot.api.sendMediaGroup(
          ctx.session.chat_id,
          getTextForFirstStep(ctx.session.data) as any[],
        );

        if (ctx.session.data.keys) {
          await ctx.reply(getTextForIntervalTime(ctx.session.startTime), {
            parse_mode: 'HTML',
          });
        }

        await this.sendMediaByStep(ctx.session.status, ctx);
        response = await this.bot.api.sendMediaGroup(
          ctx.from.id,
          getPhotoForArticulLink() as any,
        );
      } else {
        if (
          ctx.session.realStatus === 'Проблема с артикулом' ||
          ctx.session.realStatus === 'Чек неверный'
        ) {
          response = await this.sendErrorMessageByStatus(
            ctx,
            ctx.session.status,
          );
        } else {
          ctx.session = nextStep(ctx.session, true);
          response = await ctx.reply(
            getTextByNextStep(
              ctx.session.status,
              ctx.session.startTime,
              ctx.session.data.title,
            ),
          );
          await this.sendMediaByStep(ctx.session.status, ctx);
        }

        await this.getKeyboardHistory(ctx.from.id, ctx.session.sessionId);
      }

      ctx.session.lastMessage = response.message_id;

      await ctx.answerCallbackQuery();
    });

    /*======== Все текстовые сообщения =======*/
    this.bot.on('message', async (ctx) => {
      try {
        if (ctx.session.errorStatus === 'locationError')
          return ctx.reply(`❌${STOP_TEXT}❌`);

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

          await this.sendMessageAboutCache(ctx.from.id, text);

          const responseMsg = await ctx.api.sendMessage(
            getAdminChatId(),
            msgToChatMessage,
          );

          await this.addNumberToMessageInChatMessage(
            responseMsg.message_id,
            msgToChatMessage,
          );
          if (ctx.session.lastCommand === COMMAND_NAMES.call) {
            await ctx.reply(MESSAGE_ANSWER_FOR_ASK);
            return await this.getKeyboardHistoryWithWeb(ctx.from.id);
          }
        }

        //сохраняем данные по выплатам
        if (
          ctx.session.step === getNumberStepByStatus('Финиш') &&
          !ctx.session.dataForCash
        ) {
          ctx.session = updateSessionByStep(ctx.session, text);
          await this.updateToAirtable(ctx.session);
          await ctx.reply('Принято!✌️');
          await ctx.reply(
            'Если Вам понравился наш товар, Вы можете оставить отзыв 🩷 😉',
          );
          return await ctx.reply('👩‍💻', {
            reply_markup: operatorKeyboard,
          });
        }

        if (!ctx?.session?.data && !text?.includes('query_id')) {
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

          ctx.session = await this.restoreSession(ctx, lastSession);
          ctx.session = nextStep(ctx.session, true);

          if (!ctx?.session?.isRestore) {
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
        let lastInterval = null;

        //ответ от веб с выбором раздачи
        if (ctx.msg?.text?.includes('query_id')) {
          const { id } = ctx.from;
          const userValue = getUserName(ctx.from);

          const webData = JSON.parse(text) as ITelegramWebApp;
          /*Удаляем первый ответ от сайта он формате объекта*/
          ctx.message.delete().catch(() => {});

          data = await this.getOfferFromWeb(
            webData.offerId,
            webData.id,
            webData.title,
          );

          if (data.errorStatus)
            return await ctx.api.sendMessage(ctx.from.id, data.errorStatus);

          lastInterval = await this.airtableService.getLastIntervalTime(
            webData.offerId,
            webData.interval,
          );

          //console.log('lastInterval=', webData.offerId, id, lastInterval);

          ctx.session = createInitialSessionData(
            id?.toString(),
            userValue.userName || userValue.fio,
            lastInterval,
          );

          console.log('==== WEB API ====', data, ctx.session);

          const userHistory = await this.getUserHistory(ctx.from, true);
          ctx.session.userOffers = userHistory?.userOffers;

          ctx.session = updateSessionByField(ctx.session, 'data', data);
          ctx.session = updateSessionByField(
            ctx.session,
            'offerId',
            data.offerId,
          );

          const checkOnLimitUserOffer = checkOnExistOfferByUserOrders(
            data.offerId,
            userHistory?.userOffers,
          );
          ctx.session = updateSessionByField(
            ctx.session,
            'status',
            checkOnLimitUserOffer ? 'Лимит заказов' : 'Выбор раздачи',
          );

          if (checkOnLimitUserOffer) {
            await this.saveToAirtable(ctx.session);
            await ctx.api.sendMessage(ctx.from.id, MESSAGE_LIMIT_ORDER);
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
                if (!convertDateFromString(text))
                  return await ctx.reply(ERROR_DATE_MESSAGE);
                ctx.session.deliveryDate = text;
                break;
              case 'Дата получения':
                if (!convertDateFromString(text))
                  return await ctx.reply(ERROR_DATE_MESSAGE);
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
            await this.updateToAirtable(ctx.session);

            ctx.session = nextStep(ctx.session, true);
            await this.nextStepHandler(ctx);
            return;
          }

          if (
            ctx.session.status !== 'Проблема с артикулом' &&
            ctx.session.status !== 'ЧекWb' &&
            ctx.session.status !== 'Чек неверный' &&
            checkTypeStepByName(ctx.session.status, 'text')
          ) {
            ctx.session = nextStep(ctx.session, true);
          }

          const { status } = ctx.session;
          if (status && !checkTypeStepByName(ctx.session.status, 'text')) {
            await this.sendErrorMessageByStatus(ctx, status);
            return;
          }
        }

        const { status } = ctx.session;

        //первый шаг
        if ('Выбор раздачи' === status && data) {
          const loader = await ctx.reply('⏳');
          await this.saveToAirtable(ctx.session);

          ctx.session = nextStep(ctx.session, true);

          // const wbScreen = await getParseWbInfo(ctx.session.data.articul);
          // let wbUrl: string;
          // if (wbScreen) {
          //   wbUrl = await firebaseService.uploadBufferAsync(wbScreen);
          // }
          setTimeout(() => loader.delete().catch(() => {}), 100);

          const response = await this.bot.api.sendMediaGroup(
            ctx.message.from.id,
            getTextForFirstStep(data) as any[],
          );

          const messageId = await this.getGiveawayDetails(
            ctx.message.from.id,
            data.keys,
            lastInterval,
            false,
            ctx.session.sessionId,
            ctx.session.offerId,
            ctx.session.startTime,
          );
          ctx.session.messageId = messageId?.toString();
          ctx.session.lastMessage = response[response.length - 1].message_id;

          await this.sendDetailsForNoKeyUsers();

          return;
        }
        //проверка артикула
        if (
          'Артикул правильный' === status ||
          'Проблема с артикулом' === status
        ) {
          const checkOnGoNext = await this.canGoNext(
            ctx.session.sessionId,
            ctx.session.status,
          );

          if (!ctx?.session?.data?.keys || ctx.session?.data?.keys === '') {
            const sessionDetails = await this.airtableService.getBotBySession(
              ctx.session.sessionId,
            );

            if (
              sessionDetails?.fields['Ключевое слово'] == 'undefined' ||
              sessionDetails?.fields['Ключевое слово'] == '' ||
              !sessionDetails?.fields['Ключевое слово']
            ) {
              await ctx.api.sendMessage(
                ctx.session.chat_id,
                '📌 Дождитесь пока вам придет ключ для поиска и продолжите заполнение',
              );
              return;
            }

            ctx.session.data.keys = sessionDetails.fields['Ключевое слово'];
            ctx.session.startTime = sessionDetails.fields.StartTime;
          }
          if (!checkOnGoNext) {
            await ctx.reply(`❌${STOP_TEXT}❌`);
            return await this.getKeyboardHistoryWithWeb(ctx.from.id);
          }

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

            await this.sendErrorMessageByStatus(ctx, ctx.session.status);

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

            await this.updateToAirtable(ctx.session);
            ctx.session = nextStep(ctx.session, true);
            await this.nextStepHandler(ctx);
            return;
          }
        } //конец проверки артикула

        //проверка ссылки чека
        if ('ЧекWb' === status || 'Чек неверный' === status) {
          ctx.session = updateSessionByField(
            ctx.session,
            'stopTime',
            getTimeWithTz(),
          );
          if (!parseCheckUrl(text)) {
            ctx.session = updateSessionByField(
              ctx.session,
              'status',
              'Чек неверный',
            );

            await this.updateToAirtable(ctx.session);
            return await this.sendErrorMessageByStatus(ctx, ctx.session.status);
          } else {
            ctx.session = updateSessionByField(ctx.session, 'status', 'ЧекWb');
            ctx.session.step = getNumberStepByStatus('ЧекWb');
            ctx.session.checkWb = text;
            await this.updateToAirtable(ctx.session);
            ctx.session = nextStep(ctx.session, true);
            await this.nextStepHandler(ctx);
            return;
          }
        } //конец проверки ссылки чека
      } catch (e) {
        console.log('message=', e);
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
      errorStatus:
        offerAirtable.fields.Status === 'Done' ||
        offerAirtable.fields.Status === 'Stop' ||
        offerAirtable.fields.Status === 'Архив'
          ? '❌ В данный момент раздача завершена 😿 ❌'
          : null,
      filter: offerAirtable.fields.Фильтр,
      interval: offerAirtable.fields.Интервал,
      offerCount: offerAirtable.fields.Количество,
      offerOrderToday: offerAirtable.fields['Количество заказов сегодня'],
      queueLength: offerAirtable.fields['Длина очереди'],
    };
  }
  /**
   *сохраняем начало сессии в базе
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

  async sendErrorMessageByStatus(ctx: MyContext, status: BotStatus) {
    if (ctx.session.status === 'Проблема с артикулом') {
      const response = await ctx.reply(
        getTextForArticulError(
          ctx.session.data.positionOnWB,
          ctx.session.countTryError,
          ctx.session.errorStatus,
          ctx.session.data.filter,
        ),
        getArticulCommand(ctx.session.countTryError, ctx.session.errorStatus),
      );
      return response;
    }
    await ctx.api.sendMessage(
      ctx.from.id,
      getErrorTextByStep(status).error || '⤵️',
      {
        link_preview_options: {
          is_disabled: true,
        },
      },
    );
    const response = await this.sendMediaByStep(status, ctx);
    return response;
  }

  async nextStepHandler(
    ctx: MyContext,
    showKeyboard: boolean = true,
  ): Promise<void> {
    try {
      await ctx.reply(
        getTextByNextStep(
          ctx.session.status,
          ctx.session.startTime,
          ctx.session.data.title,
        ),
        {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
        },
      );
      await this.sendMediaByStep(ctx.session.status, ctx);
      if (showKeyboard) {
        await this.getKeyboardHistory(ctx.from.id, ctx.session.sessionId);
      }
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
    close: boolean,
    filter: string,
    video: boolean,
  ): Promise<void> {
    try {
      console.log(
        'sendNotificationToUser',
        chat_id,
        sessionId,
        botId,
        status,
        getDateWithTz(startTime),
        startTime,
      );
      if (checkOnStopStatus(status)) return;

      if (close) {
        await this.airtableService.updateStatusInBot(sessionId, 'Отмена');
        await this.bot.api.sendMessage(
          chat_id,
          `\n❌ Раздача: ${offerName} закрыта для продолжения ❌`,
        );
        return;
      }
      const notifications = await this.airtableService.getNotifications();
      // if (status === 'В боте') {
      //   await this.bot.api.sendMessage(
      //     chat_id,
      //     notifications.records.find((x) => x.fields.Название === 'В боте')
      //       .fields.Сообщение,
      //   );
      //   await this.getKeyboardHistoryWithWeb(chat_id);
      //   return;
      // }
      const statisticNotifications =
        await this.airtableService.getNotificationStatistics(sessionId);

      const value = getNotificationValue(
        notifications,
        statisticNotifications,
        status,
        getDateWithTz(startTime),
        filter,
      );

      if (!value) return;

      if (video) {
        const message = notifications.records.find(
          (x) => x.fields.Название === 'Видеопереход',
        )?.fields.Сообщение;
        await this.bot.api.sendMessage(
          process.env.NODE_ENV === 'development' ? ADMIN_CHAT_ID : chat_id,
          '📌' +
            message +
            ` для раздачи 👉 ${offerName}.\n<a href="${WEB_APP}images/file_1730145280794.mp4">Образец ⤵️</a>\nДля отправки сообщения зайдите в Меню 'Написать оператору'👩‍💻`,
          {
            parse_mode: 'HTML',
          },
        );
        return;
      }

      //снимаем с раздачи
      if (value.status === 'Время истекло') {
        try {
          await this.airtableService.updateStatusInBot(sessionId, value.status);

          await this.updateNotificationStatistic(
            sessionId,
            'Остановлено',
            value?.statistic?.fields
              ? value?.statistic?.fields['Количество отправок']
              : 1,
            botId,
            value.notification.fields.Id,
          );

          if (value?.statistic?.fields?.Статус !== 'Остановлено') {
            await this.bot.api.sendMessage(
              process.env.NODE_ENV === 'development' ? ADMIN_CHAT_ID : chat_id,
              value.notification.fields.Сообщение + `\n➡️Раздача: ${offerName}`,
            );
            await this.getKeyboardHistoryWithWeb(chat_id, sessionId);
          }
          return;
        } catch (error) {
          console.log(error);
          return;
        } finally {
          return;
        }
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

      if (!value.notification?.fields?.Id) return;

      if (value?.statistic?.fields) {
        await this.updateNotificationStatistic(
          sessionId,
          value.statistic.fields['Количество отправок'] + 1 <
            value.notification.fields['Количество попыток']
            ? 'Доставлено'
            : 'Остановлено',
          value.statistic?.fields['Количество отправок'] + 1,
          botId,
          value.notification?.fields?.Id,
        );
      } else {
        await this.addNotificationStatistic(
          sessionId,
          value.notification?.fields['Количество попыток'] === 1
            ? 'Остановлено'
            : 'Доставлено',
          1,
          botId,
          value.notification?.fields?.Id,
        );
      }

      await this.bot.api.sendMessage(
        chat_id,
        value?.notification?.fields?.Сообщение + `\n➡️Раздача: ${offerName}`,
      );
      //await this.getKeyboardHistoryWithWeb(chat_id);
    } catch (error: any) {
      //console.log(error);
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          await this.airtableService.updateStatusInBot(sessionId, 'Бот удален');
        }
      }
    }
  }
  async getKeyboardHistory(chatId: number | string, sessionId: string) {
    let dataBuyer = await this.airtableService.getBotForContinue(
      chatId.toString(),
    );
    if (!dataBuyer || !dataBuyer.length || dataBuyer?.length === 0) return;
    if (sessionId) {
      dataBuyer = dataBuyer.filter((x) => x.fields.SessionId !== sessionId);
    }
    const historyButtons = createHistoryKeyboard(dataBuyer, false);
    const countWorkLabels = createLabelHistory(dataBuyer)?.length || 0;

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

  async getKeyboardHistoryWithWeb(
    chatId: number | string,
    timeoutSession?: string,
  ) {
    const dataBuyer = await this.airtableService.getBotForContinue(
      chatId.toString(),
    );

    const historyButtons = createHistoryKeyboard(
      (dataBuyer?.length ?? 0) > 0 && timeoutSession
        ? dataBuyer?.filter((x) => x.fields['SessionId'] !== timeoutSession)
        : dataBuyer,
      true,
    );
    const countWorkLabels = createLabelHistory(dataBuyer)?.length;

    return await this.bot.api.sendMessage(
      process.env.NODE_ENV === 'development'
        ? ADMIN_CHAT_ID
        : chatId.toString(),
      countWorkLabels > 0
        ? `Начать новую или продолжить существующие раздачи👇`
        : 'Выбор новой раздачи👇',
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
  async saveFeedback(from: User, comment: string, isAnswer?: boolean) {
    await this.airtableService.updateCommentInBotTableAirtable(
      from,
      createCommentForDb(comment),
      isAnswer,
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
        step: getNumberStepByStatus(getCorrectStatus(Статус)),
        images: Images?.map((x) => x.url),
        offerId: OfferId[0],
        status: getCorrectStatus(Статус),
        deliveryDate: data[0]?.fields['Дата получения'],
        recivingDate: data[0]?.fields['Факт дата получения'],
        isRestore: true,
        realStatus: Статус,
        checkWb: data[0]?.fields?.['Чек WB'],
        price: data[0]?.fields?.Цена,
        dataForCash: data[0]?.fields['Данные для кешбека'],
        imgCart: data[0]?.fields['Корзина скрин'] || '',
        imgSearch: data[0]?.fields['Поиск скрин'] || '',
        imgGood: data[0]?.fields['Товар скрин'] || '',
        imgOrder: data[0]?.fields['Заказ скрин'] || '',
        imgRecieved: data[0]?.fields['Получен скрин'] || '',
        imgShtrihCode: data[0]?.fields['Штрих-код скрин'] || '',
        checkParseImages: data[0]?.fields['Фото проверка'] || [],
        messageId: data[0]?.fields['MessageId'] || '',
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
        // с поиска начинаются прикрепляться картинки
        if (
          getNumberStepByStatus(session.status) < 0 ||
          (getNumberStepByStatus(session.status) >
            getNumberStepByStatus('Поиск') &&
            (!Images || Images.length === 0))
        ) {
          const timeOutOrders = getTimeoutArticles(data);
          if (timeOutOrders) {
            await ctx.reply(timeOutOrders);
          }
          return;
        }
      }
      return session;
    } catch (error) {
      console.log('restoreSession= ', error, sessionId);
      return null;
    }
  }

  async getInstruction(ctx: MyContext) {
    const ids: number[] = [];
    try {
      for (const value of createHelpText()) {
        const response = await this.bot.api.sendMediaGroup(ctx.from.id, [
          value,
        ]);
        if (Array.isArray(response)) {
          ids.push(
            ...response.map((x) => x.message_id).filter((x) => x !== undefined),
          );
        }
      }
    } catch (error) {
      console.error('Error sending media group:', error);
      // Обработка ошибки (например, можно вернуть пустой массив или выбросить ошибку)
    }
    return ids;
  }
  //full - берем данные из таблицы Раздачи и Бот
  async getUserHistory(from: User, web?: boolean) {
    const { id } = from;
    const dataBuyer = await this.airtableService.getBotForContinue(
      id.toString(),
    );
    const sum = 0;
    const offersFromDistributions = '';
    const orderButtons = createHistoryKeyboard(dataBuyer, web);
    const stopButtons = createHistoryKeyboard(dataBuyer, web, true);

    // let member: ChatMember;
    try {
      //member = await this.bot.api.getChatMember(TELEGRAM_CHAT_ID_OFFERS, id);
    } catch (e) {
      //console.log(e);
    }
    //const subscribe = getTextForSubscriber(member);

    if (!dataBuyer && sum === 0) {
      const benefit = getUserBenefit(null, sum);
      return {
        orderButtons,
        benefit: benefit.text,
        sum: benefit.sum + sum,
        offersReady: '',
        subscribe: '',
        itsSubscriber: false,
        userOffers: getOffersByUser(dataBuyer),
        timeoutArticles: getTimeoutArticles(dataBuyer),
        canStopArticles: stopButtons,
      };
    }

    const offerIdsStatusCheck = getUserOfferIdsIsFinsih(dataBuyer);
    const userOffers =
      await this.airtableService.getUserOffers(offerIdsStatusCheck);
    const benefit = getUserBenefit(userOffers, sum);
    let offersReady = '';
    if (userOffers?.records?.length > 0) {
      offersReady = getUserOffersReady(dataBuyer);
    }

    return {
      orderButtons,
      benefit: benefit.text,
      sum: benefit.sum + sum,
      offersReady: offersReady + offersFromDistributions,
      subscribe: '',
      itsSubscriber: false,
      userOffers: getOffersByUser(dataBuyer),
      timeoutArticles: getTimeoutArticles(dataBuyer),
      canStopArticles: stopButtons,
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

    await this.airtableService.updateStatusInBot(
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
    price: string,
    checkWb: string,
    dateRecived: string,
    dateBuy: string,
    searchScreen: string,
    cartScreen: string,
    orderScreen: string,
    reciveScreen: string,
    shtrihCodeScreen: string,
    checkScreen: string,
    goodScreen: string,
    offerName: string,
  ) {
    try {
      console.log('transferBotToDistributions session=', sessionId, chat_id);

      if (!sessionId) {
        console.log('transferBotToDistributions no session=', sessionId);
        return;
      }
      const buyer = await this.airtableService.findBuyerByChatId(chat_id);

      //console.log('buyerId=', buyer);

      if (!buyer) {
        return await this.airtableService.updateStatusTransferInBot(
          'Chat_id не найден',
          sessionId,
        );
      }

      const distributions = await this.airtableService.getDistributionByIds(
        buyer.fields.Раздачи,
      );
      if (!distributions || distributions.length === 0) {
        const articules = distributions?.map((x) => x.fields['Артикул WB'][0]);
        if (!articules.includes(+articul.trim())) {
          await this.airtableService.updateStatusTransferInBot(
            'Артикул в раздаче не найден',
            sessionId,
          );
          return false;
        }
      }

      let filterDistribution = distributions.filter(
        (x) => x.fields['Артикул WB'][0] === +articul.trim(),
      );

      if (filterDistribution && filterDistribution.length > 1) {
        filterDistribution = distributions.filter((x) => {
          const articulWB = x.fields['Артикул WB'];
          const size = x.fields?.['Размер '];
          if (
            Array.isArray(articulWB) &&
            articulWB.length > 0 &&
            articulWB[0] === +articul.trim() &&
            size &&
            offerName.toLowerCase().includes(size.toLowerCase())
          ) {
            return x;
          }
        });
      }

      if (filterDistribution) {
        const distribution = filterDistribution[0];
        console.log(
          'Дата выкупа =',
          distribution?.fields['Дата выкупа'],
          parsedDate(convertDateFromString(dateRecived)),
        );
        await this.airtableService.updateDistribution({
          id: distribution.id,
          searchScreen: searchScreen,
          cartScreen: cartScreen,
          orderScreen: orderScreen,
          reciveScreen: reciveScreen,
          shtrihCodeScreen: shtrihCodeScreen || WAITING_IMAGE,
          checkScreen: checkScreen || WAITING_IMAGE,
          goodScreen: goodScreen || WAITING_IMAGE,
          chat_id: chat_id,
          articul: articul,
          dataForCash: dataForCash,
          key: distribution?.fields['Ключевой запрос'] || key,
          price:
            distribution?.fields['Цена товара'] ||
            (price ? price?.replace(/\D/g, '') : ''),
          checkWb: checkWb,
          dateRecived:
            distribution?.fields['Дата выкупа'] ||
            (dateRecived
              ? parsedDate(convertDateFromString(dateRecived))
              : null),
          dateBuy: distribution?.fields['Дата заказа'] || dateBuy,
        });
        await this.airtableService.updateStatusTransferInBot(
          'Успешно перенесены',
          sessionId,
        );
        return true;
      } else {
        await this.airtableService.updateStatusTransferInBot(
          'Артикул в раздаче не найден',
          sessionId,
        );
        return false;
      }
    } catch (error) {
      console.log('transferBotToDistributions error=', error);
      await this.airtableService.updateStatusTransferInBot(
        'Ошибка переноса',
        sessionId,
      );
      return false;
    }
  }
  /**
   * перенос данных из таблицы Бот в таблицу Раздачи (запрос идет из таблицы Раздачи)
   */
  async signalToTransferBotToDistributions(
    chat_id: string,
    articul: string,
    id: string,
    price: string,
    dateRecived: string,
    userId: string,
  ) {
    let sessionId;

    try {
      if (!chat_id) {
        chat_id = (await this.airtableService.findBuyerById(userId))?.fields
          .chat_id;
        console.log('chat_id', chat_id);
      }
      const userBotData =
        await this.airtableService.getBotByFilterArticulAndChatId(
          articul,
          chat_id,
        );

      if (userBotData?.fields['SessionId']) {
        sessionId = userBotData?.fields['SessionId'];

        console.log(
          'Факт дата получения',
          userBotData.fields['Факт дата получения'],
          convertDateFromString(userBotData.fields['Факт дата получения']),
        );

        await this.airtableService.updateDistribution({
          id,
          searchScreen: userBotData.fields['Поиск скрин'],
          cartScreen: userBotData.fields['Корзина скрин'],
          orderScreen: userBotData.fields['Заказ скрин'],
          reciveScreen: userBotData.fields['Получен скрин'] || WAITING_IMAGE,
          shtrihCodeScreen:
            userBotData.fields['Штрих-код скрин'] || WAITING_IMAGE,
          checkScreen: userBotData.fields['Чек WB'] || WAITING_IMAGE,
          goodScreen: userBotData.fields['Товар скрин'] || WAITING_IMAGE,
          chat_id,
          articul,
          dataForCash: userBotData.fields['Данные для кешбека'],
          key: userBotData.fields['Ключевое слово'],
          dateBuy: userBotData.fields['StartTime'],
          dateRecived:
            dateRecived ||
            (userBotData.fields['Факт дата получения']
              ? parsedDate(
                  convertDateFromString(
                    userBotData.fields['Факт дата получения'],
                  ),
                )
              : null),
          price: price
            ? price
            : userBotData?.fields['Цена']?.replace(/\D/g, ''),
          checkWb: userBotData.fields['Чек WB'],
        });
        await this.airtableService.updateStatusTransferInBot(
          'Успешно перенесены',
          sessionId,
        );
        console.log('Данные перенесены');
      } else {
        await this.airtableService.updateStatusTransferInBot(
          'Ошибка переноса',
          sessionId,
        );
      }
    } catch (error) {
      console.log('transferBotToDistributions', sessionId, error);
      if (sessionId) {
        await this.airtableService.updateStatusTransferInBot(
          'Ошибка переноса',
          sessionId,
        );
      }
    }
  }

  /**
   * отправка сообщение пользователю в чат из airtable
   */
  async sendMessageToSubscriberFromDb(
    chat_id: number,
    text: string,
    button: string,
  ) {
    const message =
      button === 'Отправить сообщение' ? text : button + '\n' + text;
    await this.bot.api.sendMessage(chat_id, '⁉️' + message);
    await this.saveFeedback(
      { id: chat_id, is_bot: false, username: '', first_name: '' },
      'Ответ ✅ ' + text,
      true,
    );
  }

  async clearInstruction(session: ISessionData, chat_id: number) {
    try {
      if (session.instructionMessages.length > 0) {
        const deletePromises = session.instructionMessages.map((messageId) =>
          this.bot.api.deleteMessage(chat_id, messageId).catch((error) => {
            console.error(`Failed to delete message ${messageId}:`, error);
          }),
        );

        await Promise.all(deletePromises);
      }
      return true;
    } catch (error) {
      console.log('clearInstruction', error);
    }
  }
  /**
   * Проверяем можем ли мы двигаться дальше (проверяем статус из базы на время истекло или отмену, если статуст до Заказа)
   */
  async canGoNext(sessionId: string, status: BotStatus): Promise<boolean> {
    if (!sessionId) return false;
    if (
      getNumberStepByStatus(getCorrectStatus(status)) >=
      getNumberStepByStatus('Заказ')
    )
      return true;

    const statusFromDb =
      await this.airtableService.getBotStatusByUser(sessionId);
    if (IGNORED_STATUSES.includes(statusFromDb)) return false;
    return true;
  }

  /**
   * при нажатии галочки о выплате кешбека обновляем статус в таблице Бот
   */
  async updateStatusByCache(chat_id: string, articul: string) {
    let sessionId;

    try {
      const userBotData =
        await this.airtableService.getBotByFilterArticulAndChatId(
          articul,
          chat_id,
        );

      if (userBotData && userBotData?.fields['SessionId']) {
        sessionId = userBotData?.fields['SessionId'];

        await this.airtableService.updateStatusCacheInBot(sessionId);
        await this.bot.api.sendMessage(
          chat_id,
          `🎉 Здравствуйте! Мы отправили вам 💰💰💰 за участие в раздаче ${userBotData.fields['Раздача']} Ждем вас в новых раздачах 🎉`,
          {
            parse_mode: 'HTML',
          },
        );
      }
    } catch (error) {
      console.log('updateStatusByCache', sessionId, error);
    }
  }
  /**
   * отправляем сообщения у кого просрочка и есть chat_id
   */
  async sendMessageToNoCachedDistributions(articul: string, chat_id: string) {
    try {
      const bot = await this.airtableService.getBotFinish(articul, chat_id);

      if (bot?.fields['Финиш']) {
        const statisticNotifications =
          await this.airtableService.getNotificationStatistics(
            bot.fields['SessionId'],
          );
        const notifications = await this.airtableService.getNotifications();

        const value = filterNotificationValue(
          notifications,
          statisticNotifications,
          CACHE_WAIT_STATUS,
        );

        if (!value || value?.statistic?.fields?.Статус === 'Остановлено') {
          return;
        }

        await this.addNotificationStatistic(
          bot.fields['SessionId'],
          value.notification?.fields['Количество попыток'] === 1
            ? 'Остановлено'
            : 'Доставлено',
          1,
          bot.id,
          value.notification?.fields?.Id,
        );

        await this.bot.api.sendMessage(
          chat_id,
          value.notification.fields.Сообщение,
        );
        console.log('send message ', chat_id);
      }
    } catch (error) {
      console.log('sendMessageToNoCachedDistributions', error);
    }

    //
  }

  /**
   * Сообщение-заглушка для пользователей с вопросом о кеше
   */
  async sendMessageAboutCache(chat_id: number, message: string) {
    if (itRequestWithCachQuestion(message)) {
      const allOrders = await this.airtableService.getBotByFilter(
        chat_id.toString(),
        'chat_id',
      );
      const order = allOrders.find(
        (x) => x.fields['Статус'] === 'Финиш' || x.fields['Статус'] === 'Чек',
      );
      if (order) {
        const statisticNotifications =
          await this.airtableService.getNotificationStatistics(
            order.fields['SessionId'],
          );
        const notifications = await this.airtableService.getNotifications();

        const value = filterNotificationValue(
          notifications,
          statisticNotifications,
          CACHE_WAIT_STATUS,
        );
        await this.bot.api.sendMessage(
          chat_id,
          value.notification.fields.Сообщение,
        );
      } else {
        await this.bot.api.sendMessage(chat_id, MESSAGE_ANSWER_FOR_ASK);
      }
    }
  }

  /**
   * оповещения пользователям
   */
  async alerts(name: NotificationName, activity: string, message: string) {
    if (!activity) return false;
    console.log('natification name = ', name, activity, message);

    const notification = await this.airtableService.getNotificationByField(
      name,
      'Название',
    );

    if (
      notification?.fields['Последнее обновление'] &&
      getDifferenceInDays(notification?.fields['Последнее обновление']) < 3
    ) {
      return false;
    }

    let offersMessage = '';

    if (
      name === 'Новые раздачи для новых клиентов' ||
      name === 'Новые раздачи для постоянных клиентов' ||
      name === 'Новая раздача'
    ) {
      const offers = await this.airtableService.getOffers();
      if (!offers || !offers.records || offers?.records?.length === 0)
        return false;
      offersMessage = getOffersLinkForNotification(
        offers,
        name === 'Новая раздача' ? message : null,
      );
    }

    let data;
    switch (name) {
      case 'Новая раздача':
        data = await this.airtableService.getUsersWithStatus('all');
        break;
      case 'Новые раздачи для новых клиентов':
        data = await this.airtableService.getUsersWithStatus('new');
        break;
      case 'Новые раздачи для постоянных клиентов':
        data = await this.airtableService.getUsersWithStatus('regular');
        break;
      case 'Кэш задержка':
        data = await this.airtableService.getNoCachedDistributions();
        break;
    }

    if (process.env.NODE_ENV !== 'development') {
      console.log('боевая рассылка', data.length);

      data.map(async (item) => {
        try {
          await this.bot.api.sendMessage(item, message + '\n' + offersMessage, {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
          });
          await sleep(1000);
          console.log(`рассылка прошла для ${item}`);
        } catch (error) {
          console.error(
            `chat_id ${item} Ошибка при отправке сообщения: ${error}`,
          );
        }
      });

      //await Promise.all(promises);
    } else {
      //const dataTest = [1841828301, 193250152, 268815178];
      await this.bot.api.sendMessage(
        ADMIN_CHAT_ID,
        message + '\n' + offersMessage,
        {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
        },
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return true;
  }
  async updateNotification(flag: boolean, name: string, time: string) {
    if (flag) {
      await this.airtableService.updateNotification(name, getDate(), 'Успешно');
    } else {
      await this.airtableService.updateNotification(name, time, 'Не успешно');
    }
  }

  async closeWaitings(offerId: string) {
    console.log(`close waitings ${offerId}`);

    const data = await this.airtableService.getWaitingsForClose(offerId);

    if (!data || data.length === 0) return;

    data.forEach(async (item) => {
      try {
        await this.airtableService.updateStatusInBot(
          item.fields.SessionId,
          'Отмена',
        );
        await sleep(600);

        await this.bot.api.sendMessage(
          process.env.NODE_ENV === 'development'
            ? ADMIN_CHAT_ID
            : item.fields.chat_id,
          `📌 Здравствуйте! Вы были в очереди на раздачу ${item.fields.Раздача}. К сожалению, раздача закрылась🙁\n Следите за нашими раздачами.😉`,
        );
      } catch (error) {
        console.error(
          `closeWaitings для chat_id ${item.fields.chat_id} Ошибка при отправке сообщения: ${error}`,
          error,
        );
      }
    });
  }
  async notificationToClosedOffersUsers(
    offerId: string,
    name: string,
    url: string,
  ) {
    const users = await this.airtableService.getClosedOfferUsers(offerId);
    if (!users || users.length === 0) return;

    const data = users?.map((x) => ({
      chatId: x.fields.chat_id,
      sessionId: x.fields.SessionId,
      botId: x.fields.Id,
    }));

    //console.log(data);
    const notifications = await this.airtableService.getNotifications();

    data.map(async (item) => {
      try {
        const statisticNotifications =
          await this.airtableService.getNotificationStatistics(item.sessionId);

        const value = filterNotificationValue(
          notifications,
          statisticNotifications,
          'Отмена',
        );

        if (!value || value?.statistic?.fields?.Статус === 'Остановлено') {
          return;
        }

        await this.addNotificationStatistic(
          item.sessionId,
          value.notification?.fields['Количество попыток'] === 1
            ? 'Остановлено'
            : 'Доставлено',
          1,
          item.botId,
          value.notification?.fields?.Id,
        );

        await this.bot.api.sendMessage(
          item.chatId,
          `🙋‍♀️${value.notification.fields.Сообщение} 👉 <a href='${url}'>${name}</a>`,
          {
            parse_mode: 'HTML',
          },
        );
        await sleep(1000);
        console.log(
          `рассылка notificationToClosedOffersUsers прошла для ${item.chatId}`,
        );
      } catch (error) {
        console.error(
          `chat_id ${item.chatId} Ошибка при отправке сообщения notificationToClosedOffersUsers: ${error}`,
        );
      }
    });
  }
  /**
   * Выбор раздачи - отправляем инфо об интервале , ключу. Если есть ключ, то и скрин шага +
   * инфо о том через сколько раздача или цикл о том сколько осталось на раздачу
   */
  async getGiveawayDetails(
    chat_id: number,
    keys: string,
    lastInterval: string,
    itsWaitingText: boolean,
    sessionId: string,
    offerId: string,
    startTime: string,
  ) {
    if (keys && keys !== '') {
      await this.bot.api.sendMessage(
        chat_id,
        (itsWaitingText
          ? `🕵️ Ваше ключевое слово для поиска 👉 <b>${keys}</b>\n`
          : '') + getTextForIntervalTime(lastInterval),
        {
          parse_mode: 'HTML',
        },
      );
      await this.bot.api.sendMediaGroup(
        chat_id,
        getPhotoForArticulLink() as any,
      );
      const message = await this.bot.api.sendMessage(
        chat_id,
        `⏳ До окончания оформления осталось ${
          process.env.NODE_ENV === 'development'
            ? 3
            : LIMIT_TIME_IN_MINUTES_FOR_ORDER
        } мин.`,
      );

      await this.startTimer(
        chat_id,
        message.message_id,
        sessionId,
        offerId,
        startTime,
      );
      return message.message_id;
    }
  }
  async sendDetailsForNoKeyUsers() {
    try {
      const sessionsWithNoKey =
        await this.airtableService.findUserWithEmptyKey();

      if (!sessionsWithNoKey || sessionsWithNoKey.length === 0) {
        return;
      }
      console.log('sendDetailsForNoKeyUsers', sessionsWithNoKey.length);

      const groupedBotsWithNoKey = groupByOfferId(sessionsWithNoKey);
      // Проход по сгруппированному массиву
      Object.keys(groupedBotsWithNoKey).forEach(async (offerId) => {
        const usesKeys = await this.airtableService.getUsesKeys(offerId); //список занятых слов
        const allOfferKeys = await this.airtableService.getOfferKeys(offerId);
        //console.log('usesKeys', usesKeys);
        //console.log('allOfferKeys', allOfferKeys);
        const freeKeys = findFreeKeywords(allOfferKeys, usesKeys);
        console.log('freeKeys=', freeKeys?.length);

        if (!freeKeys || freeKeys.length === 0) {
          return;
        }
        const interval =
          groupedBotsWithNoKey[offerId][0].fields['Интервал (from OfferId)'];

        if (freeKeys) {
          const users = groupedBotsWithNoKey[offerId].slice(
            0,
            freeKeys.length === 1
              ? groupedBotsWithNoKey[offerId].length
              : freeKeys.length,
          );

          let lastIntervalTime = await this.airtableService.getLastIntervalTime(
            offerId,
            interval,
          );
          for (let index = 0; index < users.length; index++) {
            const x = users[index];

            lastIntervalTime = addMinutesToInterval(
              lastIntervalTime,
              +interval,
            );

            await this.airtableService.updateUserWithEmptyKeyInBotTableAirtable(
              x.fields.SessionId,
              freeKeys.length === 1 ? freeKeys[0] : freeKeys[index],
              lastIntervalTime,
            );

            console.log('lastIntervalTime', lastIntervalTime, freeKeys[index]);

            await this.getGiveawayDetails(
              process.env.NODE_ENV === 'development'
                ? ADMIN_CHAT_ID
                : x.fields.chat_id,
              freeKeys.length === 1
                ? freeKeys[0].toUpperCase()
                : freeKeys[index].toUpperCase(),
              lastIntervalTime,
              true,
              x.fields.SessionId,
              offerId,
              x.fields.StartTime,
            );
          }
        }
      });
    } catch (error) {
      console.log('sendDetailsForNoKeyUsers', error);
    }
  }

  async startTimer(
    chatId: number,
    messageId: number,
    sessionId: string,
    offerId: string,
    startTime: string,
  ) {
    const minutesForStart = getDifferenceInMinutes(startTime);
    const minutes = +minutesForStart.toString().replace('-', '');
    console.log('До начала осталось ' + minutes);
    try {
      if (minutesForStart < 0) {
        // Отправляем сообщение с оставшимся временем до начала
        await this.bot.api.editMessageText(
          chatId,
          messageId,
          `⏳ До начала раздачи осталось ${formatMinutesToHoursAndMinutes(minutes)}`,
        );

        // Запускаем таймер для ожидания начала
        setTimeout(
          async () => {
            await this.startTimerOrder(
              chatId,
              messageId,
              process.env.NODE_ENV === 'development'
                ? 3
                : LIMIT_TIME_IN_MINUTES_FOR_ORDER,
              sessionId,
              offerId,
            );
          },
          minutes * 60 * 1000,
        );
      } else {
        // Если startTime - настоящее или прошлое время
        await this.startTimerOrder(
          chatId,
          messageId,
          process.env.NODE_ENV === 'development'
            ? 3
            : LIMIT_TIME_IN_MINUTES_FOR_ORDER,
          sessionId,
          offerId,
        );
      }
    } catch (error) {
      console.log('startTimer', error);
    }
  }

  /**
   *  Функция для запуска таймера раздачи
   */
  async startTimerOrder(
    chatId: number,
    messageId: number,
    duration: number,
    sessionId: string,
    offerId: string,
  ) {
    let remainingTime = duration * 60 * 1000;
    try {
      // Отправляем сообщение с оставшимся временем каждую минуту
      const interval = setInterval(async () => {
        remainingTime -= 60 * 1000; // Уменьшаем время на 1 минуту
        const status = await this.airtableService.getBotStatusByUser(sessionId);
        const offerStatus = await this.airtableService.getOfferStatus(offerId);
        if (
          remainingTime <= 0 ||
          IGNORED_STATUSES.includes(status) ||
          status === 'Заказ' ||
          offerStatus === 'Done' ||
          offerStatus === 'Stop'
        ) {
          clearInterval(interval); // Останавливаем интервал

          await this.bot.api.deleteMessage(chatId, messageId);

          if (status === 'Заказ' || status === 'Дата доставки') {
            return;
          }

          if (remainingTime <= 0) {
            //отмена заказа
            await this.airtableService.updateStatusInBot(
              sessionId,
              'Время истекло',
            );
            await this.bot.api.sendMessage(
              chatId,
              '❗️Время на раздачу истекло❗️',
            );
            await sleep(2000);
            await this.getKeyboardHistoryWithWeb(chatId);
          }
          if (offerStatus === 'Done' || offerStatus === 'Stop') {
            await this.airtableService.updateStatusInBot(sessionId, 'Отмена');
            await this.bot.api.sendMessage(
              chatId,
              `📌 К сожалению, раздача закрылась 🙁\n Следите за нашими раздачами.😉`,
            );
          }
        } else {
          const minutes = Math.floor(remainingTime / (60 * 1000));
          await this.bot.api.editMessageText(
            chatId,
            messageId,
            `⏳ До конца оформления осталось ${minutes} мин.`,
          );
        }
      }, 60 * 1000); // Каждую минуту
    } catch (error) {
      console.log('startTimer', error);
    }
  }
}
