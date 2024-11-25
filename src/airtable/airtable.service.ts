import { Injectable } from '@nestjs/common';

import { AirtableHttpService } from './airtable.http.service';
import { ConfigService } from '@nestjs/config';
import { FILTER_BY_FORMULA, TablesName } from './airtable.constants';

import { IOffer, IOffers, OfferStatus } from './types/IOffer.interface';
import { INotification, INotifications } from './types/INotification.interface';
import { INotificationStatistics } from './types/INotificationStatistic.interface';
import { BotStatus, IBot, IBots } from './types/IBot.interface';
import {
  getTimeWithTz,
  getLastIntervalData,
  convertDateFromString,
} from 'src/common/date/date.methods';
import { ISessionData } from 'src/telegram/telegram.interface';
import { IBotComments } from './types/IBotComment';
import { User } from '@grammyjs/types';
import {
  convertToKeyObjects,
  findFreeKeywords,
  formatOfferDetails,
  getNumberStepByStatus,
  getUserName,
} from 'src/telegram/telegram.custom.functions';
import { IKeyWords } from './types/IKeyWords.interface';
import { IFilters } from './types/IFilters.interface';
import { getFilterById } from './airtable.custom';
import { ITime, ITimes } from './types/ITimes.interface';
import { IBuyer } from 'src/airtable/types/IBuyer.interface';
import {
  IDistribution,
  IDistributions,
} from '../airtable/types/IDisturbation.interface';
import { IHelpers } from 'src/airtable/types/IHelper.interface';
import { IArticle } from 'src/airtable/types/IArticle.interface';
import { IGNORED_STATUSES, STEPS } from 'src/telegram/telegram.constants';
import { IBan } from './types/IBan.interfaces';

@Injectable()
export class AirtableService {
  constructor(
    private readonly airtableHttpService: AirtableHttpService,
    private readonly configService: ConfigService,
  ) {}

