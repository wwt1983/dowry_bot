import { Injectable } from '@nestjs/common';
import { AirtableHttpService } from '../airtable/airtable.http.service';
import {
  IDistributions,
  IDistribution,
} from '../airtable/types/IDisturbation.interface';
import { IHelpers } from 'src/airtable/types/IHelper.interface';
import { IArticle } from 'src/airtable/types/IArticle.interface';
import { AIRTABLE_URL, Base, TablesName } from 'src/airtable/airtable.constants';

@Injectable()
export class TelegramCommandsService {
  constructor(private readonly airtableHttpService: AirtableHttpService) {
    //
  }

  async getHelperTable(url: string): Promise<IHelpers | null> {
    const data = await this.airtableHttpService.getTable(url);
    if (!data) return null;
    return data as IHelpers;
  }

  async getDistributionTable(url: string): Promise<IDistributions | null> {
    const data = await this.airtableHttpService.getTable(url);
    if (!data) return null;
    return data as IDistributions;
  }

  async getArticleTable(id: string): Promise<IArticle | null> {
    const data = await this.airtableHttpService.getTable(
      `${AIRTABLE_URL}${Base}/${TablesName.Articuls}/${id}`,
    );
    if (!data) return null;
    return data as IArticle;
  }

  async getDistributionTableByFilter(
    url: string,
    dateCompare,
  ): Promise<IDistribution[] | null> {
    const data = await this.airtableHttpService.getTable(url);
    if (!data) return null;
    const filterData = (data as IDistributions).records.filter(
      (item) => new Date(item.fields['Дата выкупа']) > new Date(dateCompare),
    );
    return filterData;
  }

  // async deleteAllMessages(ctx: CommandContext<Context>): Promise<void> {
  //   const res = await ctx.reply('Удаление прошло.');
  //   for (let i = res.message_id; i >= 0; i--) {
  //     try {
  //       await ctx.api.deleteMessage(ctx.chat.id, i);
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   }
  // }
}
