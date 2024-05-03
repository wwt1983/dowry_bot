import { ModuleMetadata } from '@nestjs/common';
import { SessionFlavor, Context } from 'grammy';
import { Api } from 'grammy';
import { HydrateApiFlavor, HydrateFlavor } from '@grammyjs/hydrate';

export interface ITelegramOptions {
  token: string;
}

export interface ITelegramModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<ITelegramOptions> | ITelegramOptions;
  inject?: any[];
}

export interface ITelegramAirtableData {
  User: string;
  Images: string[];
  Раздача: string;
  Артикул: string;
  StartTime: string;
  StopTime: string;
  Отзыв: string;
}

export interface ISessionData {
  chat_id: string;
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
  lastLoadImage?: string;
  lastMessage?: any;
}

export type MyContext = HydrateFlavor<Context & SessionFlavor<ISessionData>>;
export type MyApi = HydrateApiFlavor<Api>;

export interface ITelegramWebApp {
  id: number;
  title: string;
  cash: number;
  keys: string;
  articul: number;
}
