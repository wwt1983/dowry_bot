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
  messages?: string;
}

export type MyContext = Context & SessionFlavor<ISessionData>;