  async saveToAirtable(session: ISessionData): Promise<any> {
    let data = null;
    if (!session.offerId) {
      data = {
        SessionId: session.sessionId,
        User: session.user,
        chat_id: session.chat_id,
        Статус: session.status,
        StopTime: getTimeWithTz(),
        MessageId: session?.messageId || '',
      };
    } else {
      data = {
        SessionId: session.sessionId,
        User: session.user,
        chat_id: session.chat_id,
        Статус: session.status,
        'Время входа': session?.timeOfEntry || '',
        Артикул: session?.data?.articul || '',
        StartTime: session.status === 'В боте' ? '' : session.startTime,
        OfferId: session.offerId ? [session.offerId] : null,
        Location: session?.location || '',
        Раздача: session.data?.title || '',
        StopTime: getTimeWithTz(),
        'Ключевое слово': session?.data?.keys || '',
        MessageId: session?.messageId || '',
        'Детали раздачи': formatOfferDetails(session.detailsOffer),
      };
    }

    try {
      const response = await this.airtableHttpService.post(
        TablesName.Bot,
        data,
      );
      return response;
    } catch (error) {
      console.log(`saveToAirtable error= ${data.SessionId}`, error);
    }
  }
  async updateToAirtable(session: ISessionData): Promise<any> {
    try {
      if (!session.sessionId) {
        console.log('empty session= ', session);
        return null;
      }
      //const correctTime = getOfferTime(session);
      const data = {
        //SessionId: session.sessionId,
        'Время входа': session?.timeOfEntry || getTimeWithTz(),
        Артикул: session?.data?.articul,
        StartTime: session.startTime,
        'Время выкупа': session.stopBuyTime,
        OfferId: [session.offerId],
        Статус: session.status,
        Location: session?.location || '',
        Раздача: session.data?.title,
        Images: session.images?.map((url) => ({ url: url })),
        StopTime: getTimeWithTz(),
        'Дата получения': convertDateFromString(session.deliveryDate),
        Финиш: session.isFinish,
        'Ключевое слово': session?.data?.keys,
        Фильтр: session?.data?.filter || '',
        'Факт дата получения': convertDateFromString(session.recivingDate),
        'Данные для кешбека': session.dataForCash || '',
        Цена: session.price ? session.price.replace(/\D/g, '') : '',
        'Чек WB': session.checkWb || '',
        'Поиск скрин': session?.imgSearch || '',
        'Корзина скрин': session?.imgCart || '',
        'Заказ скрин': session?.imgOrder || '',
        'Получен скрин': session?.imgRecieved || '',
        'Штрих-код скрин': session?.imgShtrihCode || '',
        'Товар скрин': session?.imgGood || '',
        'Фото проверка': session?.checkParseImages,
        MessageId: session?.messageId,
      };

      // const tableUrl = this.configService.get(
      //   'AIRTABLE_WEBHOOK_URL_FOR_TABlE_BOT_UPDATE',
      // );
      const result = await this.getBotBySession(session.sessionId);

      const response = await this.airtableHttpService.update(
        TablesName.Bot,
        result.id,
        data,
      );
      return response;
    } catch (e) {
      console.log('error updateToAirtable=', session, e);
      return null;
    }
  }
  async updateStatusInBot(sessionId: string, status: BotStatus): Promise<any> {
    if (!sessionId) {
      console.log('empty session=', status);
      return null;
    }
    const result = await this.getBotBySession(sessionId);
    if (!result || !result.id) {
      console.log('updateStatusInBot error id', sessionId);
    }
    const response = await this.airtableHttpService.update(
      TablesName.Bot,
      result.id,
      {
        Статус: status,
        StopTime: getTimeWithTz(),
      },
    );
    console.log('updateStatusInBot', sessionId);
    return response;
  }
  /**
   * обновляем ключевое слово и и интервал у пользователя который был без ключа
   */
  async updateUserWithEmptyKeyInBotTableAirtable(
    sessionId: string,
    key: string,
    newStartTime: string,
  ): Promise<any> {
    // const tableUrl = this.configService.get(
    //   'AIRTABLE_WEBHOOK_FOR_UPDATE_FOR_USER_WITH_EMPTY_KEY',
    // );
    if (!sessionId) {
      console.log('empty session=', sessionId);
      return null;
    }

    const result = await this.getBotBySession(sessionId);
    const response = await this.airtableHttpService.update(
      TablesName.Bot,
      result.id,
      {
        'Ключевое слово': key,
        StartTime: newStartTime,
      },
    );
    console.log(
      'updateUserWithEmptyKeyInBotTableAirtable',
      response,
      sessionId,
    );
    return response;
  }
  /**
   * Пользовательские сообщения
   */
  async updateCommentInBotTableAirtable(
    from: User,
    comment: string,
    isAnswer?: boolean,
  ): Promise<any> {
    //let tableUrl = '';
    const comments = await this.getCommetByChatId(from.id);
    const userValue = getUserName(from);
    let data = null;
    if (comments && comments.records && comments.records.length > 0) {
      // tableUrl = this.configService.get(
      //   'AIRTABLE_WEBHOOK_URL_FOR_TABlE_BOT_UPDATE_COMMENTS',
      // );
      comment = '\n' + comment + '\n' + comments.records[0].fields.Комментарии;
      data = {
        //id: comments.records[0].id,
        Комментарии: comment.trim(),
        Status: isAnswer ? 'Ответ' : 'Вопрос',
      };
      await this.airtableHttpService.update(
        TablesName.UserComments,
        comments.records[0].id,
        data,
      );
      console.log('updateCommentInBotTableAirtable');
    } else {
      // tableUrl = this.configService.get(
      //   'AIRTABLE_WEBHOOK_URL_FOR_TABlE_BOT_ADD_COMMENTS',
      // );
      data = {
        chat_id: from.id,
        Комментарии: comment.trim(),
        Name: userValue.fio + ' ' + userValue.userName,
      };
      await this.airtableHttpService.post(TablesName.UserComments, data);
      console.log('addCommentInBotTableAirtable');
    }
  }

