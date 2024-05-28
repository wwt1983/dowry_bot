import { ISessionData, ITelegramWebApp } from './telegram.interface';
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
  THREE_STEP_A,
  TELEGRAM_BOT_NAME,
  FIRST_STEP_LINK,
  STEPS,
  TELEGRAM_MESSAGE_CHAT_PROD,
  TELEGRAM_MESSAGE_CHAT_TEST,
  LIMIT_TIME_IN_MINUTES_FOR_ORDER,
} from './telegram.constants';
import { User } from '@grammyjs/types';
import { IOffer } from 'src/airtable/types/IOffer.interface';
import { BotStatus } from 'src/airtable/types/IBot.interface';
import { INotifications } from 'src/airtable/types/INotification.interface';
import { INotificationStatistics } from 'src/airtable/types/INotificationStatistic.interface';
import {
  getDifferenceInMinutes,
  getTimeWithTz,
} from 'src/common/date/date.methods';

export function sayHi(first_name: string, username: string): string {
  return (
    `Привет, ${first_name || username}! \n\n` + FIRST_STEP_B + 'В путь ⤵\n'
  );
}

export function createMsgToSecretChat(
  from: User,
  comment: string,
  order: string,
  chatId: string,
) {
  const { first_name, last_name, username } = from;
  // const commandForBot =
  //   botType === 'development'
  //     ? `/message=${chatId}@test_dowry_bot`
  //     : `/message=${chatId}@DowryWorkBot`;

  const instruction =
    '\nВыбирите комманду /message_send,cкопируйте chat_id и следуйте дальше по инструкции бота';
  const userComment = comment
    ? `\nРаздача:${order}\nchat_id=${chatId}\nСообщение:${comment}`
    : '';
  return `Старт: ${getTimeWithTz()}\n${first_name} ${last_name || ''} username=${username || ''} 
  ${userComment}${instruction}`;
}

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
    errorStatus: null,
    countTryError: 0,
    conversation: null,
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

  //console.log('UPDATE SESSION STEP=', step);
  switch (step) {
    case STEPS.INBOT:
    case STEPS.CHECK_ARTICUL:
      break;
    case STEPS.CHOOSE_OFFER:
      session.stopTime = getTimeWithTz();
      break;
    case STEPS.SEARCH:
      session.isLoadImageSearch = true;
      session.status = 'Поиск';
      session.stopTime = getTimeWithTz();
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
      session.stopTime = getTimeWithTz();
      break;
    case STEPS.COMMENT:
      session.isLoadImageOnComment = true;
      session.status = 'Отзыв';
      session.stopTime = getTimeWithTz();
      break;
    case STEPS.SHTRIH_CODE:
      session.isLoadImageBrokeCode = true;
      session.status = 'Штрих-код';
      session.stopTime = getTimeWithTz();
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
    const splitUrl = url.trim().split('?')[0];
    const articulOnCheck = splitUrl.replace(/\D/g, '');
    return articul == articulOnCheck;
  } catch (e) {
    return false;
  }
};

export const LocationCheck = (
  locationOffer: string,
  locationUser: string,
): { status: boolean; text: string } => {
  if (!locationUser) return { status: false, text: 'Локация не определена' };

  return locationUser.toLowerCase().includes(locationOffer.toLowerCase())
    ? { status: true, text: 'Спасибо за геолокацию! Продолжайте шаг 1️⃣' }
    : {
        status: false,
        text: `Ваше местоположение (${locationUser}) не позволяет участвовать в раздаче`,
      };
};

export const getSecretChatId = () => {
  return process.env.NODE_ENV === 'development'
    ? TELEGRAM_MESSAGE_CHAT_TEST
    : TELEGRAM_MESSAGE_CHAT_PROD;
};

export const getNotificationValue = (
  notifications: INotifications,
  statisticNotifications: INotificationStatistics,
  status: BotStatus,
  startTime: string,
  stopTime: string,
) => {
  let statusNotification: BotStatus;
  switch (status) {
    case 'Выбор раздачи':
    case 'Поиск':
      let minutes = 0;
      if (!stopTime) {
        minutes = getDifferenceInMinutes(startTime);
      } else {
        minutes = getDifferenceInMinutes(stopTime);
      }
      statusNotification =
        minutes < LIMIT_TIME_IN_MINUTES_FOR_ORDER ? 'Поиск' : 'Время истекло';
      console.log('minutes', minutes);
      break;
    case 'Заказ':
      statusNotification = 'Заказ';
      break;
    case 'Получен':
      statusNotification = 'Получен';
      break;
    case 'Отзыв':
      statusNotification = 'Отзыв';
      break;
    case 'Штрих-код':
      statusNotification = 'Штрих-код';
      break;
    case 'Чек':
      statusNotification = 'Чек';
      break;
  }
  return filterNotificationValue(
    notifications,
    statisticNotifications,
    statusNotification,
  );
};

const filterNotificationValue = (
  notifications: INotifications,
  statisticNotifications: INotificationStatistics,
  status: BotStatus,
) => {
  let notification = null;
  let statistic = null;

  try {
    notification = notifications.records.find(
      (x) => x.fields.Название === status,
    );
    statistic =
      statisticNotifications.records.length === 0
        ? null
        : statisticNotifications.records.find(
            (x) => x.fields.Шаблон[0] === notification.fields.Id,
          );
    return { notification, statistic };
  } catch (e) {
    console.log('filterNotificationValue', e);
  } finally {
    return { notification, statistic, status };
  }
};