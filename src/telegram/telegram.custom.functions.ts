import { ISessionData, ITelegramWebApp } from './telegram.interface';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

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
  COUNT_STEPS,
  THREE_STEP_A,
  TELEGRAM_BOT_NAME,
} from './telegram.constants';
import { User } from '@grammyjs/types';
import { IBot } from 'src/airtable/types/IBot.interface';

export function sayHi(first_name: string, username: string): string {
  return (
    `Привет, ${first_name || username}! \n\n` + FIRST_STEP_B + 'В путь ⤵\n'
  );
}

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
    sessionId: uuidv4(),
    chat_id: null,
    startTime: format(new Date(), 'dd.MM.yyyy H:mm'),
    stopBuyTime: null,
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
    isFinish: false,
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

// export enum STEPS {
//   searchScreen = 'Поиск товара',
//   pvzScreen = 'Скриншот ПВЗ',
//   getGoodScreen = 'Скриншот о получении',
//   comment = 'Отзыв',
//   commentScreen = 'Скриншот отзыва',
// }

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
      session.stopBuyTime = format(new Date(), 'dd.MM.yyyy H:mm');
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
      session.isFinish = true;
      break;
    default:
      break;
  }

  if (isPhotoMsg) {
    session.Images = [...session.Images, data];
    session.lastLoadImage = data;
  }

  session = nextStep(session);

  return session;
}
export function nextStep(session: ISessionData): ISessionData {
  session.step = session.step + 1;
  return session;
}

export function getTextForFirstStep(data: ITelegramWebApp): string {
  const { title, keys, cash } = data;
  return (
    `Раздача: ${title} с кешбэком <b>${cash} рублей</b>\n` +
    '\n\n' +
    HEADER +
    FIRST_STEP +
    '<b>' +
    keys +
    '</b>' +
    '\n\n' +
    FIRST_STEP_A
  );
}

export function getTextByNextStep(step: number): string {
  switch (step) {
    case 1:
      return FIRST_STEP_C + getNumberText(step);
    case 2:
      return SECOND_STEP + getNumberText(step);
    case 3:
      return THREE_STEP + getNumberText(step);
    case 4:
      return FOUR_STEP + THREE_STEP_A + getNumberText(step);
    case 5:
      return FOUR_STEP_A + getNumberText(step);
    case 6:
      return FOUR_STEP_B + getNumberText(step);
    case 7:
      return FOOTER;
  }
}

function getNumberText(step: number) {
  const finish_txt = `До финиша `;
  switch (COUNT_STEPS - step) {
    case 8:
      return finish_txt + '8️⃣ шагов\n';
    case 7:
      return finish_txt + '7️⃣ шагов\n';
    case 6:
      return finish_txt + '6️⃣ шагов\n';
    case 5:
      return finish_txt + '5️⃣ шагов\n';
    case 4:
      return finish_txt + '4️⃣ шага\n';
    case 3:
      return finish_txt + '3️⃣ шага\n';
    case 2:
      return finish_txt + '2️⃣ шага\n';
    case 1:
      return finish_txt + '1️⃣ шаг\n';
    case 0:
      return '';
  }
}

export function getOffer(data: IBot) {
  const offer =
    `🔥${data.fields['Name']}🔥` +
    '\n' +
    data.fields['Описание'] +
    '\n' +
    '❌Цена на WB ~' +
    data.fields['Цена WB'] +
    '\n' +
    `❗️ Кешбэк ~ ${data.fields['Кешбэк']}❗️ \n` +
    `⭐️ Ваша цена ~ ${data.fields['Ваша цена']} 🫶 \n` +
    `✅ Для заказа присылайте скрин или ссылку на это объявление в ${TELEGRAM_BOT_NAME} !\n 
    Будем рады познакомиться🥰🥰🥰`;

  const medias = [];
  const countPhotos = data.fields['Фото'].length;
  for (let i = 0; i < data.fields['Фото'].length; i++) {
    medias.push({
      type: 'photo',
      media: data.fields['Фото'][i].url,
      caption: countPhotos - 1 === i ? offer : '',
    });
  }
  return medias;
}