  async addToAirtableNotificationStatistic(data: any): Promise<any> {
    // const tableUrl = this.configService.get(
    //   'AIRTABLE_WEBHOOK_URL_FOR_TABlE_NOTIFICATION_STATISTIC_ADD',
    // );
    const response = await this.airtableHttpService.post(
      TablesName.NotificationStatistics,
      data,
    );
    console.log('addToAirtableNotificationStatistic');
    return response;
  }
  async updateToAirtableNotificationStatistic(
    data: any,
    sessionId,
  ): Promise<any> {
    // const tableUrl = this.configService.get(
    //   'AIRTABLE_WEBHOOK_URL_FOR_TABlE_NOTIFICATION_STATISTIC_UPDATE',
    // );
    const result = await this.getBotBySession(sessionId);
    const response = await this.airtableHttpService.update(
      TablesName.NotificationStatistics,
      result.id,
      data,
    );
    console.log('updateToAirtableNotificationStatistic');
    return response;
  }
  async updateDistribution(data: any): Promise<any> {
    const tableUrl = this.configService.get(
      'AIRTABLE_WEBHOOK_FOR_TRANSFER_DATA_FROM_BOT_TO_DISTRIBUTION',
    );
    const response = await this.airtableHttpService.postWebhook(tableUrl, data);
    console.log('postWebhook ===>', response);
    return response;
  }
  async updateStatusTransferInBot(
    status:
      | 'Ошибка переноса'
      | 'Успешно перенесены'
      | 'Chat_id не найден'
      | 'Артикул в раздаче не найден',
    sessionId: string,
  ): Promise<any> {
    // const tableUrl = this.configService.get(
    //   'AIRTABLE_WEBHOOK_FOR_TRANSFER_DATA_FROM_BOT_TO_DISTRIBUTION_STATUS_UPDATE',
    // );
    const result = await this.getBotBySession(sessionId);
    const response = await this.airtableHttpService.update(
      TablesName.Bot,
      result.id,
      {
        'Перенести в Раздачу': status,
      },
    );
    console.log('updateStatusTransferInBot', response);
    return response;
  }
  async updateStatusCacheInBot(sessionId: string): Promise<any> {
    // const tableUrl = this.configService.get(
    //   'AIRTABLE_WEBHOOK_FOR_UPDATE_STATUS_CASHE',
    // );
    const result = await this.getBotBySession(sessionId);
    const response = await this.airtableHttpService.update(
      TablesName.Bot,
      result.id,
      {
        'Статус кеша': 'Выплачен',
      },
    );
    console.log('updateStatusCacheInBot');
    return response;
  }
  /**
   * Причина возврата
   */
  async updateReasonReturnBot(chatId: number, reason: string): Promise<any> {
    const result = await this.getBotByReturn(chatId);
    const response = await this.airtableHttpService.update(
      TablesName.Bot,
      result.id,
      {
        'Причина отказа': reason,
        'Отказ на ПВЗ': true,
      },
    );
    console.log('updateStatusCacheInBot');
    return response;
  }
  async updateNotification(
    name: string,
    time: string,
    status: string,
  ): Promise<any> {
    const tableUrl = this.configService.get(
      'AIRTABLE_WEBHOOK_FOR_UPDATE_NOTIFICATION_TABLE',
    );
    const response = await this.airtableHttpService.postWebhook(tableUrl, {
      name,
      time,
      status,
    });
    console.log('postWebhook ===>', response);
    return response;
  }

  async getBotStatusByUser(sessionId: string): Promise<BotStatus | null> {
    const filter = `&${FILTER_BY_FORMULA}=FIND("${sessionId}",{SessionId})`;
    const data = await this.airtableHttpService.get(TablesName.Bot, filter);
    if (!data || (data.records && data.records.length === 0)) return null;
    return (data.records[0] as IBot).fields['Статус'];
  }
  async getBotBySession(sessionId: string): Promise<IBot | null> {
    const filter = `&${FILTER_BY_FORMULA}=FIND("${sessionId}",{SessionId})`;
    const data = await this.airtableHttpService.get(TablesName.Bot, filter);
    if (!data || (data.records && data.records.length === 0)) return null;
    return data.records[0] as IBot;
  }
  async getBotByReturn(chat_id: number): Promise<IBot | null> {
    const filter = `&${FILTER_BY_FORMULA}=AND({chat_id}="${chat_id}" , {Причина отказа} = "")`;
    const data = await this.airtableHttpService.get(TablesName.Bot, filter);
    if (!data || (data.records && data.records.length === 0)) return null;
    return data.records[0] as IBot;
  }
  async getCommetByChatId(chat_id: string | number): Promise<IBotComments> {
    const filter = `&${FILTER_BY_FORMULA}=FIND("${chat_id}",{chat_id})`;
    return await this.airtableHttpService.get(TablesName.UserComments, filter);
  }

