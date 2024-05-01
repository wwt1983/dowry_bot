import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('bot')
  bot(@Body() data: any): void {
    console.log(`WEB DATA time= ${Date.now()}=`, data);

    try {
      if (data.query_id) {
        this.telegramService.bot.api.answerWebAppQuery(data.query_id, {
          type: 'article',
          id: data.id,

          title: 'Успешная заявка на раздачу',
          input_message_content: {
            message_text: ` Поздравляю `,
          },
        });
      } else {
        console.log(`empty${data.query_id} query_id time=` + Date.now());
      }
    } catch (e) {
      console.log(e);
    }
  }
}
