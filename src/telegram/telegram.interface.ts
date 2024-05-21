import { ModuleMetadata } from '@nestjs/common';
import { SessionFlavor, Context } from 'grammy';
import { Api } from 'grammy';
import { HydrateApiFlavor, HydrateFlavor } from '@grammyjs/hydrate';
import { BotStatus } from 'src/airtable/types/IBot.interface';

export interface ITelegramOptions {
  token: string;
}

export interface ITelegramModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<ITelegramOptions> | ITelegramOptions;
  inject?: any[];
}
export interface ISessionData {
  sessionId: string;
  user: string;
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
  images?: string[];
  lastLoadImage?: string;
  lastMessage?: any;
  isFinish?: boolean;
  offerId?: string;
  status?: BotStatus;
  location?: string;
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
  articul: string;
  keys: string;
  offerId: string;
  description: string;
  location?: string;
  positionOnWB?: string;
}
