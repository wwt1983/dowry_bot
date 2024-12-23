import {
  FeedbackStatus,
  ISessionData,
  ITelegramWebApp,
} from './telegram.interface';
import { v4 as uuidv4 } from 'uuid';

import {
  FIRST_STEP_A,
  FIRST_STEP_C,
  SECOND_STEP,
  FOOTER,
  FIRST_STEP_LINK,
  STEPS,
  TELEGRAM_MESSAGE_CHAT_PROD,
  TELEGRAM_MESSAGE_CHAT_TEST,
  LIMIT_TIME_IN_MINUTES_FOR_ORDER,
  COUNT_TRY_ERROR,
  FIVE_STEP,
  SIX_STEP,
  LIMIT_TIME_IN_MINUTES_FOR_BUY,
  WEB_APP,
  STEP_EXAMPLE_TEXT_DOWN,
  STEP_EXAMPLE_TEXT_UP,
  FIRST_STEP_CART,
  SUBSCRIBE_CHAT_URL,
  FIRST_STEP_KEY_VALUE,
  STEP_TEXT_NUMBER_EMOJI,
  SEVEN_STEP,
  SIX_STEP_LINK,
  LIMIT_TIME_IN_MINUTES_FOR_ORDER_WITH_FILTER,
  LIMIT_TIME_IN_MINUTES_FOR_BUY_WITH_FILTER,
  CASH_STOP_WORDS,
  IGNORED_STATUSES,
  MESSAGE_WAITING,
} from './telegram.constants';
import { ChatMember, User } from '@grammyjs/types';
import {
  IOffer,
  IOffers,
  OfferDetails,
  OfferType,
} from 'src/airtable/types/IOffer.interface';
import {
  BotStatus,
  BrokeBotStatus,
  IBot,
  OldStatus,
} from 'src/airtable/types/IBot.interface';
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
  formatSimple,
} from 'src/common/date/date.methods';

import { IDistribution } from 'src/airtable/types/IDisturbation.interface';

export function sayHi(
  first_name: string,
  username: string,
  id: number,
): string {
  return (
    `\n\n\n\n\️Привет, ${first_name || username || 'друг'}!✌️\n` +
    `\nВаш номер для 💰 ${id}\n\n` +
    '👉 раздачи только для жителей России\n' +
    '👉 💰кешбэк будет выплачен только при соблюдении всех условий инструкции на 15-17 день или раньше (в зависимости от раздачи) на карты Сбербанк или Тинькофф😉\n' +
    '👉 ‼️ срок действия раздачи 1 месяц с момента заказа товара ‼️\n\n'
  );
}

/**
 * создаем сообшение для чата сообщений
 */
export function getTextToChatMessage(
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
    ? `\n${typeMessage} ${order}\n➡️chat_id=${chatId}\n\nСообщение:${comment}`
    : '';
  return `❓${getTimeWithTz(FORMAT_DATE_SIMPLE)}\n${userValue.fio} username=${userValue.userName} 
  ${userComment}${instruction}❓`;
}
/**
 * текст комментария (со статусом отвечен или вопрос)
 */
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
  startTime?: string,
): ISessionData {
  return {
    sessionId: uuidv4(),
    user: user,
    chat_id: id || null,
    startTime: startTime || getTimeWithTz(),
    stopBuyTime: null,
    stopTime: null,
    step: getNumberStepByStatus('В боте'),
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
    recivingDate: null,
    conversation: null,
    lastCommand: null,
    times: null,
    isRestore: false,
    itsSubscriber: false,
    userOffers: null,
    dataForCash: null,
    price: null,
    realStatus: null,
    checkWb: null,
    timeOfEntry: getTimeWithTz(),
    checkParseImages: [],
    messageId: null,
    detailsOffer: null,
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
      filter: data?.data?.filter,
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
    recivingDate: data.recivingDate,
    isFinish: false,
    location: null,
    comment: null,
    countTryError: 0,
    isRestore: true,
    price: data.price,
    realStatus: data.realStatus,
    checkWb: data.checkWb,
    dataForCash: data.dataForCash,
    imgCart: data.imgCart,
    imgGood: data.imgGood,
    imgRecieved: data.imgRecieved,
    imgOrder: data.imgOrder,
    imgSearch: data.imgSearch,
    imgShtrihCode: data.imgShtrihCode,
    timeOfEntry: data.timeOfEntry,
    checkParseImages: data.checkParseImages,
    messageId: data?.messageId,
    detailsOffer: data?.detailsOffer,
  };
}
export function updateSessionByField(
  session: ISessionData,
  field: string,
  data: any,
): ISessionData {
  session[field] = data;
  return session;
}
/**
 * обноляем в сессии поля в зависимости от шага (без перехода к следующему шагу)
 */
