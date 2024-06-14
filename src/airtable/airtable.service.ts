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
import { getTimeWithTz } from 'src/common/date/date.methods';
import { ISessionData } from 'src/telegram/telegram.interface';
import { IBotComments } from './types/IBotComment';
import { User } from '@grammyjs/types';
import { getUserName } from 'src/telegram/telegram.custom.functions';
import { IKeyWord, IKeyWords } from './types/IKeyWords.interface';

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
        'Ключевые слова': session.data.keys,
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
  async getOffer(id: string, needKeys?: boolean): Promise<IOffer> {
    const offer = await this.airtableHttpService.getById(TablesName.Offers, id);
    if (needKeys) {
      const keyIds = (offer as IOffer).fields.Ключи;
      if (keyIds && keyIds.length > 0) {
        const filter =
          keyIds.length === 1
            ? `&${FILTER_BY_FORMULA}=FIND("${keyIds[0]}",{Id})`
            : `&${FILTER_BY_FORMULA}=OR(${keyIds.map((x) => `{Id}="${x}"`).join(',')})`;

        const keys = await this.airtableHttpService.get(
          TablesName.KeyWords,
          filter,
        );

        const count = (offer as IOffer).fields.Количество;
        const countOrder = (offer as IOffer).fields['Количество заказов'];

        if (count >= countOrder && (keys as IKeyWords).records.length > 0) {
          let flagForGetKey = false;
          let allCountKeys = 0;
          for (let i = 0; i < (keys as IKeyWords).records.length; i++) {
            const countKye = (keys as IKeyWords).records[i].fields.Количество;
            allCountKeys = allCountKeys + countKye;
            const keyValue = (keys.records[i] as IKeyWord).fields.Название;
            if (allCountKeys > countOrder) {
              flagForGetKey = true;
              (offer as IOffer).fields['Ключевые слова'] = keyValue;
              break;
            }
          }
          if (!flagForGetKey) {
            (offer as IOffer).fields['Ключевые слова'] = ErrorKeyWord;
          }
        } else {
          (offer as IOffer).fields['Ключевые слова'] = ErrorKeyWord;
        }
      } else {
        (offer as IOffer).fields['Ключевые слова'] = ErrorKeyWord;
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
