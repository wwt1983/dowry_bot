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
export const LIMIT_TIME_IN_MINUTES_FOR_ORDER = 180;
export const LIMIT_TIME_IN_MINUTES_FOR_BUY = 60;

export const START_NAME = '👉 Dowry раздачи 👈';

export enum COMMAND_NAMES {
  start = 'start',
  help = 'help',
  history = 'history',
  call = 'call',
  messageSend = 'message_send',
  saveMessage = 'saveMessage',
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
const STEP_ERROR_TEXT = 'На этом шаге нужно ';
export const STEPS = {
  ['В боте']: {
    step: 1,
    value: 'В боте',
    erroText: '',
    textStepCount: '',
  }, //в боте
  ['Выбор раздачи']: {
    step: 2,
    value: 'Выбор раздачи',
    erroText: '',
    textStepCount: `9️⃣ шагов\n`,
  }, // выбор раздачи (web)
  'Артикул правильный': {
    step: 3,
    value: 'Артикул правильный',
    erroText: STEP_ERROR_TEXT + 'ввести артикул товара',
    textStepCount: `8️⃣ шагов\n`,
  }, // проверка артикул (text)
  Поиск: {
    step: 4,
    value: 'Поиск',
    erroText: '',
    textStepCount: `7️⃣ шагов`,
  }, //поиск (photo)
  Заказ: {
    step: 5,
    value: 'Заказ',
    erroText: '',
    textStepCount: `6️⃣ шагов`,
  }, //заказ (photo)
  'Дата доставки': {
    step: 6,
    value: 'Дата доставки',
    erroText: '',
    textStepCount: '',
  }, //дата получения ориентировочная
  Получен: {
    step: 7,
    value: 'Получен',
    erroText: '',
    textStepCount: `5️⃣ шагов\n`,
  }, // получен (photo)
  ['Отзыв на проверке']: {
    step: 8,
    value: 'Отзыв на проверке',
    erroText: '',
    textStepCount: `4️⃣ шага\n`,
  }, // отзыв на проверке (text)
  Отзыв: { step: 9, value: 'Отзыв', erroText: '', textStepCount: `3️⃣ шага\n` }, //отзыв (photo)
  ['Штрих-код']: {
    step: 10,
    value: 'Штрих-код',
    erroText: '',
    textStepCount: `2️⃣ шага\n`,
  }, // штрих-код (photo)
  Чек: {
    step: 11,
    value: 'Чек',
    erroText: '',
    textStepCount: `1️⃣ шаг\n`,
  }, //чек
  Финиш: {
    step: 12,
    value: '',
    erroText: '',
    textStepCount: '',
  }, // finish
  ['Проблема с локацией']: {
    step: -1,
    value: 'Проблема с локацией',
    erroText: '',
    textStepCount: '',
  }, //геолокация не совпадает с раздачей
  ['Проблема с артикулом']: {
    step: -2,
    value: 'Проблема с артикулом',
    erroText: '',
    textStepCount: '',
  }, // артикул не совпадает с раздачей
  HELP: { step: -3, value: '', erroText: '', textStepCount: '' },
  ['Время истекло']: {
    step: -4,
    value: 'Время истекло',
    erroText: '',
    textStepCount: '',
  },
};

export const STEPS_TYPES = {
  image: [
    STEPS.Поиск.step,
    STEPS.Заказ.step,
    STEPS.Получен.step,
    STEPS.Отзыв.step,
    STEPS['Штрих-код'].step,
    STEPS.Чек.step,
  ],
  text: [
    STEPS['В боте'].step,
    STEPS['Выбор раздачи'].step,
    STEPS['Артикул правильный'].step,
    STEPS['Отзыв на проверке'].step,
    STEPS.HELP.step,
    STEPS['Дата доставки'].step,
    STEPS.Финиш.step,
  ],
};

export const COUNT_TRY_ERROR = 1;

export const HEADER = 'Чтобы получить кешбэк Вам необходимо ⬇️ \n\n';
export const FIRST_STEP_START_HELP =
  '➡️ Для получения списка раздач нажмите "Dowry раздачи"';
export const FIRST_STEP_OFFER = '➡️ Выберите раздачу';
export const FIRST_STEP = '1️⃣ НАЙТИ товар на wildberries по запросу\n';
export const FIRST_STEP_KEY = '(его вы увидите после выбора раздачи)\n';
export const FIRST_STEP_LINK =
  'Загрузите сюда ссылку с артикулом товара (например, https://www.wildberries.ru/catalog/168217638/detail.aspx)\n';
export const FIRST_STEP_A =
  '✔️Положите в корзину несколько товаров от других продавцов.\n ' +
  '✔️Загрузите скриншот поиска \n\n';
export const FIRST_STEP_B =
  '❗️Заказ нужно сделать в течение 30 минут после подтверждения или повторно запросить его.\n' +
  '❗️Без подтверждения заказа менеджером, кешбэк выплачен не будет\n\n';
export const FIRST_STEP_C =
  '✔️Загрузите скриншот с подтверждением факта заказа (на скриншоте должен быть указан адрес ПВЗ)\n\n';
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
  '✔️ фотографию порванного на 4 части (не разрезанного, а именно порванного) штрих-кода УПАКОВКИ И БИРКИ \n\n';
export const SIX_STEP =
  '6️⃣ ЗАГРУЗИТЕ\n' + '✔️Чек покупки из личного кабинета ВБ\n\n';
export const FOOTER =
  '💰НА 15-17 ДЕНЬ ПОСЛЕ получения товара с ПВЗ получите кешбэк на карту Сбербанк или Тинькофф\n' +
  'Переводы осуществляются с понедельника по пятницу с 10.00 до 23.00\n\n' +
  '❗️Если дата вашего получения выпала на выходные, то кешбэк будет начислен в ПН🙌\n\n' +
  '🤝 Кешбэк будет выплачен только при соблюдении всех условий инструкции.\n\n';

export const IMAGES_STEP = [
  {
    type: STEPS['В боте'],
    url: WEB_APP + '/images/wb.jpg',
    text: FIRST_STEP_START_HELP,
  },
  {
    type: STEPS['Выбор раздачи'],
    url: WEB_APP + '/images/0.jpg',
    text: FIRST_STEP_OFFER,
  },
  {
    type: STEPS['Выбор раздачи'],
    url: WEB_APP + '/images/7.jpg',
    text: FIRST_STEP + FIRST_STEP_KEY + FIRST_STEP_A,
  },
  {
    type: STEPS.Заказ.step,
    url: WEB_APP + '/images/1.jpeg',
    text: FIRST_STEP_B + FIRST_STEP_C,
  },
  {
    type: STEPS.Получен.value,
    url: WEB_APP + '/images/2.jpeg',
    text: SECOND_STEP,
  },
  {
    type: STEPS.Отзыв.value,
    url: WEB_APP + '/images/3.jpeg',
    text: THREE_STEP + FOUR_STEP + FOUR_STEP_A + FOUR_STEP_B,
  },
  {
    type: STEPS['Отзыв на проверке'].value,
    url: WEB_APP + '/images/4.jpeg',
    text: FIVE_STEP,
  },
  {
    type: STEPS['Штрих-код'].value,
    url: WEB_APP + '/images/5.jpeg',
    text: SIX_STEP,
  },
  {
    type: STEPS.Финиш.value,
    url: WEB_APP + '/images/6.jpeg',
    text: FOOTER,
  },
];

export const createHelpText = () => {
  const medias = [];
  for (let i = 0; i < IMAGES_STEP.length; i++) {
    medias.push({
      type: 'photo',
      media: IMAGES_STEP[i].url,
      caption: IMAGES_STEP[i].text,
    });
  }
  return medias;
};
