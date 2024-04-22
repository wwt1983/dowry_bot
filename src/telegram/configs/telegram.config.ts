import { ConfigService } from '@nestjs/config';
import { ITelegramOptions } from '../telegram.interface';
import { TELEGRAM_CHAT_ID } from '../telegram.constants';

export default (configService: ConfigService): ITelegramOptions => {
  const token = configService.get('TELEGRAM_TOKEN');
  if (!token) throw new Error('TELEGRAM_TOKEN not found');

  return {
    token,
    chatId: TELEGRAM_CHAT_ID,
  };
};