export function updateSessionByStep(
  session: ISessionData,
  data?: string,
  isPhotoMsg?: boolean,
): ISessionData {
  const { status } = session;

  switch (status) {
    case 'В боте':
      break;
    case 'Проблема с артикулом':
    case 'Артикул правильный':
      session.stopTime = getTimeWithTz();
      break;
    case 'Выбор раздачи':
      session.stopTime = getTimeWithTz();
      break;
    case 'Поиск':
      session.status = status;
      session.imgSearch = data;
      session.stopTime = getTimeWithTz();
      break;
    case 'Корзина':
      session.status = status;
      session.imgCart = data;
      session.stopTime = getTimeWithTz();
      break;
    case 'Заказ':
      session.stopBuyTime = getTimeWithTz();
      session.stopTime = getTimeWithTz();
      session.imgOrder = data;
      session.status = status;
      break;
    case 'Дата доставки':
      session.stopTime = getTimeWithTz();
      session.status = status;
      break;
    case 'Получен':
      session.stopTime = getTimeWithTz();
      session.status = status;
      session.imgRecieved = data;
      break;

    case 'Дата получения':
      session.stopTime = getTimeWithTz();
      session.status = status;
      break;
    case 'Отзыв на проверке':
      // case STEPS.Отзыв.step:
      //   //session.status = 'Отзыв';
      //   //session.stopTime = getTimeWithTz();
      //   session.step = STEPS['Штрих-код'].step;
      // //break;
      session.stopTime = getTimeWithTz();
      session.status = status;
      break;
    case 'Штрих-код':
      session.stopTime = getTimeWithTz();
      session.status = status;
      session.imgShtrihCode = data;
      break;
    case 'Товар':
      session.stopTime = getTimeWithTz();
      session.status = status;
      session.imgGood = data;
      break;
    case 'Чек':
      session.stopTime = getTimeWithTz();
      session.status = status;
      break;
    case 'ЧекWb':
      session.checkWb = data;
      session.stopTime = getTimeWithTz();
      session.status = status;
      break;
    case 'Чек неверный':
      session.stopTime = getTimeWithTz();
      session.status = status;
      break;
    case 'Цена':
      session.stopTime = getTimeWithTz();
      session.status = status;
      break;
    case 'Финиш':
      session.stopTime = getTimeWithTz();
      session.isFinish = true;
      session.dataForCash = data;
    default:
      break;
  }

  if (isPhotoMsg && session.status !== 'ЧекWb') {
    session.images = !session.images ? [data] : [...session.images, data];
    session.lastLoadImage = data;
  }

  // if (step !== STEPS['Дата доставки'].step) {
  //   session = nextStep(session);
  // }
  return session;
}

export function getNextStepStatusByNumber(
  currentStep: number,
  onlyActive: boolean,
): BotStatus {
  try {
    let nextNumberStepsAll;
    if (!onlyActive) {
      nextNumberStepsAll = Object.values(STEPS).filter((x) => x.step === 0);
    } else {
      nextNumberStepsAll = Object.values(STEPS).filter(
        (x) => x.isActive && x.step === 0,
      );
    }
    return nextNumberStepsAll[currentStep].value as BotStatus;
  } catch (error) {
    console.log('getNextStepStatusByNumber=', currentStep, error);
  }
}

/**
 * ищем следующий шаг и обновляем поля step и status
 */
export function nextStep(
  session: ISessionData,
  onlyActive: boolean,
): ISessionData {
  if (session.status === 'Проблема с артикулом' || session.isFinish)
    return session;
  session.status = getNextStepStatusByNumber(session.step, onlyActive);
  session.step = session.step + 1;

  return session;
}

