import { Injectable } from '@nestjs/common';

import { AirtableHttpService } from './airtable.http.service';
import { ConfigService } from '@nestjs/config';
import {
  ErrorKeyWord,
  FILTER_BY_FORMULA,
  TablesName,
  AIRTABLE_URL,
} from './airtable.constants';

import { IOffer, IOffers } from './types/IOffer.interface';
import { INotifications } from './types/INotification.interface';
import { INotificationStatistics } from './types/INotificationStatistic.interface';
import { BotStatus, IBot } from './types/IBot.interface';
import { getTimeWithTz, getOfferTime } from 'src/common/date/date.methods';
import { ISessionData } from 'src/telegram/telegram.interface';
import { IBotComments } from './types/IBotComment';
import { User } from '@grammyjs/types';
import { getUserName } from 'src/telegram/telegram.custom.functions';
import { IKeyWord, IKeyWords } from './types/IKeyWords.interface';
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

@Injectable()
export class AirtableService {
  constructor(
    private readonly airtableHttpService: AirtableHttpService,
    private readonly configService: ConfigService,
  ) {}

  async saveToAirtable(session: ISessionData): Promise<any> {
    const data = {
      SessionId: session.sessionId,
      User: session.user,
      chat_id: session.chat_id,
      Статус: session.status,
      Подписка: session.itsSubscriber,
    };
    const tableUrl = this.configService.get(
      'AIRTABLE_WEBHOOK_URL_FOR_TABlE_BOT',
    );
    const response = await this.airtableHttpService.postWebhook(tableUrl, data);
    console.log('postWebhook ===>', response);
    return response;
  }
  async updateToAirtable(session: ISessionData): Promise<any> {
    try {
      if (!session.sessionId) {
        console.log('empty session=', session);
        return null;
      }
      const correctTime = getOfferTime(session);

      const data = {
        SessionId: session.sessionId,
        Артикул: session.data?.articul,
        StartTime: correctTime?.itsFutureTime
          ? correctTime.time
          : session.startTime,
        ['Время выкупа']: session.stopBuyTime,
        OfferId: session.offerId,
        Статус: session.status,
        Location: session.location,
        Раздача: session.data?.title,
        Images: session.images,
        StopTime: getTimeWithTz(),
        ['Дата получения']: session.deliveryDate,
        Финиш: session.isFinish,
        CommentsLink: session.chat_id,
        'Ключевые слова':
          session.data.keys +
          (correctTime?.itsTimeOrder ? ` (${correctTime.time})` : ''),
        Фильтр: session?.data?.filter || '',
        'Факт дата получения': session.recivingDate,
        'Данные для кешбека': session.dataForCash || '',
        Цена: session.price ? session.price.replace(/\D/g, '') : '',
        'Чек WB': session.checkWb || '',
        'Поиск скрин': session?.imgSearch || '',
        'Корзина скрин': session?.imgCart || '',
        'Заказ скрин': session?.imgOrder || '',
        'Получен скрин': session?.imgRecieved || '',
        'Штрих-код скрин': session?.imgShtrihCode || '',
        'Товар скрин': session?.imgGood || '',
      };

      const tableUrl = this.configService.get(
        'AIRTABLE_WEBHOOK_URL_FOR_TABlE_BOT_UPDATE',
      );
      const response = await this.airtableHttpService.postWebhook(
        tableUrl,
        data,
      );
      console.log('postWebhook update updateToAirtable ok===> ', response);
      return response;
    } catch (e) {
      console.log('error updateToAirtable=', session, e);
      return null;
    }
  }
  async updateStatusInBotTableAirtable(
    sessionId: string,
    status: BotStatus,
  ): Promise<any> {
    const tableUrl = this.configService.get(
      'AIRTABLE_WEBHOOK_URL_FOR_TABlE_BOT_UPDATE_STATUS',
    );
    if (!sessionId) {
      console.log('empty session=', status);
      return null;
    }
    const response = await this.airtableHttpService.postWebhook(tableUrl, {
      SessionId: sessionId,
      Статус: status,
      StopTime: getTimeWithTz(),
    });
    console.log('postWebhook ===>', response, sessionId);
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
    let tableUrl = '';
    const comments = await this.getCommetByChatId(from.id);
    const userValue = getUserName(from);
    let data = null;
    if (comments && comments.records && comments.records.length > 0) {
      tableUrl = this.configService.get(
        'AIRTABLE_WEBHOOK_URL_FOR_TABlE_BOT_UPDATE_COMMENTS',
      );
      comment = '\n' + comment + '\n' + comments.records[0].fields.Комментарии;
      data = {
        id: comments.records[0].id,
        Комментарии: comment.trim(),
        Status: isAnswer ? 'Ответ' : 'Вопрос',
      };
    } else {
      tableUrl = this.configService.get(
        'AIRTABLE_WEBHOOK_URL_FOR_TABlE_BOT_ADD_COMMENTS',
      );
      data = {
        chat_id: from.id,
        Комментарии: comment.trim(),
        Name: userValue.fio + ' ' + userValue.userName,
      };
    }
    const response = await this.airtableHttpService.postWebhook(tableUrl, data);
    console.log('postWebhook ===>', response);
    return response;
  }

