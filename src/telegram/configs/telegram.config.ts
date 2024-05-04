import { ConfigService } from '@nestjs/config';
import { ITelegramOptions } from '../telegram.interface';

export default (configService: ConfigService): ITelegramOptions => {
  const token =
    process.env.NODE_ENV === 'development'
      ? configService.get('TEST_TELEGRAM_TOKEN')
      : configService.get('TELEGRAM_TOKEN');
  if (!token) throw new Error('TELEGRAM_TOKEN not found');

  return {
    token,
  };
};
