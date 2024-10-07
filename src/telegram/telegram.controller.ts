import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { SubscribeDto } from './dto/SubscribeDto';
import { OfferStatus } from 'src/airtable/types/IOffer.interface';
import { BotStatus } from 'src/airtable/types/IBot.interface';
import { FORMAT_DATE } from 'src/common/date/date.methods';
import { formatInTimeZone } from 'date-fns-tz';
import { FeedbackStatus } from './telegram.interface';

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
      console.log('response from web=', e);
    }
  }

  @Post('subscriber')
  subscriber(@Body() subscribeDto: SubscribeDto): void {
    this.telegramService.sendMessageToSubscriberFromDb(
      +subscribeDto.chat_id,
      subscribeDto.text,
      subscribeDto.button,
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
  @Post('publishFeedback')
  async publishFeedback(
    @Body()
    data: {
      status: FeedbackStatus;
      chat_id: string;
      datePublishFeedback: string;
      userName: string;
      sessionId: string;
    },
  ): Promise<boolean> {
    return await this.telegramService.sendFeadbackToUser(
      data.status,
      data.chat_id,
      data.datePublishFeedback,
      data.userName,
      data.sessionId,
    );
  }
  /**
   * перенос данных из таблицы Бот в таблицу Раздачи
   */
  @Post('transferBotToDistributions')
  async transferBotToDistributions(
    @Body()
    data: {
      sessionId: string;
      chat_id: string;
      userName: string;
      images: string[];
      articul: string;
      dataForCash: string;
      key: string;
      price: string;
      checkWb: string;
      dateRecived: string;
      dateBuy: string;
    },
  ): Promise<void> {
    await this.telegramService.transferBotToDistributions(
      data.sessionId,
      data.chat_id,
      data.userName,
      data.images,
      data.articul,
      data.dataForCash,
      data.key,
      data.price,
      data.checkWb,
      data.dateRecived,
      data.dateBuy,
    );
  }
  /**
   * при изменении поля chat_id запускается запрос на перенос данных из бота в таблицу Раздачи
   */
  @Post('signalToTransferBotToDistributions')
  async signalToTransferBotToDistributions(
    @Body()
    data: {
      chat_id: string;
      articul: string[];
      id: string;
    },
  ) {
    await this.telegramService.signalToTransferBotToDistributions(
      data.chat_id,
      data.articul[0],
      data.id,
    );
    console.log('signalToTransferBotToDistributions', data);
  }

  /**
   * при нажатии галочки о выплате кешбека обновляем статус в таблице Бот
   */
  @Post('updateStatusByCache')
  async updateStatusByCache(
    @Body()
    data: {
      chat_id: string;
      articul: string[];
    },
  ) {
    await this.telegramService.updateStatusByCache(
      data.chat_id,
      data.articul[0],
    );
    console.log('updateStatusByCache', data);
  }
}
