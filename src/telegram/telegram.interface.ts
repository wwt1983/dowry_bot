import { ModuleMetadata } from '@nestjs/common';
import { SessionFlavor, Context } from 'grammy';

export interface ITelegramOptions {
  token: string;
}

export interface ITelegramModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<ITelegramOptions> | ITelegramOptions;
  inject?: any[];
}

export interface ITelegramAirtableHelperData {
  Name: string;
  Notes: string;
  Articul: string;
}

export interface ISessionData {
  data?: ITelegramWebApp;
  startTime?: string;
  stopTime?: string;
  isLoadImageSearch?: boolean; // поиск товара
  isLoadImageOrderWithPVZ?: boolean; // пожвтерждения факта заказа
  isLoadImageGiveGood?: boolean; // получен товар
  isLoadImageOnComment?: boolean; // отзыв
  isLoadImageBrokeCode?: boolean; // фото порванного штрихкода
  isLoadImageCheck?: boolean; // чек
  step?: number;
  comment?: string;
  Images?: string[];
}

export type MyContext = Context & SessionFlavor<ISessionData>;

export interface ITelegramWebApp {
  id: number;
  title: string;
  cash: number;
  keys: string;
  articul: number;
}
