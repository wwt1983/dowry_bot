import { ISessionData, ITelegramWebApp } from './telegram.interface';
import { v4 as uuidv4 } from 'uuid';

import {
  FIRST_STEP,
  FIRST_STEP_A,
  //FIRST_STEP_B,
  FIRST_STEP_C,
  SECOND_STEP,
  THREE_STEP,
  FOUR_STEP,
  FOUR_STEP_A,
  FOUR_STEP_B,
  FOOTER,
  TELEGRAM_BOT_NAME,
  FIRST_STEP_LINK,
  STEPS,
  TELEGRAM_MESSAGE_CHAT_PROD,
  TELEGRAM_MESSAGE_CHAT_TEST,
  LIMIT_TIME_IN_MINUTES_FOR_ORDER,
  COUNT_TRY_ERROR,
  FIVE_STEP,
  SIX_STEP,
  LIMIT_TIME_IN_MINUTES_FOR_BUY,
  STEP_ERROR_TEXT,
  WEB_APP,
  STEP_EXAMPLE_TEXT_DOWN,
  STEP_EXAMPLE_TEXT_UP,
  FIRST_STEP_CART,
} from './telegram.constants';
import { User } from '@grammyjs/types';
import { IOffer } from 'src/airtable/types/IOffer.interface';
import { BotStatus, BrokeBotStatus } from 'src/airtable/types/IBot.interface';
import { INotifications } from 'src/airtable/types/INotification.interface';
import { INotificationStatistics } from 'src/airtable/types/INotificationStatistic.interface';
import {
  FORMAT_DATE_SIMPLE,
  TIME_FULL,
  getDifferenceInDays,
  getDifferenceInMinutes,
  getTimeWithTz,
  dateFormatNoTZ,
  getDate,
} from 'src/common/date/date.methods';

export function sayHi(first_name: string, username: string): string {
  return `\n\n\n\n\️Привет, ${first_name || username}!✌️` + '\n\nВ путь ⤵\n';
}

export function sendToSecretChat(
  from: User,
  comment: string,
  order: string,
  chatId: string | number,
  name: string,
  status?: BotStatus,
) {
  const userValue = getUserName(from);
  const statusText = status ? ` (${status})` : '';
  const typeMessage = order
    ? `Раздача:${name} ${statusText}`
    : 'Вопрос от пользователя';
  const instruction =
    '\nВыберите комманду /message_send,cкопируйте chat_id и следуйте дальше';
  const userComment = comment
    ? `\n${typeMessage} ${order}\n➡️chat_id=${chatId}\nСообщение:${comment}`
    : '';
  return `❓Старт: ${getTimeWithTz()}\n${userValue.fio} username=${userValue.userName} 
  ${userComment}${instruction}❓`;
}
export const createCommentForDb = (comment: string, isAnswer?: boolean) => {
  if (!comment) return '';
  const emoji = isAnswer ? '✅' : '❓';
  return `${getTimeWithTz()}\n${emoji} ${comment}`;
};

export const getUserName = (from: User) => {
  const { first_name, last_name, username } = from;
  return {
    fio: `${first_name} ${last_name || ''}`,
    userName: `${username || ''}`,
  };
};

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
    step: STEPS['В боте'].step,
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
    deliveryDate: null,
    conversation: null,
    lastCommand: null,
    times: null,
  };
}

export function createContinueSessionData(
  data: ISessionData,
  articul: string,
  offer: string,
  key?: string,
): ISessionData {
  return {
    data: {
      offerId: data.offerId,
      title: offer,
      cash: null,
      priceForYou: null,
      priceWb: null,
      image: null,
      id: null,
      articul: articul,
      keys: key,
    },
    sessionId: data.sessionId,
    user: data.user,
    chat_id: data.chat_id,
    startTime: data.startTime,
    stopBuyTime: data.stopBuyTime,
    stopTime: data.stopTime,
    step: data.step,
    images: data.images,
    offerId: data.offerId,
    status: data.status,
    deliveryDate: data.deliveryDate,
    isFinish: false,
    location: null,
    comment: null,
    countTryError: 0,
  };
}
export function updateSessionByField(
  session: ISessionData,
  field: string,
  data: string | ITelegramWebApp,
): ISessionData {
  session[field] = data;
  return session;
}

