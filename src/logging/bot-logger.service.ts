import { LoggerService } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
//import { SupabaseService } from '../supabase/supabase';

@Injectable()
export class BotLoggerService implements LoggerService {
  constructor() {
    console.log('BotLogger ok ');
  }

  log(message: string) {
    // Игнорируем сообщения о маршрутах
    if (message.startsWith('Mapped') || message.includes('Controller')) {
      return;
    }
    //this.saveToSupabase('log', message);
    console.log(message);
  }

  error(message: string, trace: string) {
    //this.saveToSupabase('error', message);

    console.error(message, trace);
  }

  warn(message: string) {
    // this.saveToSupabase('warn', message);
    console.warn(message);
  }

  debug(message: string) {
    //this.saveToSupabase('debug', message);
    console.debug(message);
  }

  verbose(message: string) {
    // this.saveToSupabase('verbose', message);
    console.info(message);
  }

  private async saveToSupabase(level: string, message: string) {
    //   try {
    //     await this.supabaseService.supabase.from('logs').insert([
    //       {
    //         level,
    //         message,
    //         timestamp: new Date().toISOString(),
    //       },
    //     ]);
    //   } catch (error) {
    //     console.error('Failed to save log to Supabase:', error);
    //   }
  }
}
