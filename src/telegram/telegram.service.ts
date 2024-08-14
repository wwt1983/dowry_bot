import { Injectable, Inject, Scope } from '@nestjs/common';
import { Bot, session, GrammyError, HttpError } from 'grammy';
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
  createHelpText,
  COMMANDS_TELEGRAM,
  COMMAND_NAMES,
  FILE_FROM_BOT_URL,
  STEPS_TYPES,
  TELEGRAM_CHAT_ID,
  STEPS,
  STOP_TEXT,
  COUNT_TRY_ERROR,
  ADMIN_COMMANDS_TELEGRAM,
  STEP_EXAMPLE_TEXT_UP,
  TELEGRAM_MESSAGE_CHAT_TEST,
  TELEGRAM_MESSAGE_CHAT_PROD,
  STEP_EXAMPLE_TEXT_DOWN,
  FOOTER,
  TELEGRAM_CHAT_ID_OFFERS,
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
  sendToSecretChat,
  getSecretChatId,
  getNotificationValue,
  scheduleNotification,
  createContinueSessionData,
  getTextForArticleError,
  getArticulErrorStatus,
  createCommentForDb,
  getUserName,
  getErrorTextByStep,
  createMediaForArticul,
  getLastSession,
  getLinkForOffer,
  getUserOfferIdsByStatus,
  getTextForSubscriber,
  getUserOffersReady,
  getUserBenefit,
  itsSubscriber,
  getFilterDistribution,
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
  helpKeyboard,
} from './telegram.command';
import { BotStatus } from 'src/airtable/types/IBot.interface';
import { NotificationStatisticStatuses } from 'src/airtable/types/INotificationStatistic.interface';
import {
  FORMAT_DATE,
  dateFormat,
  getDateWithTz,
  getTimeWithTz,
  getTimesFromTimesTable,
} from 'src/common/date/date.methods';
//import { parseTextFromPhoto } from 'src/common/parsing/image.parser';
import { ChatMember, User } from '@grammyjs/types';
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

      await this.saveToAirtable(ctx.session);
      await ctx.reply('⤵️', {
        reply_markup: helpKeyboard,
      });
      await ctx.api.sendMessage(id, FOOTER);

      await ctx.reply(sayHi(first_name, userValue.userName), {
        reply_markup: userHistory.orderButtons,
      });

      if (ctx.match) {
        const sessionData: ITelegramWebApp = await this.getOfferFromWeb(
          ctx.match,
          id.toString(),
        );

        ctx.session.step = STEPS['Выбор раздачи'].step;
        ctx.session.status = 'Выбор раздачи';
        ctx.session = updateSessionByField(ctx.session, 'data', sessionData);
        ctx.session = updateSessionByField(
          ctx.session,
          'offerId',
          sessionData.offerId,
        );
        await this.bot.api.sendMediaGroup(
          ctx.session.chat_id,
          getTextForFirstStep(sessionData) as any[],
        );
        ctx.session = nextStep(ctx.session);
        await this.updateToAirtable(ctx.session);
        await this.sendMediaByStep(ctx.session.step, ctx);
        ctx.session.lastCommand = null;
      }

      await this.bot.api.sendMessage(
        id,
        `${userHistory.benefit}\n${userHistory.subscribe}`,
        {
          parse_mode: 'HTML',
        },
      );
    });

    this.bot.command(COMMAND_NAMES.help, async (ctx) => {
      ctx.session.lastCommand = COMMAND_NAMES.help;
      await this.getInstruction(ctx);

      const response = await this.sendMessageWithKeyboardHistory(ctx.from.id);
      ctx.session.lastMessage = response.message_id;
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
        const userInfo = await this.getUserHistory(ctx.from, false, true);

        await ctx.api.sendMessage(
          id,
          `Ваш номер 👉${id}\n\n${userInfo.benefit}\n${userInfo.offersReady}\n` +
            userInfo.subscribe,
          {
            parse_mode: 'HTML',
          },
        );

        return await ctx.reply(
          userInfo.orderButtons
            ? 'Продолжите ⤵️'
            : !userInfo || userInfo.sum === 0
              ? 'Вы пока ничего не купили 😢'
              : 'Все раздачи завершены ✌️',
          {
            reply_markup: userInfo.orderButtons,
          },
        );
      } catch (e) {
        console.log('history=', e);
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
      const path = await ctx.getFile();
      const url = `${FILE_FROM_BOT_URL}${this.options.token}/${path.file_path}`;
      if (
        ctx.session.lastCommand === COMMAND_NAMES.call ||
        ctx.session.errorStatus ||
        ctx.session.lastCommand === COMMAND_NAMES.saveMessage
      ) {
        const firebaseUrl = await this.firebaseService.uploadImageAsync(url);
        if (ctx.session.lastCommand === COMMAND_NAMES.saveMessage) {
          await ctx.api.sendMessage(ctx.session.comment, firebaseUrl);
          await this.airtableService.updateCommentInBotTableAirtable(
            ctx.from,
            createCommentForDb(firebaseUrl, true),
            true,
          );
        } else {
          const msgToSecretChat = await this.saveComment(
            ctx.from,
            firebaseUrl,
            ctx.session?.data?.articul || '',
            ctx.session?.data?.title || '',
            ctx.session.status,
          );
          await ctx.api.sendMessage(getSecretChatId(), msgToSecretChat);
        }
        return await ctx.reply(
          'Ваше сообщение отправлено! Мы уже готовим вам ответ 🧑‍💻',
        );
      }

      if (ctx.session.lastCommand === COMMAND_NAMES.messageSend) {
        return ctx.reply('📵');
      }

      const { data } = ctx.session;
      if (ctx.session.step < 0 || !ctx.session.step)
        return ctx.reply(STOP_TEXT);

      if (!data) {
        const dataBuyer = await this.airtableService.getBotByFilter(
          ctx.from.id.toString(),
          'chat_id',
        );

        const lastSession = getLastSession(dataBuyer);
        if (!lastSession)
          return await this.sendMessageWithKeyboardHistory(ctx.from.id);

        ctx.session = await this.restoreSession(ctx, lastSession);
      }

      if (!STEPS_TYPES.image.includes(ctx.session.step)) {
        await ctx.api.sendMessage(
          ctx.from.id,
          getErrorTextByStep(ctx.session.step)?.error || '⤵️',
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
    });

    /*======== CANCEL =======*/
    this.bot.callbackQuery('cancel', async (ctx) => {
      this.bot.api
        .editMessageReplyMarkup(ctx.session.chat_id, ctx.session.lastMessage)
        .catch(() => {});
    });

    /*======== OPERATOR =======*/
    this.bot.callbackQuery('operator', async (ctx) => {
      if (ctx.session.step === STEPS.Финиш.step) {
        return ctx.reply('Напишите сообщение оператору и ожидайте ответа🧑‍💻');
      }
      //ctx.session = updateSessionByField(ctx.session, 'status', 'Вызов');
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
      ctx.session.step = STEPS.Получен.step;
      await ctx.callbackQuery.message.editText(
        getTextByNextStep(
          ctx.session.step,
          ctx.session.startTime,
          ctx.session.data.title,
        ),
      );
      return await this.sendMediaByStep(STEPS.Получен.step, ctx);
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
      const response = await this.sendMessageWithKeyboardHistory(ctx.from.id);
      ctx.session.lastMessage = response.message_id;
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

        // const parseResult = await parseTextFromPhoto(
        //   ctx.session.lastLoadImage,
        //   ctx.session.status,
        //   ctx.session.data.articul,
        //   ctx.session.data.title,
        // );

        await statusMessage.editText('Фото загружено! ');
        setTimeout(() => statusMessage.delete().catch(() => {}), 500);

        ctx.session = updateSessionByStep(ctx.session, firebaseUrl, true);
      } else {
        //TEXT MESSAGE
        ctx.session = nextStep(ctx.session);
      }

      await this.updateToAirtable(ctx.session);

      if (ctx.session.step === STEPS['Дата доставки'].step) {
        ctx.session.lastMessage = ctx.callbackQuery.message.message_id;
      }

      await ctx.callbackQuery.message.editText(
        getTextByNextStep(
          ctx.session.step,
          ctx.session.startTime,
          ctx.session.data.title,
        ),
        ctx.session.step === STEPS['Дата доставки'].step
          ? { reply_markup: deliveryDateKeyboard }
          : null,
      );

      await this.sendMediaByStep(ctx.session.step, ctx);

      ctx.session.lastMessage = ctx.callbackQuery.message.message_id;
      if (ctx.session.step === STEPS.Финиш.step) {
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

      const sessionId = ctx.callbackQuery.data.replace('sessionId_', '').trim();
      ctx.session = await this.restoreSession(ctx, sessionId);
      let response = null;

      if (ctx.session.status === 'Выбор раздачи') {
        response = await this.bot.api.sendMediaGroup(
          ctx.session.chat_id,
          getTextForFirstStep(ctx.session.data) as any[],
        );
        await this.sendMediaByStep(ctx.session.step, ctx);
      } else {
        if (ctx.session.status === 'Проблема с артикулом') {
          ctx.session.step = STEPS['Артикул правильный'].step;

          ctx.session.errorStatus = 'check_articul';
          response = await ctx.api.sendMessage(
            ctx.session.chat_id,
            getTextByNextStep(
              ctx.session.step,
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
              ctx.session.step,
              ctx.session.startTime,
              ctx.session.data.title,
            ),
          );
        }
        await this.sendMediaByStep(ctx.session.step, ctx);
      }

      ctx.session.lastMessage = response.message_id;
      await ctx.answerCallbackQuery();
    });

    /*======== MESSAGE =======*/
    this.bot.on('message', async (ctx) => {
      try {
        if (ctx.session.errorStatus === 'locationError')
          return ctx.reply(STOP_TEXT);

        const { text } = ctx.update.message;
        switch (ctx.session.lastCommand) {
          case COMMAND_NAMES.messageSend:
            const isDigitsOnly = /^\d+$/.test(text);
            if (!isDigitsOnly)
              return await ctx.reply('В номере должны быть только цифры');

            ctx.session.comment = text;
            ctx.session.lastCommand = COMMAND_NAMES.saveMessage;
            return await ctx.reply('Введите текст для [' + text + ']');
          case COMMAND_NAMES.saveMessage:
            ctx.session.lastCommand = null;
            await ctx.api.sendMessage(
              ctx.session.comment,
              'Ответ оператора🧑‍💻 \n→ ' + text,
            );
            await this.airtableService.updateCommentInBotTableAirtable(
              {
                id: ctx.session.comment as any as number,
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
          ctx.session.step === STEPS.Финиш.step
        ) {
          const msgToSecretChat = await this.saveComment(
            ctx.from,
            text,
            ctx.session?.data?.articul || '',
            ctx.session?.data?.title || '',
            ctx.session.status,
          );

          await ctx.api.sendMessage(getSecretChatId(), msgToSecretChat);

          return await ctx.reply(
            'Ваше сообщение отправлено! Мы уже готовим вам ответ 🧑‍💻',
          );
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
          const dataBuyer = await this.airtableService.getBotByFilter(
            id.toString(),
            'chat_id',
          );
          const lastSession = getLastSession(dataBuyer);
          if (!lastSession)
            return await this.sendMessageWithKeyboardHistory(ctx.from.id);
          //
          ctx.session = await this.restoreSession(ctx, lastSession);
          if (!ctx.session.isRestore) {
            const historyButtons = createHistoryKeyboard(dataBuyer, true);
            await ctx.reply(sayHi(first_name, userValue.userName), {
              reply_markup: historyButtons,
            });
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

          let member;
          try {
            member = await this.bot.api.getChatMember(
              TELEGRAM_CHAT_ID_OFFERS,
              id,
            );
          } catch (e) {
            console.log(e);
          }

          ctx.session.itsSubscriber = itsSubscriber(member);

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

          ctx.session = updateSessionByField(ctx.session, 'data', data);
          ctx.session = updateSessionByField(
            ctx.session,
            'offerId',
            data.offerId,
          );
          ctx.session = updateSessionByField(
            ctx.session,
            'status',
            'Выбор раздачи',
          );
          ctx.session = updateSessionByStep(ctx.session);
        } else {
          const { step } = ctx.session;
          if (!STEPS_TYPES.text.find((x) => x === step)) {
            await ctx.api.sendMessage(
              ctx.from.id,
              getErrorTextByStep(step).error || '⤵️',
              {
                link_preview_options: {
                  is_disabled: true,
                },
              },
            );
            await this.sendMediaByStep(step, ctx);
          }
        }

        const { step } = ctx.session;

        //первый шаг
        if (STEPS['Выбор раздачи'].step === step && data) {
          ctx.session = nextStep(ctx.session);
          const loader = await ctx.reply('⏳');

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

          //return await ctx.replyWithPhoto(`${WEB_APP}/images/wb-search.jpg`);
        }
        //проверка артикула
        if (
          STEPS['Артикул правильный'].step === step ||
          STEPS['Проблема с артикулом'].step === step
        ) {
          if (STEPS['Проблема с артикулом'].step === step) {
            ctx.session.step = STEPS['Артикул правильный'].step;
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

              const msgToSecretChat = await this.saveComment(
                ctx.from,
                text,
                ctx.session?.data?.articul || '',
                ctx.session?.data?.title || '',
                ctx.session.status,
              );

              await ctx.api.sendMessage(getSecretChatId(), msgToSecretChat);
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
            ctx.session = updateSessionByField(
              ctx.session,
              'status',
              'Артикул правильный',
            );

            ctx.session = nextStep(ctx.session);
            await this.updateToAirtable(ctx.session);
            await ctx.reply(
              getTextByNextStep(
                ctx.session.step,
                ctx.session.startTime,
                ctx.session.data.title,
              ),
            );

            await this.sendMediaByStep(STEPS.Поиск.step, ctx);
            return;
          }
        } //конец проверки артикула

        //дата доставки
        if (step === STEPS['Дата доставки'].step) {
          ctx.session.deliveryDate = dateFormat(text);
          ctx.session = nextStep(ctx.session);
          await this.updateToAirtable(ctx.session);
          this.bot.api
            .deleteMessage(ctx.session.chat_id, ctx.session.lastMessage)
            .catch(() => {});
          return await ctx.reply(
            getTextByNextStep(
              ctx.session.step,
              ctx.session.startTime,
              ctx.session.data.title,
            ),
          );
        }

        //отзыв пользователя
        if (step === STEPS['Отзыв на проверке'].step) {
          ctx.session = updateSessionByField(
            ctx.session,
            'comment',
            ctx.message.text,
          );
          ctx.session = updateSessionByField(
            ctx.session,
            'status',
            'Отзыв на проверке',
          );

          await this.updateToAirtable(ctx.session);
          const msgToSecretChat = await this.saveComment(
            ctx.from,
            ctx.message.text,
            ctx.session.data.articul,
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
    //console.log('update airtable=', session);
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

  /*публикация заявки с сайта*/
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
  /*work chat close*/
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
    outFromOffer: boolean,
  ): Promise<void> {
    try {
      console.log(
        'sendNotificationToUser=',
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
        await this.sendMessageWithKeyboardHistory(chat_id);
        return;
      }
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

      await this.bot.api.sendMessage(
        chat_id,
        value.notification.fields.Сообщение + `\n➡️Раздача: ${offerName}`,
      );
      await this.sendMessageWithKeyboardHistory(chat_id);
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
    const dataBuyer = await this.airtableService.getBotByFilter(
      chatId.toString(),
      'chat_id',
    );
    const historyButtons = createHistoryKeyboard(dataBuyer, true);
    const countWorkLabels = createLabelHistory(dataBuyer).length;

    return await this.bot.api.sendMessage(
      chatId.toString(),
      `${countWorkLabels > 0 ? 'Выберите новую раздачу или продолжите ⤵️' : '⤵️'}`,
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
    const msgToChat = sendToSecretChat(
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

  async sendMediaByStep(step: number, ctx: MyContext, caption?: 'up' | 'down') {
    try {
      if (getErrorTextByStep(step)?.url) {
        return await this.bot.api.sendMediaGroup(ctx.from.id, [
          {
            type: 'photo',
            media: getErrorTextByStep(step)?.url,
            caption:
              caption && caption === 'down'
                ? STEP_EXAMPLE_TEXT_DOWN
                : STEP_EXAMPLE_TEXT_UP,
          },
        ]);
      }
    } catch (e) {
      console.log('sendMediaByStep=', e);
    }
  }

  async restoreSession(ctx: MyContext, sessionId: string) {
    /*продолжение раздачи*/
    const { id } = ctx.from;

    //sort by StopTime - this will be last session
    const data = await this.airtableService.getBotByFilter(
      sessionId,
      'SessionId',
    );

    if (!data || data.length === 0) {
      await this.sendMessageWithKeyboardHistory(id);
      return;
    }
    const { Images, StopTime, StartTime, Статус, OfferId, Артикул, Раздача } =
      data[0].fields;
    if (STEPS[Статус].step > 3 && (!Images || Images.length === 0)) {
      await this.sendMessageWithKeyboardHistory(id);
      return;
    }

    const userValue = getUserName(ctx.from);

    const value: ISessionData = {
      sessionId: sessionId,
      user: userValue.userName || userValue.fio,
      chat_id: id.toString(),
      startTime: dateFormat(StartTime, FORMAT_DATE),
      stopBuyTime: dateFormat(data[0].fields['Время выкупа'], FORMAT_DATE),
      stopTime: dateFormat(StopTime, FORMAT_DATE),
      step: STEPS[Статус].step as number,
      images: Images?.map((x) => x.url),
      offerId: OfferId[0],
      status: Статус,
      deliveryDate: dateFormat(data[0]?.fields['Дата получения']),
      isRestore: true,
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
      if (Статус === 'Заказ') {
        session = nextStep(session); //пропускаем дату доставки
      }
      session = nextStep(session);
    }

    return session;
  }

  async getInstruction(ctx: MyContext) {
    for (const value of createHelpText()) {
      await this.bot.api.sendMediaGroup(ctx.from.id, [value]);
    }
  }
  //full - берем данные из таблицы Раздачи и Бот
  async getUserHistory(from: User, web?: boolean, full?: boolean) {
    const { id } = from;
    const dataBuyer = await this.airtableService.getBotByFilter(
      id.toString(),
      'chat_id',
    );
    const name = getUserName(from);
    let sum = 0;
    let offersFromDistributions = '';
    if (full && (name.fio || name.userName)) {
      //if (name.userName === 'val_tom') name.userName = 'OxanaWeber';
      const dataDistributions =
        await this.airtableService.getDistributionTableByNick(
          name.userName || name.fio,
        );
      const filterDistributions = getFilterDistribution(
        dataDistributions,
        dataBuyer,
      );
      sum = filterDistributions?.sum;
      offersFromDistributions = filterDistributions.offers;
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
      };
    }

    const offerIdsStatusCheck = getUserOfferIdsByStatus(dataBuyer);
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
    };
  }
}
