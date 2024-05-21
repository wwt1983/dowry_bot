import { ISessionData, ITelegramWebApp } from './telegram.interface';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
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
  FIRST_STEP_LINK,
  STEPS,
} from './telegram.constants';
import { User } from '@grammyjs/types';
import { IOffer } from 'src/airtable/types/IOffer.interface';

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

const FORMAT_DATE = 'yyyy-MM-dd HH:mm';
export const getTimeWithTz = () =>
  formatInTimeZone(new Date(), 'Europe/Moscow', FORMAT_DATE);

export function createInitialSessionData(
  id?: string,
  user?: string,
): ISessionData {
  return {
    sessionId: uuidv4(),
    user: user,
    chat_id: id || null,
    startTime: getTimeWithTz(),
    stopBuyTime: null,
    stopTime: null,
    isLoadImageSearch: false,
    isLoadImageGiveGood: false,
    isLoadImageOnComment: false,
    isLoadImageBrokeCode: false,
    isLoadImageCheck: false,
    isLoadImageOrderWithPVZ: false,
    step: STEPS.INBOT,
    comment: '',
    images: [],
    lastLoadImage: null,
    lastMessage: null,
    isFinish: false,
    offerId: null,
    status: 'В боте',
    location: null,
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

  console.log('UPDATE SESSION STEP=', step);

  switch (step) {
    case STEPS.INBOT:
    case STEPS.CHOOSE_OFFER:
    case STEPS.CHECK_ARTICUL:
      break;
    case STEPS.SEARCH:
      session.isLoadImageSearch = true;
      session.status = 'Поиск';
      break;
    case STEPS.ORDER:
      session.isLoadImageOrderWithPVZ = true;
      session.stopBuyTime = getTimeWithTz();
      session.status = 'Заказ';
      break;
    case STEPS.RECEIVED:
      session.isLoadImageGiveGood = true;
      session.status = 'Получен';
      break;
    case STEPS.COMMENT_ON_CHECK:
      session.comment = data;
      break;
    case STEPS.COMMENT:
      session.isLoadImageOnComment = true;
      session.status = 'Отзыв';
      break;
    case STEPS.SHTRIH_CODE:
      session.isLoadImageBrokeCode = true;
      session.status = 'Штрих-код';
      break;
    case STEPS.CHECK:
      session.isLoadImageCheck = true;
      session.stopTime = getTimeWithTz();
      session.status = 'Чек';
      session.isFinish = true;
      break;
    default:
      break;
  }

  if (isPhotoMsg) {
    session.images = [...session.images, data];
    session.lastLoadImage = data;
  }

  session = nextStep(session);

  return session;
}
export function nextStep(session: ISessionData): ISessionData {
  session.step = session.step + 1;
  return session;
}

export function getTextForFirstStep(data: ITelegramWebApp) {
  const { title, keys, cash, priceWb, description, priceForYou } = data;
  const caption =
    `🔥${title}🔥` +
    '\n' +
    description +
    '\n' +
    '❌Цена на WB ~' +
    priceWb +
    ' ₽' +
    '\n' +
    `❗️ Кешбэк ~ ${cash}❗️ \n` +
    `⭐️ Ваша цена ~ ${priceForYou} ₽ 🫶 \n` +
    '\n\n' +
    HEADER +
    FIRST_STEP +
    keys +
    '\n\n' +
    FIRST_STEP_LINK +
    //FIRST_STEP_A +
    (data.location ? `❗️Раздача только для региона: ${data.location}❗️\n` : '');
  return [
    {
      type: 'photo',
      media: data.image,
      caption: caption,
    },
  ];
}

export function getTextByNextStep(step: number): string {
  switch (step) {
    case STEPS.CHOOSE_OFFER:
      return FIRST_STEP_LINK;
    case STEPS.SEARCH:
    case STEPS.CHECK_ARTICUL:
      return FIRST_STEP_A + FIRST_STEP_B + getNumberText(step);
    case STEPS.ORDER:
      return FIRST_STEP_C + getNumberText(step);
    case STEPS.RECEIVED:
      return SECOND_STEP + getNumberText(step);
    case STEPS.COMMENT_ON_CHECK:
      return THREE_STEP + getNumberText(step);
    case STEPS.COMMENT:
      return FOUR_STEP + THREE_STEP_A + getNumberText(step);
    case STEPS.SHTRIH_CODE:
      return FOUR_STEP_A + getNumberText(step);
    case STEPS.CHECK:
      return FOUR_STEP_B + getNumberText(step);
    default:
      return FOOTER;
  }
}

function getNumberText(step: number) {
  const finish_txt = `До финиша `;
  switch (step) {
    case STEPS.CHOOSE_OFFER:
      return finish_txt + '8️⃣ шагов\n';
    case STEPS.SEARCH:
      return finish_txt + '7️⃣ шагов\n';
    case STEPS.ORDER:
      return finish_txt + '6️⃣ шагов\n';
    case STEPS.RECEIVED:
      return finish_txt + '5️⃣ шагов\n';
    case STEPS.COMMENT_ON_CHECK:
      return finish_txt + '4️⃣ шага\n';
    case STEPS.COMMENT:
      return finish_txt + '3️⃣ шага\n';
    case STEPS.SHTRIH_CODE:
      return finish_txt + '2️⃣ шага\n';
    case STEPS.CHECK:
      return finish_txt + '1️⃣ шаг\n';
    case STEPS.INBOT:
      return '';
  }
}

export function getOffer(data: IOffer) {
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

export const parseUrl = (url: string, articul: string): boolean => {
  if (!url) return false;
  try {
    const articulOnCheck = url.trim().replace(/\D/g, '');
    return articul == articulOnCheck;
  } catch (e) {
    return false;
  }
};
