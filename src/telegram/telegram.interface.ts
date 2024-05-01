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
  isLoadImageSearch?: boolean;
  isLoadImageGiveGood?: boolean;
  step?: number;
  comment?: string;
  isLoadImageOnComment?: boolean;
  isLoadImageBrokeCode?: boolean;
  isLoadImageCheck?: boolean;
}

export type MyContext = Context & SessionFlavor<ISessionData>;

export interface ITelegramWebApp {
  id: number;
  title: string;
  cash: number;
  keys: string;
  articul: number;
}
