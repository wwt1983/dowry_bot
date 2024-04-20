import { ConfigService } from '@nestjs/config';
import { ITelegramOptions } from '../telegram.interface';

export default (configService: ConfigService): ITelegramOptions => {
  const token = configService.get('TELEGRAM_TOKEN');
  if (!token) throw new Error('TELEGRAM_TOKEN not found');

  return {
    token,
    chatId: configService.get('TELEGRAM_CHAT_ID') ?? '',
  };
};