  async addToAirtableNotificationStatistic(data: any): Promise<any> {
    const tableUrl = this.configService.get(
      'AIRTABLE_WEBHOOK_URL_FOR_TABlE_NOTIFICATION_STATISTIC_ADD',
    );
    const response = await this.airtableHttpService.postWebhook(tableUrl, data);
    console.log('postWebhook ===>', response);
    return response;
  }
  async updateToAirtableNotificationStatistic(data: any): Promise<any> {
    const tableUrl = this.configService.get(
      'AIRTABLE_WEBHOOK_URL_FOR_TABlE_NOTIFICATION_STATISTIC_UPDATE',
    );
    const response = await this.airtableHttpService.postWebhook(tableUrl, data);
    console.log('postWebhook ===>', response);
    return response;
  }

  async getBotStatusByUser(sessionId: string): Promise<BotStatus | null> {
    const filter = `&${FILTER_BY_FORMULA}=FIND("${sessionId}",{SessionId})`;
    const data = await this.airtableHttpService.get(TablesName.Bot, filter);
    if (!data || (data.records && data.records.length === 0)) return null;
    return (data.records[0] as IBot).fields['Статус'];
  }
  async getCommetByChatId(chat_id: string | number): Promise<IBotComments> {
    const filter = `&${FILTER_BY_FORMULA}=FIND("${chat_id}",{chat_id})`;
    return await this.airtableHttpService.get(TablesName.UserComments, filter);
  }
  /**
   * список раздач
   */
  async getOffers(): Promise<IOffers> {
    const filter =
      process.env.NODE_ENV === 'development'
        ? `&${FILTER_BY_FORMULA}=OR({Status}="In progress", {Status}="Test")`
        : `&${FILTER_BY_FORMULA}=OR({Status}="In progress", {Status}="Scheduled")`;
    return await this.airtableHttpService.get(TablesName.Offers, filter);
  }
  async getOffer(
    id: string,
    needKeys?: boolean,
    needTimes?: boolean,
  ): Promise<IOffer> {
    const offer = (await this.airtableHttpService.getById(
      TablesName.Offers,
      id,
    )) as IOffer;

    offer.fields['Ключевые слова'] = ErrorKeyWord;
    const count = offer.fields.Количество;
    const countOrder = offer.fields['Количество заказов сегодня'];
    offer.fields['Время бронь'] = null;

    if (needKeys) {
      const keyIds = offer.fields.Ключи;
      if (keyIds && keyIds.length > 0) {
        const keys = (await this.airtableHttpService.get(
          TablesName.KeyWords,
          getFilterById(keyIds),
        )) as IKeyWords;

        if (count >= countOrder && keys.records.length > 0) {
          let allCountKeys = 0;
          for (let i = 0; i < keys.records.length; i++) {
            const countKeу = keys.records[i].fields.Количество;
            allCountKeys = allCountKeys + countKeу;
            const keyValue = (keys.records[i] as IKeyWord).fields.Название;
            if (allCountKeys > countOrder) {
              offer.fields['Ключевые слова'] = keyValue;
              break;
            }
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
  }
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
  async getBotByFilter(value: string, field: string): Promise<IBot[] | null> {
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

  async getArticleById(id: string): Promise<IArticle | null> {
    const data = await this.airtableHttpService.get(
      `${AIRTABLE_URL}/${TablesName.Articuls}/${id}`,
    );
    if (!data) return null;
    return data as IArticle;
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

  async getDistributionByFilterArticulAndNick(
    articul: string,
    nick?: string,
    chat_id?: string,
  ): Promise<IDistributions | null> {
    const filter = chat_id
      ? `&${FILTER_BY_FORMULA}=SEARCH("${chat_id.trim()}", {chat_id})`
      : `&${FILTER_BY_FORMULA}=AND({Артикул WB}="${articul.trim()}", {Ник ТГ}="${nick.trim()}")`;
    const data = await this.airtableHttpService.get(
      TablesName.Distributions,
      filter,
    );
    console.log('data=', data, chat_id, articul);
    if (!data || !data.records || data?.records?.length === 0) return null;
    return data as IDistributions;
  }

  async getBotByFilterArticulAndChatId(
    articul: string,
    chat_id: string,
  ): Promise<IBot | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Bot,
      `&${FILTER_BY_FORMULA}=AND({Артикул}="${articul}", {chat_id}="${chat_id}")`,
    );
    console.log('data=', data);
    if (!data || !data.records) return null;
    return data.records[0] as IBot;
  }

  async getDistributionById(id: string): Promise<IDistribution | null> {
    const data = await this.airtableHttpService.get(
      `${AIRTABLE_URL}/${TablesName.Distributions}/${id}`,
    );
    if (!data) return null;
    return data as IDistribution;
  }

  async getHelperTable(): Promise<IHelpers | null> {
    const data = await this.airtableHttpService.get(TablesName.Helpers);
    if (!data) return null;
    return data as IHelpers;
  }
  async findBuyer(nick: string): Promise<IBuyer[] | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Buyer,
      `&${FILTER_BY_FORMULA}=Find("${nick}",{Ник ТГ})`,
    );
    if (!data || data.records.length === 0) return null;
    return data.records as IBuyer[];
  }

  async checkPhone(phone: string): Promise<boolean> {
    const data = await this.airtableHttpService.get(
      TablesName.Buyer,
      `&${FILTER_BY_FORMULA}=Find("${phone}",{Телефон})`,
    );
    if (!data || data.records.length === 0) return false;
    return true;
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
    const tableUrl = this.configService.get(
      'AIRTABLE_WEBHOOK_FOR_TRANSFER_DATA_FROM_BOT_TO_DISTRIBUTION_STATUS_UPDATE',
    );
    const response = await this.airtableHttpService.postWebhook(tableUrl, {
      'Перенести в Раздачу': status,
      SessionId: sessionId,
    });
    console.log('postWebhook ===>', response);
    return response;
  }
}
