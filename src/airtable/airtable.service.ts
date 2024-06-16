import { Injectable } from '@nestjs/common';

import { AirtableHttpService } from './airtable.http.service';
import { ConfigService } from '@nestjs/config';
import {
  ErrorKeyWord,
  FILTER_BY_FORMULA,
  TablesName,
} from './airtable.constants';
import { IOffer, IOffers } from './types/IOffer.interface';
import { INotifications } from './types/INotification.interface';
import { INotificationStatistics } from './types/INotificationStatistic.interface';
import { BotStatus } from './types/IBot.interface';
import {
  FORMAT_DATE_SIMPLE,
  TIME_FULL,
  dateFormatNoTZ,
  getTimeWithTz,
} from 'src/common/date/date.methods';
import { ISessionData } from 'src/telegram/telegram.interface';
import { IBotComments } from './types/IBotComment';
import { User } from '@grammyjs/types';
import { getUserName } from 'src/telegram/telegram.custom.functions';
import { IKeyWord, IKeyWords } from './types/IKeyWords.interface';
import { getFilterById } from './airtable.custom';
import { ITime, ITimes } from './types/ITimes.interface';

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
      Bot: true,
      chat_id: session.chat_id,
      Статус: session.status,
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
      const timeStartOffer =
        session.data.times && session.data.times?.length
          ? ` (${session.data.times[2] === TIME_FULL ? dateFormatNoTZ(session.data.times[0], FORMAT_DATE_SIMPLE) : session.data.times[0]})`
          : '';

      const data = {
        SessionId: session.sessionId,
        Артикул: session.data?.articul,
        StartTime: session.startTime,
        ['Время выкупа']: session.stopBuyTime,
        OfferId: session.offerId,
        Статус: session.status,
        Location: session.location,
        Раздача: session.data.title,
        Images: session.images,
        StopTime: session.stopTime,
        ['Дата получения']: session.deliveryDate,
        Финиш: session.isFinish,
        CommentsLink: session.chat_id,
        'Ключевые слова': session.data.keys + timeStartOffer,
      };
      const tableUrl = this.configService.get(
        'AIRTABLE_WEBHOOK_URL_FOR_TABlE_BOT_UPDATE',
      );
      const response = await this.airtableHttpService.postWebhook(
        tableUrl,
        data,
      );
      console.log('postWebhook update updateToAirtable ok===>', response);
      return response;
    } catch (e) {
      console.log('updateToAirtable', session, e);
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
    console.log('postWebhook ===>', response);
    return response;
  }
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
        Status: isAnswer ? 'Done' : 'Todo',
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
  async getDistribution(): Promise<any> {
    const filter = `&${FILTER_BY_FORMULA}=SEARCH("In progress",{Status})`;
    return await this.airtableHttpService.get(TablesName.Distributions, filter);
  }
  async getUserFromBot(sessionId: string): Promise<any> {
    const filter = `&${FILTER_BY_FORMULA}=FIND("${sessionId}",{SessionId})`;
    return await this.airtableHttpService.get(TablesName.Bot, filter);
  }
  async getCommetByChatId(chat_id: string | number): Promise<IBotComments> {
    const filter = `&${FILTER_BY_FORMULA}=FIND("${chat_id}",{chat_id})`;
    return await this.airtableHttpService.get(TablesName.UserComments, filter);
  }
  async getOffers(): Promise<IOffers> {
    const filter = `&${FILTER_BY_FORMULA}=OR({Status}="In progress", {Status}="Scheduled")`;
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
    const countOrder = offer.fields['Количество заказов'];
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
            const countKye = keys.records[i].fields.Количество;
            allCountKeys = allCountKeys + countKye;
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
                  stopTime: keyValue.Stop,
                  onlyTime: times.records[i].fields['Только время'],
                };
                break;
              }
            }
          }
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
}
