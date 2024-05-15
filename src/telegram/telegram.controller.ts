import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { SubscribeDto } from './dto/SubscribeDto';
import { OfferStatus } from 'src/airtable/types/IOffer.interface';

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
    this.telegramService.bot.api.sendMessage(
      subscribeDto.chat_id,
      subscribeDto.text,
    );
  }

  @Post('publicOffer')
  async publicOffer(@Body() data: { id: string }): Promise<number> {
    const messageId = await this.telegramService.sendOfferToChat(data.id);
    return messageId;
  }
  @Post('closeOffer')
  async closeOffer(
    @Body() data: { messageId: number; status: OfferStatus },
  ): Promise<void> {
    await this.telegramService.closeOfferInChat(data.messageId, data.status);
  }
}
