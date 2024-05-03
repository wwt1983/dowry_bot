import { ISessionData, ITelegramWebApp } from './telegram.interface';
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
    chat_id: null,
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

export function UpdateSessionByField(
  session: ISessionData,
  field: string,
  data: string | ITelegramWebApp,
): ISessionData {
  session[field] = data;
  return session;
}

export function UpdateSessionByStep(
  session: ISessionData,
  data?: string,
  isPhotoMsg?: boolean,
): ISessionData {
  const { step } = session;

  switch (step) {
    case 0:
      session.isLoadImageSearch = true;
      break;
    case 1:
      session.isLoadImageOrderWithPVZ = true;
      break;
    case 2:
      session.isLoadImageGiveGood = true;
      break;
    case 3:
      session.comment = data;
      break;
    case 4:
      session.isLoadImageOnComment = true;
      break;
    case 5:
      session.isLoadImageBrokeCode = true;
      break;
    case 6:
      session.isLoadImageCheck = true;
      session.stopTime = format(new Date(), 'dd.MM.yyyy H:mm');
      break;
    default:
      break;
  }
  session = nextStep(session);

  if (isPhotoMsg) {
    session.Images = [...session.Images, data];
    session.lastLoadImage = data;
  }

  return session;
}
export function nextStep(session: ISessionData): ISessionData {
  session.step = session.step + 1;
  return session;
}

export function getTextForFirstStep(data: ITelegramWebApp): string {
  const { title, keys, cash, articul } = data;
  return (
    FIRST_STEP_B +
    `Раздача: ${title} с кешбэком ${cash} <b>рублей</b>\n` +
    `https://www.wildberries.ru/catalog/${articul}/detail.aspx` +
    '\n\n' +
    HEADER +
    FIRST_STEP +
    keys +
    '\n\n' +
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