export function updateSessionByStep(
  session: ISessionData,
  data?: string,
  isPhotoMsg?: boolean,
): ISessionData {
  const { step } = session;

  switch (step) {
    case STEPS['В боте'].step:
    case STEPS['Артикул правильный'].step:
      break;
    case STEPS['Выбор раздачи'].step:
      session.stopTime = getTimeWithTz();
      break;
    case STEPS.Поиск.step:
      session.status = 'Поиск';
      session.stopTime = getTimeWithTz();
      break;
    case STEPS.Корзина.step:
      session.status = 'Корзина';
      session.stopTime = getTimeWithTz();
      break;
    case STEPS.Заказ.step:
      session.stopBuyTime = getTimeWithTz();
      session.status = 'Заказ';
      break;
    case STEPS['Дата доставки'].step:
      session.status = 'Дата доставки';
      break;
    case STEPS.Получен.step:
      session.status = 'Получен';
      break;
    case STEPS['Отзыв на проверке'].step:
      session.comment = data;
      session.stopTime = getTimeWithTz();
      break;
    case STEPS.Отзыв.step:
      session.status = 'Отзыв';
      session.stopTime = getTimeWithTz();
      break;
    case STEPS['Штрих-код'].step:
      session.status = 'Штрих-код';
      session.stopTime = getTimeWithTz();
      break;
    case STEPS.Чек.step:
      session.stopTime = getTimeWithTz();
      session.status = 'Чек';
      session.isFinish = true;
      break;
    default:
      break;
  }

  if (isPhotoMsg) {
    session.images = !session.images ? [data] : [...session.images, data];
    session.lastLoadImage = data;
  }

  if (step !== STEPS['Дата доставки'].step) {
    session = nextStep(session);
  }

  return session;
}
export function nextStep(session: ISessionData): ISessionData {
  const nextCountStep = session.step + 1;
  session.step = nextCountStep;
  return session;
}

export function getTextForFirstStep(data: ITelegramWebApp) {
  const { title, keys, cash, priceWb, priceForYou, times, location, image } =
    data;
  const caption =
    `🔥${title}🔥` +
    '\n\n' +
    '❌Цена на WB ~' +
    priceWb +
    ' ₽' +
    '\n' +
    `❗️ Кешбэк ~ ${cash}❗️ \n` +
    `⭐️ Ваша цена ~ ${priceForYou} ₽ 🫶 \n` +
    '\n' +
    FIRST_STEP +
    '➡️ ' +
    keys +
    '\n\n' +
    getMessageForTimeOffer(times) +
    //FIRST_STEP_A +
    FIRST_STEP_LINK +
    (location ? `❗️Раздача только для региона: ${location}❗️\n` : '');

  return [
    {
      type: 'photo',
      media: image,
      caption: caption,
    },
  ];
}
export const createMediaForArticul = () => {
  return [
    {
      type: 'photo',
      media: WEB_APP + STEPS['Артикул правильный'].image,
      caption: STEP_EXAMPLE_TEXT_UP,
    },
  ];
};
export const getMessageForTimeOffer = (times: string[]) => {
  try {
    if (!times || !times.length || times.length === 0) return '';

    if (times[1] === TIME_FULL) {
      if (getDifferenceInDays(times[0]) <= 0) {
        return getDifferenceInMinutes(times[0]) >= 0
          ? ''
          : `❗️Начало раздачи ${dateFormatNoTZ(times[0], FORMAT_DATE_SIMPLE)}❗️\n\n`;
      } else {
        return 'Время раздачи истекло. Уточните новую раздачу у менеджера\n\n';
      }
    }
    return getDifferenceInMinutes(`${getDate()} ${times[0]}`) > 0
      ? ''
      : `❗️Начало раздачи в ${times[0]}❗️\n\n`;
  } catch (e) {
    console.log(e);
    return '';
  }
};

