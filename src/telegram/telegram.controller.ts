import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { SubscribeDto } from './dto/SubscribeDto';
import { OfferStatus } from 'src/airtable/types/IOffer.interface';
import { BotStatus } from 'src/airtable/types/IBot.interface';
import { FORMAT_DATE } from 'src/common/date/date.methods';
import { formatInTimeZone } from 'date-fns-tz';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('bot')
  bot(@Body() data: any): void {
    console.log(
      `WEB DATA time= ${formatInTimeZone(new Date(), 'Europe/Moscow', FORMAT_DATE)}`,
      data,
    );

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
        console.log(
          `empty${data.query_id} query_id time=${formatInTimeZone(new Date(), 'Europe/Moscow', FORMAT_DATE)}`,
        );
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
  @Post('notification')
  async notification(
    @Body()
    data: {
      chat_id: string;
      sessionId: string;
      botId: string;
      status: BotStatus;
      startTime: string;
      stopTime: string;
      offerName: string;
      dateDelivery: string;
      outFromOffer: boolean;
    },
  ): Promise<void> {
    await this.telegramService.sendNotificationToUser(
      data.chat_id,
      data.sessionId,
      data.botId,
      data.status,
      data.startTime,
      data.stopTime,
      data.offerName,
      data.dateDelivery,
      data.outFromOffer,
    );
  }
  @Post('orderFromSite')
  async orderFromSite(
    @Body() data: { phone: string; name: string; articul: string },
  ): Promise<number> {
    console.log(data);
    return await this.telegramService.sendOrderToChat(
      data.phone,
      data.name,
      data.articul,
    );
  }
}
