export const TELEGRAM_MODULE_OPTIONS = Symbol('TELEGRAM_MODULE_OPTIONS');
export const TELEGRAM_BOT_ID = '6486222045';
export const TELEGRAM_BOT_NAME = '@DowryWorkBot';
export const TELEGRAM_CHAT_ID = '-1002002256034';
export const TELEGRAM_SECRET_CHAT_ID = '-1002155788141';
export const TELEGRAM_MESSAGE_CHAT_TEST = '-1002227889311';
export const TELEGRAM_MESSAGE_CHAT_PROD = '-4289825366';
export const TELEGRAM_API_URL = 'https://api.telegram.org/bot';
export const TELEGRAM_BOT_URL = 'https://t.me/@DowryWorkBot';
export const FILE_FROM_BOT_URL = 'https://api.telegram.org/file/bot';
export const WEB_APP = 'https://dowrybot-front.vercel.app';
export const WEB_APP_TEST = 'https://dowry-bot.netlify.app/';
export const STOP_TEXT = 'Раздачу продолжать нельзя';
export const LIMIT_TIME_IN_MINUTES_FOR_ORDER = 30;

export enum COMMAND_NAMES {
  start = 'start',
  help = 'help',
  history = 'history',
  call = 'call',
  messageSend = 'message_send',
}

export const COMMANDS_TELEGRAM = [
  { command: COMMAND_NAMES.start, description: 'Запуск бота' },
  { command: COMMAND_NAMES.help, description: 'Помощь' },
  { command: COMMAND_NAMES.history, description: 'Ваша история' },
  { command: COMMAND_NAMES.call, description: 'Написать оператору' },
];

export const ADMIN_COMMANDS_TELEGRAM = [
  {
    command: COMMAND_NAMES.messageSend,
    description: 'Отправить сообщение пользователю',
  },
];

export enum STEP_COMMANDS {
  del = 'Изменить',
  next = 'Продолжить',
  comment = 'Отправить отзыв на соглосование?',
  cancel = 'Отменить',
  back = 'Назад',
  operator = 'Помощь оператора?',
  delivery_date = 'Сохранить дату',
  no_delivery_date = 'Пропустить',
  check_articul = 'Проверка артикула',
}

export const STEPS = {
  INBOT: { step: 1, value: 'В боте' }, //в боте
  CHOOSE_OFFER: { step: 2, value: 'Выбор раздачи' }, // выбор раздачи (web)
  CHECK_ARTICUL: { step: 3, value: 'Артикул правильный' }, // проверка артикул (text)
  SEARCH: { step: 4, value: 'Поиск' }, //поиск (photo)
  ORDER: { step: 5, value: 'Заказ' }, //заказ (photo)
  DELIVERY_DATE: { step: 6, value: 'Дата доставки' }, //дата получения ориентировочная
  RECEIVED: { step: 7, value: 'Получен' }, // получен (photo)
  COMMENT_ON_CHECK: { step: 8, value: 'Отзыв на проверке' }, // отзыв на проверке (text)
  COMMENT: { step: 9, value: 'Отзыв' }, //отзыв (photo)
  SHTRIH_CODE: { step: 10, value: 'Штрих-код' }, // штрих-код (photo)
  CHECK: { step: 11, value: 'Чек' }, //чек
  FINISH: { step: 12, value: '' }, // finish
  BROKE_LOCATION: { step: -1, value: 'Проблема с локацией' }, //геолокация не совпадает с раздачей
  BROKE_ARTICUL: { step: -2, value: 'Проблема с артикулом' }, // артикул не совпадает с раздачей
  HELP: { step: -3, value: '' },
};
export const STEPS_VALUE = {
  ['В боте']: STEPS.INBOT,
  ['Выбор раздачи']: STEPS.CHOOSE_OFFER,
  ['Артикул правильный']: STEPS.CHECK_ARTICUL,
  Поиск: STEPS.SEARCH,
  Заказ: STEPS.ORDER,
  ['Дата доставки']: STEPS.DELIVERY_DATE,
  Получен: STEPS.RECEIVED,
  ['Отзыв на проверке']: STEPS.COMMENT_ON_CHECK,
  Отзыв: STEPS.COMMENT,
  ['Штрих-код']: STEPS.SHTRIH_CODE,
  Чек: STEPS.CHECK,
  Финиш: STEPS.FINISH,
  ['Проблема с локацией']: STEPS.BROKE_LOCATION,
  ['Проблема с артикулом']: STEPS.BROKE_ARTICUL,
};

