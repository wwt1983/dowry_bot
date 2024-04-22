import { ModuleMetadata } from '@nestjs/common';

export interface ITelegramOptions {
  chatId: string;
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
