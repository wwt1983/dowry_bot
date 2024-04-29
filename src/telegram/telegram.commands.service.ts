import { Injectable } from '@nestjs/common';
import { AirtableHttpService } from '../airtable/airtable.http.service';
import { IDistributions } from '../airtable/types/IDisturbation.interface';
import { IHelpers } from 'src/airtable/types/IHelper.interface';
import { IArticle } from 'src/airtable/types/IArticle.interface';
import {
  AIRTABLE_URL,
  TablesName,
  FILTER_BY_FORMULA,
} from 'src/airtable/airtable.constants';
import { IBuyer } from 'src/airtable/types/IBuyer.interface';

@Injectable()
export class TelegramCommandsService {
  constructor(private readonly airtableHttpService: AirtableHttpService) {
    //
  }

  async getHelperTable(): Promise<IHelpers | null> {
    const data = await this.airtableHttpService.get(TablesName.Helpers);
    if (!data) return null;
    return data as IHelpers;
  }
  async findBuyer(nick: string): Promise<IBuyer | null> {
    const data = await this.airtableHttpService.get(
      TablesName.Buyer,
      `&${FILTER_BY_FORMULA}=Find("${nick}",{Ник ТГ})`,
    );
    if (!data || data.records.length === 0) return null;
    return data as IBuyer;
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
  async getDistributionTableByFilter(
    nick: string,
  ): Promise<IDistributions | null> {
    const filter = `&${FILTER_BY_FORMULA}=SEARCH("${nick}",{Покупатели})`;
    const data = await this.airtableHttpService.get(
      TablesName.Distributions,
      filter,
    );
    if (!data || (data.records && data.records.length === 0)) return null;
    console.log('data ===>>> ', data);
    return data.records;
  }
}