export function getTextByNextStep(
  step: number,
  startTime: string,
  name: string,
): string {
  switch (step) {
    case STEPS['Выбор раздачи'].step:
      return FIRST_STEP_LINK;
    case STEPS['Проблема с артикулом'].step:
    case STEPS['Артикул правильный'].step:
      return (
        FIRST_STEP_LINK +
        getNumberText(STEPS['Артикул правильный'].step, null, name)
      );
    case STEPS.Поиск.step:
      return FIRST_STEP_A + getNumberText(step, null, name);
    case STEPS.Корзина.step:
      return FIRST_STEP_CART + getNumberText(step, null, name);
    case STEPS.Заказ.step:
      return FIRST_STEP_C + getNumberText(step, null, name);
    case STEPS['Дата доставки'].step:
      return 'Введите ориентировочную дату доставки (в формате 12.12.2024) 🗓️';
    case STEPS.Получен.step:
      return SECOND_STEP + getNumberText(step, null, name);
    case STEPS['Отзыв на проверке'].step:
      return THREE_STEP + getNumberText(step, null, name);
    case STEPS.Отзыв.step:
      return (
        FOUR_STEP + FOUR_STEP_A + FOUR_STEP_B + getNumberText(step, null, name)
      );
    case STEPS['Штрих-код'].step:
      return FIVE_STEP + getNumberText(step, null, name);
    case STEPS.Чек.step:
      return SIX_STEP + getNumberText(step, null, name);
    default:
      return FOOTER;
  }
}

function getNumberText(step: number, startTime: string, name: string) {
  const textOffer = `\n→ ${name}\n\n`;
  const finish_txt = `До финиша `;
  const minutes = startTime
    ? LIMIT_TIME_IN_MINUTES_FOR_BUY - getDifferenceInMinutes(startTime)
    : null;
  const waitTime = minutes ? `(осталось ${minutes} мин. для заказа)` : '';
  const stepValues = Object.values(STEPS);
  for (let i = 0; i < stepValues.length; i++) {
    if (step === stepValues[i].step) {
      return (
        finish_txt +
        stepValues[i].textStepCount +
        (stepValues[i].value === 'Заказ' ? ` ${waitTime}\n` : '') +
        textOffer
      );
    }
  }
  return '';
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
    `✅ Для заказа присылайте скрин или ссылку на это объявлениеdf в ${TELEGRAM_BOT_NAME} !\n 
     Перейти к предложению https://t.me/${TELEGRAM_BOT_NAME.replace('@', '')}?start=${data.id || 'recjUwNqL4v2jUm4F'} \n
    Будем рады познакомиться🥰🥰🥰 \n
   `;

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
    let splitUrl = url.trim().split('https://wildberries.ru/catalog/')[1];
    splitUrl = splitUrl.trim().split('detail.aspx')[0];

    const articulOnCheck = splitUrl.replace(/\D/g, '');

    return articul.trim() == articulOnCheck.trim();
  } catch (e) {
    return false;
  }
};