export function getTextForFirstStep(data: ITelegramWebApp) {
  const {
    title,
    keys,
    cash,
    priceWb,
    priceForYou,
    location,
    image,
    filter,
    description,
    mpstats,
  } = data;
  const useFilterForHelpSearch = filter
    ? `Попробуйте найти товар используя фильтр 👉: ${filter.toUpperCase()} \n`
    : '';

  const avgPos = mpstats
    ? `\n👉Средняя позиция в wildberries (зависит от региона): от 1 до ${mpstats}. Может помочь🕵️\n`
    : '';
  function getText(keys: string) {
    if (keys && keys !== '' && keys !== 'undefined') {
      return (
        FIRST_STEP_KEY_VALUE +
        `\n🔎 ${keys.toUpperCase()}\n` +
        useFilterForHelpSearch +
        avgPos +
        `\n👉${FIRST_STEP_LINK}` +
        //FIRST_STEP_A +
        (location ? `❗️Раздача только для региона: ${location}❗️\n` : '')
      );
    } else {
      return `‼️${MESSAGE_WAITING}\nКлючевое слово для поиска и время начала раздачи вам придет отдельным сообщением, если кто-то перед вами не успеет оформить или добавят новые предложения‼️`;
    }
  }

  const caption =
    `${title}` +
    '\n\n' +
    '❌Цена на WB ~' +
    priceWb +
    ' ₽ (это примерная цена, зависит от вашей скидки)' +
    '\n' +
    (cash ? `❗️ Кешбэк ~ ${cash}❗️ \n` : '') +
    `⭐️ Ваша цена ~ ${priceForYou} ₽ 🫶 \n` +
    getCountDetailsTextAboutOffer(
      data.offerCount,
      data.offerOrderToday,
      data.queueLength,
    ) +
    description +
    '\n' +
    getText(keys);
  return [
    {
      type: 'photo',
      media: image,
      caption: caption,
    },
  ];
}
/**
 * скрин как поделиться ссылкой с вайлдбериз
 */
