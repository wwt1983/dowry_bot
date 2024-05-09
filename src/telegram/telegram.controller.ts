import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { SubscribeDto } from './dto/SubscribeDto';

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
          title: data.title,
          input_message_content: {
            message_text: JSON.stringify(data),
          },
        });
      } else {
        console.log(`empty${data.query_id} query_id time=` + Date.now());
      }
    } catch (e) {
      console.log(e);
    }
  }

  @Post('subscriber')
  subscriber(@Body() subscribeDto: SubscribeDto): void {
    console.log(`airtable time= ${Date.now()}=`, subscribeDto.text);
    this.telegramService.bot.api.sendMessage(
      subscribeDto.chat_id,
      JSON.stringify(subscribeDto.text),
    );
  }

  @Post('publicOffer')
  publicOffer(@Body() id: string): void {
    console.log(`publicOffer}=`, id);
  }
}