export const locationCheck = (
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
) => {
  let nextStatusNotification: BotStatus;
  switch (status) {
    case 'Выбор раздачи':
    case 'Артикул правильный':
    case 'Проблема с артикулом':
    case 'Поиск':
      const minutes =
        status === 'Артикул правильный' || status === 'Проблема с артикулом'
          ? getDifferenceInMinutes(getDate()) - LIMIT_TIME_IN_MINUTES_FOR_BUY
          : getDifferenceInMinutes(startTime) - LIMIT_TIME_IN_MINUTES_FOR_ORDER;

      console.log('getNotificationValue minutes=', status, startTime, minutes);

      if (minutes > 0) {
        nextStatusNotification = 'Время истекло';
      } else {
        nextStatusNotification = status === 'Поиск' ? 'Заказ' : 'Поиск';
      }
      break;
    case 'Заказ':
      nextStatusNotification = 'Получен';
      break;
    case 'Получен':
      nextStatusNotification = 'Отзыв';
      break;
    case 'Отзыв':
    case 'Отзыв на проверке':
      nextStatusNotification = 'Штрих-код';
      break;
    case 'Штрих-код':
      nextStatusNotification = 'Чек';
      break;
  }
  return filterNotificationValue(
    notifications,
    statisticNotifications,
    nextStatusNotification,
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
            (x) =>
              x.fields.Шаблон &&
              x.fields.Шаблон.length &&
              x.fields.Шаблон[0] === notification.fields.Id,
          );
  } catch (e) {
    console.log('filterNotificationValue', e, status, statisticNotifications);
  } finally {
    return { notification, statistic, status };
  }
};

export const scheduleNotification = (
  status: BotStatus,
  stopTime: string,
  startTime: string,
  countSendNotification: number,
  dateDelivery: string,
) => {
  const days = getDifferenceInDays(dateDelivery || stopTime);

  switch (status) {
    case 'Выбор раздачи':
    case 'Артикул правильный':
    case 'Проблема с артикулом':
    case 'Вызов':
    case 'Поиск':
      const minutes =
        status === 'Артикул правильный' || status === 'Проблема с артикулом'
          ? getDifferenceInMinutes(getDate()) - LIMIT_TIME_IN_MINUTES_FOR_BUY
          : getDifferenceInMinutes(startTime) - LIMIT_TIME_IN_MINUTES_FOR_ORDER;
      console.log('scheduleNotification minutes=', status, startTime, minutes);

      return minutes > -40;
    case 'Заказ':
      if (countSendNotification === 0) {
        return dateDelivery ? days === 1 : days > 6;
      } else {
        return days > 2 && days < 4;
      }
    case 'Получен':
    case 'Отзыв':
    case 'Отзыв на проверке':
    case 'Штрих-код':
    case 'Чек':
      return days === 1;
    default:
      return false;
  }
};

export const getTextForArticleError = (
  positionOnWB: string,
  countTryError: number,
  status: BrokeBotStatus,
) => {
  const helpText =
    positionOnWB && countTryError <= COUNT_TRY_ERROR
      ? `\nЭта позиция находится примерно на ${positionOnWB} странице.`
      : '';
  if (countTryError <= COUNT_TRY_ERROR)
    return (
      'Артикулы не совпадают. Проверьте, пожалуйста, правильно ли вы нашли товар' +
      helpText
    );

  switch (status) {
    case 'operator':
      return 'Попробуйте снова или ожидайте ответа оператора👩‍💻';
    case 'wait':
    case 'check_articul':
      return 'Артикулы не совпадают. Попробуйте снова или нажмите кнопку "Помощь оператора" ⤵️';
    default:
      return status;
  }
};

export const getArticulErrorStatus = (
  errorStatus: BrokeBotStatus,
): BrokeBotStatus => {
  switch (errorStatus) {
    case 'operator':
      return 'wait';
    default:
      return 'wait';
  }
};

export const getErrorTextByStep = (
  step: number,
): { error: string; url?: string } | null => {
  const stepType = Object.values(STEPS).find((x) => x.step === step);
  if (!stepType) return null;
  return {
    error:
      STEP_ERROR_TEXT +
      stepType.erroText +
      (STEPS[stepType.value]?.image ? STEP_EXAMPLE_TEXT_DOWN : ''),
    url: STEPS[stepType.value]?.image
      ? WEB_APP + STEPS[stepType.value]?.image
      : null,
  };
};