export const getPhotoForArticulLink = (url?: string, caption?: string) => {
  return [
    {
      type: 'photo',
      media: url || WEB_APP + STEPS['Артикул правильный'].image,
      caption: caption || STEP_EXAMPLE_TEXT_UP,
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
  status: BotStatus,
  startTime: string,
  name: string,
  detailsOffer: OfferDetails,
): string {
  switch (status) {
    case 'Выбор раздачи':
      return FIRST_STEP_LINK;
    case 'Проблема с артикулом':
    case 'Артикул правильный':
      return FIRST_STEP_LINK + getNumberText('Артикул правильный', null, name);
    case 'Поиск':
      return FIRST_STEP_A + getNumberText('Поиск', null, name);
    case 'Корзина':
      return FIRST_STEP_CART + getNumberText('Корзина', null, name);
    case 'Заказ':
      return FIRST_STEP_C + getNumberText('Заказ', null, name);
    case 'Дата доставки':
      return 'Введите ориентировочную дату доставки (в формате 12.12.2024) 🗓️';
    case 'Получен':
      return SECOND_STEP + getNumberText('Получен', null, name);
    case 'Дата получения':
      return 'Введите дату получения (в формате 12.12.2024) 🗓️';
    // case STEPS['Отзыв на проверке'].step:
    // //return THREE_STEP + getNumberText(step, null, name);
    // case STEPS.Отзыв.step:
    // //   return (
    // //     FOUR_STEP + FOUR_STEP_A + FOUR_STEP_B + getNumberText(step, null, name)
    // //   );
    case 'Штрих-код':
      return FIVE_STEP + getNumberText('Штрих-код', null, name);
    case 'Товар':
      return SEVEN_STEP + getNumberText('Товар', null, name);
    case 'Чек неверный':
    case 'ЧекWb':
      return SIX_STEP_LINK + getNumberText('ЧекWb', null, name);
    case 'Чек':
      return SIX_STEP + getNumberText('Чек', null, name);
    case 'Цена':
      return 'Напишите цену 💰, которую вы заплатили на wildberries за этот товар 👇';
    case 'Финиш':
      return (
        extractInfoAfterPaymentDate(detailsOffer?.dayOfCash) +
        FOOTER +
        '💰Напишите данные для перевода вам кешбэка💰.\n' +
        'Банк, ФИО, телефон.\nНапример, Тинькофф, Балалайкина Лира Рояльевна, 89002716500)\nЖдите поступлений😉'
      );
    default:
      return '';
  }
}

function getNumberText(statusName: BotStatus, startTime: string, name: string) {
  const textOffer = `\n→ ${name}\n\n`;
  const finish_txt = `До финиша `;
  const minutes = startTime
    ? LIMIT_TIME_IN_MINUTES_FOR_BUY - getDifferenceInMinutes(startTime)
    : null;
  const waitTime = minutes ? `(осталось ${minutes} мин. для заказа)` : '';
  const step = getNumberStepByStatus(statusName);
  return (
    (finish_txt + STEP_TEXT_NUMBER_EMOJI(step) + statusName === 'Заказ'
      ? ` ${waitTime}\n`
      : '') + textOffer
  );
}

export function getOffer(data: IOffer) {
  const defaultLink =
    '✅ Для заказа присылайте скрин или ссылку на это объявление !\n';
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
    `${!data.fields.Переход || data.fields.Переход?.includes('Чат') ? defaultLink : ''} ` +
    `Будем рады познакомиться🥰🥰🥰 \n`;

  const medias = [];
  const countPhotos = data.fields['Фото'].length;
  for (let i = 0; i < data.fields['Фото'].length; i++) {
    medias.push({
      type: 'photo',
      media: data.fields['Фото'][i].thumbnails.full.url,
      caption: countPhotos - 1 === i ? offer : '',
    });
  }
  return medias;
}

export const getLinkForOffer = (data: IOffer) => {
  const link = `✅ Для заказа <a href='${data.fields.Ссылка}'>перейдите в бот</a>\n`;
  return data.fields.Переход?.includes('Бот') ? link : null;
};

export const parseUrl = (url: string, articul: string): boolean => {
  if (!url || !articul) return false;

  if (url.trim() === articul.trim()) return true;

  if (!url) return false;
  return url.indexOf(articul.trim()) > 0;
};

export const parseCheckUrl = (url: string): boolean => {
  if (!url) return false;
  if (url.includes('receipt.wb')) return true;
  return false;
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

export const getAdminChatId = () => {
  return process.env.NODE_ENV === 'development'
    ? TELEGRAM_MESSAGE_CHAT_TEST
    : TELEGRAM_MESSAGE_CHAT_PROD;
};

export const getNotificationValue = (
  notifications: INotifications,
  statisticNotifications: INotificationStatistics,
  status: BotStatus,
  startTime: string,
  filter: string,
) => {
  let nextStatusNotification: BotStatus;
  switch (status) {
    case 'Выбор раздачи':
    case 'Проблема с артикулом':
      const minutesForChoose =
        getDifferenceInMinutes(startTime) -
        (filter
          ? LIMIT_TIME_IN_MINUTES_FOR_ORDER_WITH_FILTER
          : LIMIT_TIME_IN_MINUTES_FOR_ORDER);
      if (minutesForChoose > 0) {
        nextStatusNotification = 'Время истекло';
        break;
      }
      if (status === 'Проблема с артикулом') status = 'Выбор раздачи';

    case 'Поиск':
    case 'Корзина':
    case 'Артикул правильный':
      const minutes =
        getDifferenceInMinutes(startTime) -
        (filter
          ? LIMIT_TIME_IN_MINUTES_FOR_BUY_WITH_FILTER
          : LIMIT_TIME_IN_MINUTES_FOR_BUY);

      if (minutes > 0) {
        nextStatusNotification = 'Время истекло';
        break;
      }
    default:
      nextStatusNotification = getNextStepStatusByNumber(
        getNumberStepByStatus(status),
        true,
      );
  }

  return filterNotificationValue(
    notifications,
    statisticNotifications,
    nextStatusNotification,
  );
};

export const filterNotificationValue = (
  notifications: INotifications,
  statisticNotifications: INotificationStatistics,
  status: BotStatus,
) => {
  let notification = null;
  let statistic = null;
  try {
    notification = notifications?.records.find(
      (x) => x.fields.Название === status,
    );
    statistic =
      statisticNotifications?.records.length === 0
        ? null
        : statisticNotifications?.records.find(
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
    case 'Корзина':
    case 'Поиск':
    case 'Артикул правильный':
      const minutes =
        status === 'Проблема с артикулом'
          ? getDifferenceInMinutes(startTime) - LIMIT_TIME_IN_MINUTES_FOR_BUY
          : getDifferenceInMinutes(startTime) - LIMIT_TIME_IN_MINUTES_FOR_ORDER;
      console.log('scheduleNotification minutes=', status, startTime, minutes);

      return minutes > -15;
    case 'Заказ':
    case 'Дата доставки':
      if (countSendNotification === 0) {
        return dateDelivery ? days === 1 : days > 6;
      } else {
        return days > 2 && days < 4;
      }
    case 'Получен':
    case 'Штрих-код':
    case 'ЧекWb':
    case 'Товар':
      return days === 1;
    default:
      return false;
  }
};

export const getTextForArticulError = (
  positionOnWB: string,
  countTryError: number,
  status: BrokeBotStatus,
  filter?: string,
) => {
  const helpText =
    positionOnWB && countTryError <= COUNT_TRY_ERROR
      ? `\nЭта позиция находится примерно на ${positionOnWB} странице.`
      : '';
  if (countTryError <= COUNT_TRY_ERROR) {
    let filterText = '';
    if (countTryError === COUNT_TRY_ERROR - 1) {
      filterText = filter
        ? '\nПопробуйте найти товар по фильтру: 👉' + filter.toUpperCase()
        : '';
    }
    return (
      'Артикулы не совпадают🥹. Проверьте, пожалуйста, правильно ли вы нашли товар. Проверьте фото товара, цену.' +
      helpText +
      filterText
    );
  }

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

export const getNumberStepByStatus = (stepName: BotStatus): number | null => {
  let filteredSteps;
  if (Object.values(STEPS).find((x) => x.value === stepName && x.isActive)) {
    filteredSteps = Object.values(STEPS)
      .filter((x) => x.step === 0 && x.isActive)
      .map((x) => x.value);
  } else {
    filteredSteps = Object.values(STEPS)
      .filter((x) => x.step === 0)
      .map((x) => x.value);
  }
  const index = filteredSteps.indexOf(stepName);

  if (index !== -1) {
    return index + 1;
  } else {
    return -1;
  }
};
/**
 * проверяем соответстует ли название шага типу (например шаг Корзина - тип image)
 */
export const checkTypeStepByName = (
  stepName: BotStatus,
  type: 'image' | 'text',
) => {
  try {
    return Object.values(STEPS)
      .find((x) => x.value === stepName)
      .typeStep.includes(type);
  } catch (error) {
    console.log('checkTypeStepByName error=', error);
    return false;
  }
};

export const getErrorTextByStep = (
  statusName: BotStatus,
): { error: string; url?: string } | null => {
  const stepInfo = getStepInfoByNumber(statusName);
  if (!stepInfo) return null;
  return {
    error:
      stepInfo.erroText +
      (STEPS[stepInfo.value]?.image ? STEP_EXAMPLE_TEXT_DOWN : ''),
    url: STEPS[stepInfo.value]?.image
      ? WEB_APP + STEPS[stepInfo.value]?.image
      : null,
  };
};
export const getStepInfoByNumber = (statusName: BotStatus) => {
  if (!statusName) return null;
  return Object.values(STEPS).find((x) => x.value === statusName);
};
/**
 последняя сессия
 */
export const getLastSession = (dataBuyer: IBot[] | null) => {
  if (!dataBuyer) return null;

  const filterData = dataBuyer.filter(
    (x) =>
      !IGNORED_STATUSES.includes(x.fields.Статус) &&
      !x.fields.Финиш &&
      x.fields.Статус !== 'В боте',
  );

  if (!filterData || filterData.length === 0) return null;
  if (filterData.length === 1) return filterData[0].fields.SessionId;
  return filterData.sort(
    (a, b) =>
      getDifferenceInMinutes(a.fields.StopTime) -
      getDifferenceInMinutes(b.fields.StopTime),
  )[0].fields.SessionId;
};

/**
 * поиск раздач, у которых поле Финиш отмечено
 */
export const getUserOfferIdsIsFinsih = (data: IBot[]) => {
  return data?.map((x) => {
    if (
      x.fields.Финиш &&
      x.fields?.OfferId?.length &&
      x.fields?.OfferId?.length > 0
    ) {
      return x.fields.OfferId[0];
    }
  });
};

export const getTextForSubscriber = (info: ChatMember) => {
  const defaultResult = {
    text: `✉️ Подпишись в группу DOWRY раздачи для получения скидок (до 100% кешбэка) и выгодных предложений (вход только по приглашению).<a href='${SUBSCRIBE_CHAT_URL}'> Для вступления напишите нам.</a>`,
    status: false,
  };
  if (!info) return defaultResult;
  if (
    info.status === 'member' ||
    info.status === 'administrator' ||
    info.status === 'creator'
  ) {
    return {
      text: `✅ Не пропустите лучшие предложения в нашей группе <a href='${SUBSCRIBE_CHAT_URL}'>DOWRY раздачи</a>`,
      status: true,
    };
  }
  return defaultResult;
};
/**
 * Завершенные раздачи
 */
export const getUserOffersReady = (dataBuyer: IBot[]) => {
  if (!dataBuyer) return null;
  return dataBuyer.reduce(function (data, record) {
    if (record.fields.Финиш) {
      return (data += `✔️ ${removeEmojis(record.fields.Раздача)} 
      (кешбэк💰: ${record.fields['Статус кеша'].toLowerCase()})\n`);
    }
    return data;
  }, '');
};

export const getUserBenefit = (
  userOffers: IOffers,
  sumFromDistributions: number,
): { text: string; sum: number } => {
  try {
    if (
      (!userOffers ||
        !userOffers.records ||
        userOffers?.records?.length === 0) &&
      sumFromDistributions == 0
    ) {
      return { text: 'Начни копить 💰 на покупках', sum: 0 };
    }

    const benefit = userOffers?.records?.reduce(function (sum, record) {
      return (sum +=
        parseInt(record.fields['Цена WB']) -
        parseInt(record.fields['Ваша цена']));
    }, 0);
    return {
      text: `Ваша общая выгода 💰: ${benefit + sumFromDistributions} руб.`,
      sum: benefit + sumFromDistributions,
    };
  } catch (e) {
    console.log(e, userOffers, sumFromDistributions);
    return { text: 'Начни копить 💰 на покупках', sum: 0 };
  }
};

export const itsSubscriber = (member?: ChatMember) => {
  if (!member) return false;
  return (
    member.status === 'administrator' ||
    member.status === 'creator' ||
    member.status === 'member'
  );
};

export const getFilterDistribution = (
  dataDistributions: IDistribution[],
  dataBuyer: IBot[],
) => {
  const filterDistributionData = dataDistributions?.reduce(function (
    arr,
    record,
  ) {
    if (
      !dataBuyer ||
      dataBuyer.length === 0 ||
      !dataBuyer?.find(
        (x) => x.fields?.Артикул == record.fields['Артикул WB'][0].toString(),
      )
    ) {
      arr.push({
        name: record.fields.Раздача,
        sum: record.fields['Выплаченный кешбек'],
        date: record.fields['Дата заказа'],
      });
      return arr;
    }
  }, []);
  const sum =
    filterDistributionData?.reduce((accumulator, record) => {
      return accumulator + record.sum;
    }, 0) || 0;
  const offers =
    filterDistributionData?.reduce((accumulator, record) => {
      return (accumulator += `✔️ ${record.name}\n`);
    }, '') || '';
  return { sum, offers };
};

/**
 * выбираем только заказы с возможностью дальнейшего продолжения
 */
export const getOffersByUser = (dataBuyer: IBot[]) => {
  try {
    if (!dataBuyer || dataBuyer.length === 0) return null;
    return dataBuyer
      ?.filter(
        (x) =>
          !IGNORED_STATUSES.includes(x.fields.Статус) &&
          x.fields.Статус !== 'В боте',
      )
      ?.map((x) => x.fields.OfferId?.[0] ?? null)
      .filter((id) => id !== null); // отфильтровать null значения
  } catch (error) {
    console.log('getOffersByUser=', error);
    return null;
  }
};

/**
проверка на существования заказа у пользователя (сейчас можно заказать одно предложение)  
 */
export const checkOnExistOfferByUserOrders = (
  orderId: string,
  offers?: string[],
): boolean => {
  if (!offers || !Array.isArray(offers)) return false;
  if (offers.find((x) => x === orderId)) return true;
  return false;
};

/**
 * Текст для отзыва пользователю
 */
export const getTextForFeedbackByStatus = (
  status: FeedbackStatus,
  date?: string,
) => {
  switch (status) {
    case 'Без фото':
      return `Здравствуйте 🤝. Спасибо. Отзыв 🔥. Опубликуйте его, пожалуйста, на wildberries ${date || ''} (${status.toLocaleLowerCase()})📵`;
    case 'Отложить отзыв':
      return 'Здравствуйте 🤝. Публикацию отзыва пока откладываем. Продолжайте работу в боте.';
    case 'С фото':
      return `Здравствуйте 🤝. Спасибо. Отзыв 🔥. Опубликуйте его, пожалуйста, на wildberries ${date || ''} (${status.toLocaleLowerCase()})📸`;
    case 'Только оценка':
      return 'Здравствуйте 🤝. Поставьте, пожалуйста, на wildberries просто оценку 5* без текста.';
    default:
      return 'Уточните дату публикации отзыва';
  }
};

export const getChatIdFormText = (text: string) => {
  if (!text) return null;

  const regex = /chat_id=(\d+)/;
  const match = text.match(regex);

  if (match) {
    const chatId = match[1];
    console.log(`Извлеченный chat_id: ${chatId}`);
    return chatId;
  } else {
    console.log('chat_id не найден');
    return null;
  }
};
/**
 * метод-заглушка для старых статусов или статусов с ошибками
 */
export const getCorrectStatus = (status: BotStatus | OldStatus) => {
  if (!status) return null;
  if (status === 'Вызов') return 'Отмена';

  if (status === 'Отзыв на проверке' || status === 'Отзыв') {
    return 'Штрих-код';
  }
  if (status === 'Чек неверный' || status === 'Чек') return 'ЧекWb';
  return status;
};

/**
 * раздачи со статусом 'Время истекло' или Отмена и тд
 */
export const getTimeoutArticles = (data: IBot[]) => {
  try {
    if (!data || !data?.length) return null;
    const result = data
      .filter(
        (x) =>
          IGNORED_STATUSES.includes(x.fields.Статус) &&
          x.fields.Раздача !== undefined,
      )
      ?.map((x) => '👉 ' + x.fields.Раздача)
      ?.join('\n');

    if (result) return '👵🏻Ваши устаревшие раздачи\n' + result;
    return result;
  } catch (error) {
    return null;
  }
};

/**
 * информацинный текст для истории покупок
 */
export const getTextForHistoryOrders = (
  sum: number,
  timeOutOrders?: string,
) => {
  if (sum === 0 && !timeOutOrders) return 'Вы пока ничего не купили 😢';
  if (sum > 0 && !timeOutOrders) return 'Все раздачи завершены ✌️';
  return timeOutOrders;
};

export const removeEmojis = (text: string) => {
  if (!text) return text;
  const regex = /[\u{1F525}]/gu;

  return text.replace(regex, '');
};

/**
 * проверяем это сообщение о кэше?
 */

export const itRequestWithCachQuestion = (message: string) =>
  CASH_STOP_WORDS.find((x) => message.includes(x));

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getTextForIntervalTime = (startTime) => {
  return (
    `‼️<b>Начало раздачи ${formatSimple(startTime)}</b> (время московское)‼️\n`.toUpperCase() +
    `\nЗаказ необходимо оформить в указанное время\n\n` +
    `<b>‼️Если время вашего выкупа в wildberries будет раньше, кэшбек 💰 выплачен не будет</b>‼️\n\n`.toUpperCase()
  );
};

export const checkOnStopStatus = (status: BotStatus) => {
  if (!status) return null;

  if (IGNORED_STATUSES.includes(status)) return true;
  return false;
};

/**
 * текст для переполненной раздачи
 */
export const getTextForQueue = (
  count: number,
  countOrderToday: number,
  queueLength: number,
) => {
  if (count < countOrderToday + queueLength) {
    return '\n' + MESSAGE_WAITING;
  }
  return '';
};
/**
 * ифно текст о раздачи о количестве заказов и очереди
 */
export const getCountDetailsTextAboutOffer = (
  count: number,
  countOrderToday: number,
  queueLength: number,
) => {
  const queInfo =
    queueLength && queueLength > 0
      ? `, ожидающих раздачу ${queueLength} чел.`
      : '';
  return `\n🔔 осталось ${count - countOrderToday} шт. ${queInfo}\n`;
};
/**
 * поиск свободных ключевых слов
 */
export function findFreeKeywords(
  arr1: { name: string; count: number }[],
  arr2: { name: string; count: number }[],
): string[] {
  const keywordMap1 = new Map<string, number>();
  const keywordMap2 = new Map<string, number>();

  // Заполняем первую карту ключевыми словами и их количеством
  arr1.forEach((keyword) => {
    keywordMap1.set(keyword.name, keyword.count);
  });

  // Заполняем вторую карту ключевыми словами и их количеством
  arr2?.forEach((keyword) => {
    keywordMap2.set(
      keyword.name,
      (keywordMap2.get(keyword.name) || 0) + keyword.count,
    );
  });

  // Ищем все свободные ключевые слова
  const freeKeywords: string[] = [];
  for (const [name, count1] of keywordMap1.entries()) {
    const count2 = keywordMap2.get(name) || 0;
    if (count1 > count2) {
      freeKeywords.push(name);
    }
  }

  // Возвращаем массив свободных ключевых слов
  return freeKeywords;
}

export function groupByOfferId(bots: IBot[]): Record<string, IBot[]> {
  if (!bots) return null;
  return bots.reduce(
    (acc, bot) => {
      bot.fields.OfferId.forEach((offerId) => {
        if (!acc[offerId]) {
          acc[offerId] = [];
        }
        acc[offerId].push(bot);
      });
      return acc;
    },
    {} as Record<string, IBot[]>,
  );
}

export function convertToKeyObjects(
  array: string[],
): { name: string; count: number }[] {
  const countMap = array.reduce(
    (acc, name) => {
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.keys(countMap).map((name) => ({
    name,
    count: countMap[name],
  }));
}

export function formatOfferDetails(offer: OfferDetails): string {
  return `
    кэш: ${offer?.cash || ''}
    ваша цена: ${offer?.priceForYou}
    тип раздачи: ${offer?.offerType}
    расширенность: ${offer?.extendedOfferType ? true : false}
    день кеша: ${offer?.dayOfCash}
  `;
}
export function parseOfferDetails(formattedString: string): OfferDetails {
  if (!formattedString) return null;

  const lines = formattedString.trim().split('\n');
  const offer: Partial<OfferDetails> = {};

  lines.forEach((line) => {
    const [key, value] = line.split(':').map((part) => part.trim());
    switch (key) {
      case 'кэш':
        offer.cash = value;
        break;
      case 'ваша цена':
        offer.priceForYou = value;
        break;
      case 'тип раздачи':
        offer.offerType = value as OfferType;
        break;
      case 'расширенность':
        offer.extendedOfferType = !value ? false : true;
        break;
      case 'день кеша':
        offer.dayOfCash = value;
        break;
    }
  });
  return offer as OfferDetails;
}
/**Функция для извлечения информации после "дата выплаты"
 */
export function extractInfoAfterPaymentDate(details: string) {
  if (details && !details.includes('15')) {
    return `👉 Получите кешбэк 💰 на карту Сбербанк или Тинькофф ${details.toLowerCase()}\n`;
  }
  return '👉 НА 15-17 ДЕНЬ ПОСЛЕ получения товара с ПВЗ получите кешбэк 💰 на карту Сбербанк или Тинькофф\n';
}
export function isBuyStatus(status: BotStatus) {
  if (status === 'Заказ') return true;

  const valuesBeforeOrder = [];

  for (const key in STEPS) {
    if (key === 'Заказ' || STEPS[key].step < 0) {
      break;
    }
    valuesBeforeOrder.push(STEPS[key].value);
  }
  if (!valuesBeforeOrder.includes(status)) return true;
  return false;
}