export const STEPS_TYPES = {
  image: [
    STEPS.SEARCH.step,
    STEPS.ORDER.step,
    STEPS.RECEIVED.step,
    STEPS.COMMENT.step,
    STEPS.SHTRIH_CODE.step,
    STEPS.CHECK.step,
  ],
  text: [
    STEPS.INBOT.step,
    STEPS.CHOOSE_OFFER.step,
    STEPS.CHECK_ARTICUL.step,
    STEPS.COMMENT_ON_CHECK.step,
    STEPS.HELP.step,
    STEPS.DELIVERY_DATE.step,
    STEPS.FINISH.step,
  ],
};

export const COUNT_STEPS = 10;
export const COUNT_TRY_ERROR = 3;

export const HEADER = 'Чтобы получить кешбэк Вам необходимо ⬇️ \n\n';
export const FIRST_STEP = '1️⃣ НАЙТИ товар по запросу\n';
export const FIRST_STEP_LINK =
  'Загрузите сюда ссылку с артикулом товара (например, https://www.wildberries.ru/catalog/168217638/detail.aspx)\n';
export const FIRST_STEP_A =
  '✔️Положите в корзину несколько товаров от других продавцов.\n ' +
  '✔️Загрузите скриншот поиска \n\n';
export const FIRST_STEP_B =
  '❗️Заказ нужно сделать в течение 20 минут после подтверждения или повторно запросить его.\n' +
  '❗️Без подтверждения заказа менеджером, кешбэк выплачен не будет\n\n';
export const FIRST_STEP_C =
  '✔️Загрузите скриншот с подтверждением факта заказа(на скриншоте должен быть указан адрес ПВЗ)\n\n';
export const SECOND_STEP =
  '2️⃣ ЗАБРАТЬ ТОВАР\n' +
  '✔️Загрузите скриншот о получении товара из «мои покупки» \n' +
  '‼️ ВОЗВРАТ ТОВАРА СДЕЛАТЬ НЕВОЗМОЖНО ‼️ \n\n';
export const THREE_STEP =
  '3️⃣ НАПИСАТЬ ОТЗЫВ\n' +
  '✔️После получения товара пришлите нам отзыв на согласование. \n\n';
export const FOUR_STEP = '4️⃣ ЗАГРУЗИТЕ\n';
export const FOUR_STEP_A =
  'Напишите отзыв с фотографией и поставьте 5 звезд ⭐️\n';
export const FOUR_STEP_B = '✔️загрузите скриншот отзыва;\n\n';
export const FIVE_STEP =
  '5️⃣ ЗАГРУЗИТЕ\n' +
  '✔️ фотографию порванного на 4 части (не разрезанного, а именно порванного) штрих кода УПАКОВКИ И БИРКИ \n\n';
export const SIX_STEP =
  '6️⃣ ЗАГРУЗИТЕ\n' + '✔️Чек покупки из личного кабинета ВБ\n\n';
export const FOOTER =
  '💰НА 15-17 ДЕНЬ ПОСЛЕ получения товара с ПВЗ получите кешбэк на карту Сбербанк или Тинькофф\n' +
  'Переводы осуществляются с понедельника по пятницу с 10.00 до 23.00\n\n' +
  '❗️Если дата вашего получения выпала на выходные, то кешбэк будет начислен в ПН🙌\n\n' +
  '🤝 Кешбэк будет выплачен только при соблюдении всех условий инструкции.\n';
export const HELP_TEXT =
  FIRST_STEP +
  FIRST_STEP_A +
  FIRST_STEP_B +
  FIRST_STEP_C +
  SECOND_STEP +
  THREE_STEP +
  FOUR_STEP +
  FOUR_STEP_A +
  FOUR_STEP_B +
  FIVE_STEP +
  SIX_STEP +
  FOOTER;
