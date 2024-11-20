import { ModuleMetadata } from '@nestjs/common';
import { SessionFlavor, Context } from 'grammy';
import {
  type Conversation,
  type ConversationFlavor,
} from '@grammyjs/conversations';
import { Api } from 'grammy';
import { HydrateApiFlavor, HydrateFlavor } from '@grammyjs/hydrate';
import { BotStatus, BrokeBotStatus } from 'src/airtable/types/IBot.interface';
import { COMMAND_NAMES } from './telegram.constants';
import { OfferDetails, OfferType } from 'src/airtable/types/IOffer.interface';

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
  step?: number;
  comment?: string;
  images?: string[];
  lastLoadImage?: string;
  lastMessage?: any;
  isFinish?: boolean;
  offerId?: string;
  status?: BotStatus;
  location?: string;
  countTryError?: number; //количество попыток сделать какое-то действие
  errorStatus?: BrokeBotStatus;
  deliveryDate?: string;
  recivingDate?: string;
  conversation?: any;
  lastCommand?: COMMAND_NAMES;
  times?: string[];
  isRestore: boolean;
  realStatus?: BotStatus; // для восcтановленных отрицательных статусов чтобы понимать двигаться можно дальше или оставаться на этом шаге
  itsSubscriber?: boolean;
  userOffers?: string[];
  dataForCash?: string; //fio bank phone
  price?: string;
  checkWb?: string;
  instructionMessages?: number[];
  imgSearch?: string; // поиск
  imgCart?: string; // корзина
  imgOrder?: string; // заказ
  imgRecieved?: string; // получен
  imgShtrihCode?: string; // штрих-код
  imgGood?: string; //товар
  timeOfEntry?: string; //время входа,
  checkParseImages: string[]; //результат парсинга текста из фото
  messageId?: string; //номер сообщения для редактирования интервала
  detailsOffer?: OfferDetails; // хранится инфо о цене и кеше раздачи для конкретного пользователя
}

export type MyContext = HydrateFlavor<
  Context & SessionFlavor<ISessionData> & ConversationFlavor
>;
export type MyConversation = Conversation<MyContext>;
export type MyApi = HydrateApiFlavor<Api>;

export interface ITelegramWebApp {
  id: string;
  articul?: string;
  offerId: string;
  title?: string;
  cash?: string;
  priceForYou?: string;
  priceWb?: string;
  image?: string;
  keys?: string;
  description?: string;
  location?: string;
  positionOnWB?: string;
  times?: string[];
  countTryError?: number;
  errorStatus?: string;
  filter?: string;
  'Данные для кешбека'?: string;
  interval?: string;
  offerCount?: number;
  offerOrderToday?: number;
  queueLength?: number; //очередь
  offerType?: OfferType;
  extendedOfferType?: boolean; //расширенность означает нужны ли доп шаги
  dayOfCash?: string;
}
export type FeedbackStatus =
  | 'С фото'
  | 'Без фото'
  | 'Отложить отзыв'
  | 'Только оценка';

export interface IStep {
  step: number;
  value: string;
  erroText: string;
  image?: string;
  isActive: boolean;
  typeStep: string;
  stop: boolean;
  textCheck: string[] | boolean;
}

export interface ISteps {
  [key: string]: IStep;
}