  /**
   * получаем список ключевых слов конкретной раздачи
   */
  async getOfferKeys(id: string) {
    const offer = (await this.airtableHttpService.getById(
      TablesName.Offers,
      id,
    )) as IOffer;
    if (!offer) return null;

    const query = offer.fields.Ключи.map((id) => `{Id}="${id}"`).join(',');

    const keysData = await this.airtableHttpService.get(
      TablesName.KeyWords,
      `&${FILTER_BY_FORMULA}=OR(${query})`,
    );

    if (!keysData || !keysData.records || keysData.records.length === 0)
      return null;

    return (keysData as IKeyWords).records.map((x) => ({
      name: x.fields.Название,
      count: x.fields.Количество,
    }));
  }
  /**
   * список раздач
   */
  async getOffers(type?: 'stop' | 'schedule'): Promise<IOffers> {
    let filter;
    if (process.env.NODE_ENV === 'development' && !type) {
      filter = `&${FILTER_BY_FORMULA}=AND({Артикул} !='' , OR({Status}="In progress", {Status}="Test"), {Тип} = "Открытая")`;
    } else if (process.env.NODE_ENV !== 'development' && !type) {
      filter = `&${FILTER_BY_FORMULA}=AND({Артикул} !='' , OR({Status}="In progress", {Status}="Scheduled"), {Тип} = "Открытая")`;
    } else {
      filter =
        type === 'schedule'
          ? `&${FILTER_BY_FORMULA}=AND({Артикул} !='' , {Status} = "Scheduled")`
          : `&${FILTER_BY_FORMULA}=AND({Артикул} != '', OR({Status} = "Архив", {Status} = "Stop"))`;
    }
    const response = await this.airtableHttpService.get(
      TablesName.Offers,
      filter,
    );
    if (type === 'stop') {
      const offersUniq = (response as IOffers).records?.reduce((acc, offer) => {
        if (!acc.find((x) => x.fields.Артикул === offer.fields.Артикул)) {
          acc.push(offer);
        }
        return acc;
      }, []);
      return { records: offersUniq };
    }
    return response;
  }
  /**
   * Получаем всю информацию о раздаче с ключевым словом, количеством заказов, временем и фильтрами
   */
  async getOffer(
    id: string,
    needKeys?: boolean,
    needTimes?: boolean,
  ): Promise<IOffer> {
    const offer = (await this.airtableHttpService.getById(
      TablesName.Offers,
      id,
    )) as IOffer;
    try {
      const count = offer.fields.Количество;
      const countOrder = offer.fields['Количество заказов сегодня'];
      const countWaiting = offer.fields['Длина очереди'];

      offer.fields['Время бронь'] = null;

      if (needKeys) {
        const keyIds = offer.fields.Ключи;

        if (keyIds && keyIds.length > 0) {
          const keys = (await this.airtableHttpService.get(
            TablesName.KeyWords,
            getFilterById(keyIds),
          )) as IKeyWords;

          offer.fields['Ключевое слово'] = '';

          if (keyIds.length === 1) {
            offer.fields['Ключевое слово'] = keys.records[0].fields.Название;
          } else {
            const typeKey = needKeys && offer.fields['Тип ключей'];

            if (!typeKey || typeKey === 'Ограниченный ключ') {
              const totalKeysOffers = keys.records.reduce(
                (sum, kw) => sum + kw.fields.Количество,
                0,
              );
              // console.log(
              //   'totalKeysOffers=',
              //   totalKeysOffers,
              //   countOrder + countWaiting,
              // );

              if (totalKeysOffers < countOrder + countWaiting) {
                console.log('Не хватает предложений для заказа');
                offer.fields['Ключевое слово'] = '';
              } else {
                const usesKeys = await this.getUsesKeys(id); //список занятых слов
                const allOfferKeys = (keys as IKeyWords).records.map((x) => ({
                  name: x.fields.Название,
                  count: x.fields.Количество,
                }));
                const freeKeys = findFreeKeywords(allOfferKeys, usesKeys);
                if (freeKeys || freeKeys.length > 0) {
                  offer.fields['Ключевое слово'] = freeKeys[0];
                }
              }
            } else {
              const nextKeyIndex =
                (countOrder + countWaiting + 1) % keys.records.length;
              offer.fields['Ключевое слово'] =
                keys.records[nextKeyIndex].fields.Название;
            }
          }
        }
      }

      if (needTimes) {
        if (offer.fields.Время) {
          const keyIds = offer.fields.Время;
          if (keyIds && keyIds.length > 0) {
            const times = (await this.airtableHttpService.get(
              TablesName.TimeOffer,
              getFilterById(keyIds),
            )) as ITimes;

            if (count >= countOrder && times.records.length > 0) {
              let allCountTimes = 0;
              for (let i = 0; i < times.records.length; i++) {
                const countTime =
                  times.records[i].fields['Количество предложений'];
                allCountTimes = allCountTimes + countTime;
                const keyValue = (times.records[i] as ITime).fields;
                if (allCountTimes > countOrder) {
                  offer.fields['Время бронь'] = {
                    startTime: keyValue.Start,
                    onlyTime: times.records[i].fields['Только время'],
                  };
                  break;
                }
              }
            }
          }
        }
      }

      const needFilters = needKeys && offer.fields['Включить фильтры'];
      if (needFilters) {
        const filterIds = offer.fields.Фильтры;
        if (filterIds && filterIds.length > 0) {
          const filters = (await this.airtableHttpService.get(
            TablesName.Filters,
            getFilterById(filterIds),
          )) as IFilters;

          if (filters?.records?.length > 0) {
            // const minUseFilter: IFilter = filters.records.reduce(
            //   (minObj, currentObj) => {
            //     return currentObj.fields.Использовано < minObj.fields.Использовано
            //       ? currentObj
            //       : minObj;
            //   },
            // );
            const nextIndex = (countOrder + 1) % filters.records.length;
            offer.fields.Фильтр = filters.records[nextIndex].fields.Название;
            //offer.fields.Фильтр = filters.records.map((x) => x.fields.Название);
          }
        }
      }
      return offer as IOffer;
    } catch (error) {
      console.log('getOffer', error);
      return offer as IOffer;
    }
  }

