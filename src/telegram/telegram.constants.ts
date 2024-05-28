export const TELEGRAM_MODULE_OPTIONS = Symbol('TELEGRAM_MODULE_OPTIONS');
export const TELEGRAM_BOT_ID = '6486222045';
export const TELEGRAM_BOT_NAME = '@DowryWorkBot';
export const TELEGRAM_CHAT_ID = '-1002002256034';
export const TELEGRAM_SECRET_CHAT_ID = '-1002155788141';
export const TELEGRAM_MESSAGE_CHAT_TEST = '-4262552024';
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
  messageSend = 'message_send',
}

export const COMMANDS_TELEGRAM = [
  { command: COMMAND_NAMES.start, description: 'Запуск бота' },
  { command: COMMAND_NAMES.help, description: 'Помощь' },
  { command: COMMAND_NAMES.history, description: 'Ваша история' },
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
  operator = 'Нужна помощь оператора?',
}

export const STEPS = {
  INBOT: 1, //в боте
  CHOOSE_OFFER: 2, // выбор раздачи (web)
  CHECK_ARTICUL: 3, // проверка артикул (text)
  SEARCH: 4, //поиск (photo)
  ORDER: 5, //заказ (photo)
  RECEIVED: 6, // получен (photo)
  COMMENT_ON_CHECK: 7, // отзыв на проверке (text)
  COMMENT: 8, //отзыв (photo)
  SHTRIH_CODE: 9, // штрих-код (photo)
  CHECK: 10, //чек
  FINISH: 11, // finish
  BROKE_LOCATION: -1, //геолокация не совпадает с раздачей
  BROKE_ARTICUL: -2, // артикул не совпадает с раздачей
  HELP: -3,
};

export const STEPS_TYPES = {
  image: [
    STEPS.SEARCH,
    STEPS.ORDER,
    STEPS.RECEIVED,
    STEPS.COMMENT,
    STEPS.SHTRIH_CODE,
    STEPS.CHECK,
  ],
  text: [
    STEPS.INBOT,
    STEPS.CHOOSE_OFFER,
    STEPS.CHECK_ARTICUL,
    STEPS.COMMENT_ON_CHECK,
    STEPS.HELP,
    STEPS.CHECK_ARTICUL,
  ],
};

export const COUNT_STEPS = 10;
export const COUNT_TRY_ERROR = 3;

export const HEADER = 'Чтобы получить кешбэк Вам необходимо ⬇️ \n\n';
export const FIRST_STEP = '1️⃣ НАЙТИ наш товар по ключевому запросу:\n';
export const FIRST_STEP_LINK =
  'Загрузите сюда ссылку с артикулом товара (например, https://www.wildberries.ru/catalog/168217638/detail.aspx)\n';
export const FIRST_STEP_A =
  '✔️Положите в корзину несколько товаров от других продавцов.\n ' +
  '✔️Загрузите скриншот поиска \n\n';
export const FIRST_STEP_B =
  '❗️Внимание, заказ нужно сделать в течение 20 минут после подтверждения или повторно запросить его.\n' +
  '❗️Без подтверждения заказа менеджером, кешбэк выплачен не будет\n\n';
export const FIRST_STEP_C =
  'Загрузите скриншот с подтверждением факта заказа(на скриншоте должен быть указан адрес ПВЗ)\n\n';
export const SECOND_STEP =
  '2️⃣ ЗАБРАТЬ ТОВАР\n' +
  '✔️Загрузите скриншот о получении товара из «мои покупки» \n' +
  '‼️ ВОЗВРАТ ТОВАРА СДЕЛАТЬ НЕВОЗМОЖНО ‼️ \n\n';
export const THREE_STEP =
  '3️⃣ НАПИСАТЬ ОТЗЫВ НА 5 ⭐️ \n' +
  '✔️После получения товара пришлите нам отзыв на согласование. \n';
export const THREE_STEP_A =
  'Напишите отзыв с фотографией и поставьте 5 звезд ⭐️\n';
export const FOUR_STEP = '4️⃣ ЗАГРУЗИТЕ\n' + '✅ скриншот отзыва;\n';
export const FOUR_STEP_A =
  '✅ фотографию порванного на 4 части (не разрезанного, а именно порванного) штрих кода УПАКОВКИ И БИРКИ \n';
export const FOUR_STEP_B = '✅ Чек покупки из личного кабинета ВБ\n\n';
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
  THREE_STEP_A +
  '\n' +
  FOUR_STEP +
  FOUR_STEP_A +
  FOUR_STEP_B +
  FOOTER;
