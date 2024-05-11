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
  StopBuyTime: string;
  StopTime: string;
  Отзыв: string;
}

export interface ISessionData {
  sessionId: null;
  chat_id: string;
  data?: ITelegramWebApp;
  startTime?: string;
  stopTime?: string;
  stopBuyTime?: string; //время выкупа товра после начала сессии
  isLoadImageSearch?: boolean; // поиск товара
  isLoadImageOrderWithPVZ?: boolean; // подвтверждение факта заказа
  isLoadImageGiveGood?: boolean; // получен товар
  isLoadImageOnComment?: boolean; // отзыв
  isLoadImageBrokeCode?: boolean; // фото порванного штрих-кода
  isLoadImageCheck?: boolean; // чек
  step?: number;
  comment?: string;
  Images?: string[];
  lastLoadImage?: string;
  lastMessage?: any;
  isFinish: boolean;
  offerId: string;
}

export type MyContext = HydrateFlavor<Context & SessionFlavor<ISessionData>>;
export type MyApi = HydrateApiFlavor<Api>;

export interface ITelegramWebApp {
  title: string;
  cash: string;
  priceForYou: string;
  priceWb: string;
  image: string;
  id: string;
  offerId: string;
  articul: string;
  keys: string;
}