  /**
   *данные из таблицы Оповещения
   */
  async getNotifications(): Promise<INotifications> {
    return await this.airtableHttpService.get(TablesName.Notifications);
  }
  async getNotificationStatistics(
    sessionId: string,
  ): Promise<INotificationStatistics> {
    const filter = `&${FILTER_BY_FORMULA}=SEARCH('${sessionId}',{SessionId})`;
    return await this.airtableHttpService.get(
      TablesName.NotificationStatistics,
      filter,
    );
  }
  async getUserOffers(ids: string[]): Promise<IOffers | null> {
    if (!ids || !Array.isArray(ids)) return null;

    const query = ids.map((id) => `{Id}="${id}"`);
    const filter = `&${FILTER_BY_FORMULA}=OR(${query})`;
    return await this.airtableHttpService.get(TablesName.Offers, filter);
  }
  async getBotByFilter(
    value: string | number,
    field: string,
  ): Promise<IBot[] | null> {
    const filter = `&${FILTER_BY_FORMULA}=SEARCH("${value}",{${field}})`;
    const data = await this.airtableHttpService.get(TablesName.Bot, filter);
    if (!data || (data.records && data.records.length === 0)) return null;
    return data.records;
  }
  async getBotForContinue(chat_id: string): Promise<IBot[] | null> {
    const filter = `&${FILTER_BY_FORMULA}=AND(NOT({Статус}="В боте"), {chat_id}="${chat_id}")`;
    const data = await this.airtableHttpService.get(TablesName.Bot, filter);
    if (!data || (data.records && data.records.length === 0)) return null;
    return data.records;
  }

