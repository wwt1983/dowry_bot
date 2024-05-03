import { CommandContext } from 'grammy';
import { ISessionData, ITelegramWebApp, MyContext } from './telegram.interface';
import { format } from 'date-fns';
import {
  FIRST_STEP,
  HEADER,
  FIRST_STEP_A,
  FIRST_STEP_B,
  FIRST_STEP_C,
  SECOND_STEP,
  THREE_STEP,
  FOUR_STEP,
  FOUR_STEP_A,
  FOUR_STEP_B,
  FOOTER,
} from './telegram.constants';
import { User } from '@grammyjs/types';

export const COUNT_STEPS = 7;

export function createMsgToSecretChat(
  from: User,
  comment?: string,
  order?: string,
) {
  const { first_name, last_name, username, id } = from;

  const userComment = comment ? `Раздача:${order}: Отзыв:\n ${comment}` : '';
  return `Старт: ${format(new Date(), 'dd.MM.yyyy H:mm')} ${first_name} 
  ${last_name || ''} username=${username || ''} 
  https://web.telegram.org/a/#${id} ${userComment}`;
}

export function createInitialSessionData(): ISessionData {
  return {
    startTime: format(new Date(), 'dd.MM.yyyy H:mm'),
    stopTime: null,
    isLoadImageSearch: false,
    isLoadImageGiveGood: false,
    isLoadImageOnComment: false,
    isLoadImageBrokeCode: false,
    isLoadImageCheck: false,
    isLoadImageOrderWithPVZ: false,
    step: 0,
    comment: '',
    Images: [],
    lastLoadImage: null,
    lastMessage: null,
  };
}

export function getTextForFirstStep(data: ITelegramWebApp): string {
  const { title, keys, cash, articul } = data;
  return (
    FIRST_STEP_B +
    `Раздача: ${title} с кешбэком ${cash} рублей\n\n` +
    `https://www.wildberries.ru/catalog/${articul}/detail.aspx` +
    '\n' +
    HEADER +
    FIRST_STEP +
    keys +
    FIRST_STEP_A
  );
}

export function getTextByNextStep(step: number): string {
  switch (step) {
    case 1:
      return FIRST_STEP_C;
    case 2:
      return SECOND_STEP;
    case 3:
      return THREE_STEP;
    case 4:
      return FOUR_STEP;
    case 5:
      return FOUR_STEP_A;
    case 6:
      return FOUR_STEP_B;
    case 7:
      return FOOTER;
  }
}
