import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('bot')
  bot(@Body() data: any): void {
    console.log('WEB DATA POST', data);
    try {
      this.telegramService.bot.api.answerWebAppQuery(data.queryId, {
        type: 'article',
        id: data.queryId,
        title: 'Успешная заявка на раздачу',
        input_message_content: {
          message_text: ` Поздравляю `,
        },
      });
    } catch (e) {
      console.log(e);
    }
  }
}