  async getArticlesInWork(): Promise<IArticle[] | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Articuls,
      `&${FILTER_BY_FORMULA}=NOT({Раздачи} ='')`,
    );
    if (!data || (data.records && data.records.length === 0)) return null;
    return data.records as IArticle[];
  }
  async getDistributionTableByNick(
    nick: string,
  ): Promise<IDistribution[] | null> {
    const filter = `&${FILTER_BY_FORMULA}=SEARCH("${nick}", ARRAYJOIN({Ник ТГ}, ","))`;
    const data = await this.airtableHttpService.get(
      TablesName.Distributions,
      filter,
    );
    if (!data || (data.records && data.records.length === 0)) return null;
    //console.log('data ===>>> ', data);
    return data.records;
  }

  async getDistributionByFilter(
    buyerId?: string,
  ): Promise<IDistributions | null> {
    const filter = `&${FILTER_BY_FORMULA}=SEARCH("${buyerId}", ARRAYJOIN({Покупатели}, ","))`;
    const data = await this.airtableHttpService.get(
      TablesName.Distributions,
      filter,
    );
    console.log('data=', data, buyerId);
    if (!data || !data.records || data?.records?.length === 0) return null;
    return data as IDistributions;
  }

  /**
   * не выплаченные кешбеки из таблицы Раздача
   */
  async getNoCachedDistributions(): Promise<number[] | null> {
    let allRecords: IDistribution[] = [];
    let offset = '';

    do {
      const nextPage = offset ? `&offset=${offset}` : '';
      const filter = `&${FILTER_BY_FORMULA}=AND({Дата выплаты} < TODAY(), {БОТ} = TRUE(), {Кэш выплачен}=FALSE(), {Деньги от клиента}=TRUE(), NOT({chat_id} = BLANK())
)${nextPage}`;
      const data = await this.airtableHttpService.get(
        TablesName.Distributions,
        filter,
      );
      if (!data || !data.records || data?.records?.length === 0) return null;

      offset = data.offset;
      allRecords = allRecords.concat(data.records);
    } while (offset);

    const uniqChatIds = allRecords.reduce((acc, order) => {
      if (!acc.find((x) => x === order.fields['chat_id'])) {
        acc.push(order.fields['chat_id']);
      }
      return acc;
    }, []);

    console.log('length=', uniqChatIds.length);

    return uniqChatIds;
  }

  async getBotByFilterArticulAndChatId(
    articul: string,
    chat_id: string,
  ): Promise<IBot | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Bot,
      `&${FILTER_BY_FORMULA}=AND(SUBSTITUTE({Артикул}, " ", "")="${articul}", {chat_id}="${chat_id}")`,
    );

    if (!data || !data.records) return null;
    return (data as IBots).records.filter(
      (x) => getNumberStepByStatus(x.fields['Статус']) > 4,
    )[0] as IBot;
  }
  async getBotFinish(articul: string, chat_id: string): Promise<IBot | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Bot,
      `&${FILTER_BY_FORMULA}=AND(SUBSTITUTE({Артикул}, " ", "")="${articul}", {chat_id}="${chat_id}", {Финиш}=TRUE())`,
    );

    if (!data || !data.records || data.records.length === 0) return null;
    return data.records[0] as IBot;
  }

  async getDistributionById(id: string): Promise<IDistribution | null> {
    const data = await this.airtableHttpService.getById(
      TablesName.Distributions,
      id,
    );
    if (!data) return null;
    return data as IDistribution;
  }
  async getDistributionByIds(
    values: string[],
  ): Promise<IDistribution[] | null> {
    const conditions = values.map((id) => `{id}="${id}"`).join(', ');
    const data = await this.airtableHttpService.get(
      TablesName.Distributions,
      `&${FILTER_BY_FORMULA}=OR(${conditions})`,
    );
    if (!data || data.records.length === 0) return null;
    return data.records as IDistribution[];
  }
  async getHelperTable(): Promise<IHelpers | null> {
    const data = await this.airtableHttpService.get(TablesName.Helpers);
    if (!data) return null;
    return data as IHelpers;
  }
  async findBuyer(nick: string): Promise<IBuyer[] | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Buyers,
      `&${FILTER_BY_FORMULA}=Find("${nick}",{Ник ТГ})`,
    );
    if (!data || data.records.length === 0) return null;
    return data.records as IBuyer[];
  }
  async findBuyersWithChatId(): Promise<IBuyer[] | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Buyers,
      `&${FILTER_BY_FORMULA}={chat_id} != ""`,
    );
    if (!data || data.records.length === 0) return null;
    return data.records as IBuyer[];
  }
  async findBuyerById(id: string): Promise<IBuyer> {
    const data = await this.airtableHttpService.getById(TablesName.Buyers, id);
    if (!data) return null;
    return data as IBuyer;
  }
  async findBuyerByChatId(chat_id: string): Promise<IBuyer | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Buyers,
      `&${FILTER_BY_FORMULA}=FIND(${chat_id}, {chat_id})`,
    );
    if (!data || data.records.length === 0) return null;
    return data.records[0] as IBuyer;
  }
  async checkPhone(phone: string): Promise<boolean> {
    const data = await this.airtableHttpService.get(
      TablesName.Buyers,
      `&${FILTER_BY_FORMULA}=Find("${phone}",{Телефон})`,
    );
    if (!data || data.records.length === 0) return false;
    return true;
  }

  async getUsersWithStatus(
    status: 'new' | 'regular' | 'all',
  ): Promise<number[] | null> {
    try {
      const filterByStatus = Object.values(STEPS)
        .filter(
          (x) =>
            IGNORED_STATUSES.includes(x.value) || (x.isActive && x.step === 0),
        )
        .map((x) => `FIND('${x.value}', ARRAYJOIN({Статус}, '|'))`)
        .join(', ');
      const filterQuery = `=AND(${filterByStatus})`;

      //console.log(filterByStatus);

      let allRecords: IBot[] = [];

      let offset = '';

      do {
        const nextPage = offset ? `&offset=${offset}` : '';
        const filter = `&${FILTER_BY_FORMULA} ${filterQuery}${nextPage}`;
        const data = await this.airtableHttpService.get(TablesName.Bot, filter);
        if (!data || !data.records || data?.records?.length === 0) return null;

        offset = data.offset;
        allRecords = allRecords.concat(data.records);
      } while (offset);

      const uniqChatIds = allRecords.reduce((acc, order) => {
        if (
          (status === 'new' &&
            (order.fields['Статус'] === 'В боте' ||
              order.fields['Статус'] === 'Время истекло') &&
            !acc.find((x) => x === order.fields['chat_id'])) ||
          (status === 'regular' &&
            order.fields['Статус'] !== 'В боте' &&
            !IGNORED_STATUSES.includes(order.fields['Статус']) &&
            !acc.find((x) => x === order.fields['chat_id']))
        ) {
          acc.push(order.fields['chat_id']);
        }

        if (
          status === 'all' &&
          !acc.find((x) => x === order.fields['chat_id'])
        ) {
          acc.push(order.fields['chat_id']);
        }
        return acc;
      }, []);

      console.log('notifications length=', uniqChatIds.length);

      return uniqChatIds;
    } catch (error) {
      console.log('getUsersWithStatus', error);
    }
  }

  async getNotificationByField(
    value: string,
    field: string,
  ): Promise<INotification | null> {
    const filter = `&${FILTER_BY_FORMULA}=SEARCH("${value}",{${field}})`;
    const data = await this.airtableHttpService.get(
      TablesName.Notifications,
      filter,
    );
    if (!data || !data.records?.length) return null;
    return data.records[0];
  }

  /**
   * метод выбирает последний по времени заказ (у кого есть ключевое слово)
   */
  async getLastIntervalTime(
    offerId: string,
    interval: string,
  ): Promise<string | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Bot,
      `&${FILTER_BY_FORMULA}=AND({Id (from OfferId)} = "${offerId}", NOT({Ключевое слово} = ""), OR({Статус} = "Выбор раздачи", {Статус} = "Корзина", {Статус} = "Поиск", 
      {Статус} = "Артикул правильный", {Статус} = "Проблема с артикулом", {Статус} = "Заказ", {Статус} = "Дата доставки"))`,
    );

    if (!data?.records?.length || data?.records?.length === 0)
      return getTimeWithTz();

    return getLastIntervalData((data as IBots).records, interval);
  }
  /**
   *  находим кто встал в ожидание на получение ключевого слова раздачи
   */
  async findUserWithEmptyKey(): Promise<IBot[] | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Bot,
      `&${FILTER_BY_FORMULA}=AND({Статус} = "Выбор раздачи", {Ключевое слово} = "")`,
    );

    if (!data?.records?.length || data?.records?.length === 0) return null;

    return (data as IBots).records;
    // const dataWaiting: IBot[] = (data as IBots).records;
    // let firstIntervalOrder: IBot[];

    // if (dataWaiting?.length === 1) {
    //   firstIntervalOrder = dataWaiting;
    // } else {
    //   const firstIntervalOrder =
    //     dataWaiting?.length === 1
    //       ? dataWaiting
    //       : dataWaiting
    //           .filter(
    //             (bot) => !isNaN(new Date(bot.fields['StartTime']).getTime()),
    //           )
    //           .sort(
    //             (a, b) =>
    //               new Date(a.fields['StartTime']).getTime() -
    //               new Date(b.fields['StartTime']).getTime(),
    //           );

    //   if (firstIntervalOrder.length === 0) {
    //     return null;
    //   }
    //   return firstIntervalOrder[0];
    // }
    // return firstIntervalOrder[0];
  }
  /**
   * все раздачи пользователей по артикулу для закрытия раздачи (но проверяем что у них есть ключевое слово)
   */
  async getWaitingsForClose(offerId: string): Promise<IBot[] | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Bot,
      `&${FILTER_BY_FORMULA}=AND({Id (from OfferId)} = "${offerId}", NOT({Ключевое слово} = ''), OR({Статус} = 'Выбор раздачи', {Статус} = 'Корзина', {Статус} = 'Поиск', {Статус} = 'Артикул правильный', {Статус} = 'Проблема с артикулом'))`,
    );

    //console.log('count filter', articul, data?.records.length);

    if (!data?.records?.length || data?.records?.length === 0) return null;

    return (data as IBots).records;
  }
  /**
   * все раздачи пользователей по артикулу для для получения списка ключевых слов
   */
  async getUsesKeys(
    offerId: string,
  ): Promise<{ name: string; count: number }[] | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Bot,
      `&${FILTER_BY_FORMULA}=AND({Id (from OfferId)} = "${offerId}", NOT({Ключевое слово} = ""), OR({Статус} = "Выбор раздачи", {Статус} = "Корзина", {Статус} = "Поиск", 
      {Статус} = "Артикул правильный", {Статус} = "Проблема с артикулом", {Статус} = "Заказ", {Статус} = "Дата доставки"))`,
    );

    //console.log('count filter', articul, data?.records.length);

    if (!data?.records?.length || data?.records?.length === 0) return null;

    return convertToKeyObjects(
      (data as IBots).records.map((x) => x.fields['Ключевое слово']),
    );
  }
  /**
   * выбираем все раздачи пользователей по артикулу со статусом Отмена для приглашения в открытую раздачу
   */
  async getClosedOfferUsers(offerId: string): Promise<IBot[] | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Bot,
      `&${FILTER_BY_FORMULA}=AND({Id (from OfferId)} = "${offerId}",{Статус} = "Отмена")`,
    );

    //console.log('count filter', articul, data?.records.length);

    if (!data?.records?.length || data?.records?.length === 0) return null;

    return (data as IBots).records;
  }
  async getOfferStatus(offerId: string): Promise<OfferStatus> {
    const data = (await this.airtableHttpService.getById(
      TablesName.Offers,
      offerId,
    )) as IOffer;
    if (!data) return null;

    return data.fields.Status;
  }

  async checkOnBan(chat_id: number): Promise<boolean> {
    const data = await this.airtableHttpService.get(
      TablesName.Ban,
      `&${FILTER_BY_FORMULA}=Find("${chat_id}",{chat_id})`,
    );
    if (!data || data.records.length === 0) return false;
    if ((data.records[0] as IBan).fields?.Статус === 'Блокировка') {
      return true;
    }
    return false;
  }
}
