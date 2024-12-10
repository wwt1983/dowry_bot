import { Module } from '@nestjs/common';
import { BotLoggerService } from './bot-logger.service';
import { SupabaseService } from 'src/supabase/supabase';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [BotLoggerService, SupabaseService],
  exports: [BotLoggerService, SupabaseService],
})
export class BotLoggerModule {}
