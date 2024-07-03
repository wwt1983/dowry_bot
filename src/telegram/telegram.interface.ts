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
  deliveryDate: string;
  conversation?: any;
  lastCommand?: COMMAND_NAMES;
  times?: string[];
  isRestore: boolean;
  itsSubscriber?: boolean;
}

export type MyContext = HydrateFlavor<
  Context & SessionFlavor<ISessionData> & ConversationFlavor
>;
export type MyConversation = Conversation<MyContext>;
export type MyApi = HydrateApiFlavor<Api>;

export interface ITelegramWebApp {
  id: string;
  articul: string;
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
}
