import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ITelegramModuleAsyncOptions } from './telegram.interface';
import { TELEGRAM_MODULE_OPTIONS } from './telegram.constants';
import { TelegramHttpService } from './telegram.http.service';
import { TelegramController } from './telegram.controller';
import { BotLoggerService } from '../logging/bot-logger.service';

@Global()
@Module({
  controllers: [TelegramController],
})
export class TelegramModule {
  static forRootAsync(options: ITelegramModuleAsyncOptions): DynamicModule {
    const providerAsyncOptions = this.createAsyncOptionsProvider(options);
    return {
      module: TelegramModule,
      imports: options.imports,
      providers: [
        TelegramService,
        providerAsyncOptions,
        TelegramHttpService,
        BotLoggerService,
      ],
      exports: [
        TelegramService,
        providerAsyncOptions,
        TelegramHttpService,
        BotLoggerService,
      ],
    };
  }

  private static createAsyncOptionsProvider(
    options: ITelegramModuleAsyncOptions,
  ): Provider {
    return {
      provide: TELEGRAM_MODULE_OPTIONS,
      useFactory: async (...args: any[]) => {
        const config = await options.useFactory(...args);
        return config;
      },
      inject: options.inject || [],
    };
  }
}
