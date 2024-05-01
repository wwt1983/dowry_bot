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

export const COUNT_STEPS = 7;

export function sendMsgToSecretChat(ctx: CommandContext<MyContext>) {
  const { first_name, last_name, username, id } = ctx.from;

  return `Старт: ${format(new Date(), 'dd.MM.yyyy H:mm')} ${first_name} 
  ${last_name || ''} username=${username || ''} 
  https://web.telegram.org/a/#${id}`;
}

export function createInitialSessionData(): ISessionData {
  return {
    startTime: format(new Date(), 'dd.MM.yyyy H:mm'),
    stopTime: null,
    isLoadImageSearch: null,
    isLoadImageGiveGood: null,
    step: 0,
    comment: '',
    isLoadImageOnComment: false,
    isLoadImageBrokeCode: false,
    isLoadImageCheck: false,
    isLoadImageOrderWithPVZ: false,
    Images: [],
  };
}

export function getTextForFirstStep(data: ITelegramWebApp): string {
  const { title, keys, cash, articul } = data;
  return (
    `Раздача: ${title} с кешбеком ${cash} рублей\n` +
    HEADER +
    FIRST_STEP +
    keys +
    '\n' +
    FIRST_STEP_B +
    FIRST_STEP_A +
    `https://www.wildberries.ru/catalog/${articul}/detail.aspx`
  );
}

export function getTextByStep(step: number): string {
  switch (step) {
    case 0:
      return FIRST_STEP_C;
    case 1:
      return SECOND_STEP;
    case 2:
      return THREE_STEP;
    case 3:
      return FOUR_STEP;
    case 4:
      return FOUR_STEP_A;
    case 5:
      return FOUR_STEP_B;
    default:
      return FOOTER;
  }
}
