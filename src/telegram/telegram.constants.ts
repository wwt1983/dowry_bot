export const TELEGRAM_MODULE_OPTIONS = Symbol('TELEGRAM_MODULE_OPTIONS');
export const TELEGRAM_BOT_ID = '6486222045';
export const TELEGRAM_BOT_TEST_ID = '7145649314';
export const TELEGRAM_BOT_NAME = '@DowryWorkBot';
export const TELEGRAM_BOT_TEST_NAME = '@test_dowry_bot';
export const TELEGRAM_CHAT_ID = '-1002002256034';
export const TELEGRAM_CHAT_ID_OFFERS = '-1002089773580';
export const TELEGRAM_SECRET_CHAT_ID = '-1002155788141';
export const TELEGRAM_MESSAGE_CHAT_TEST = '-1002227889311';
export const TELEGRAM_MESSAGE_CHAT_PROD = '-4289825366';
export const TELEGRAM_API_URL = 'https://api.telegram.org/bot';
export const TELEGRAM_BOT_URL = 'https://t.me/@DowryWorkBot';
export const FILE_FROM_BOT_URL = 'https://api.telegram.org/file/bot';
export const WEB_APP = 'https://dowrybot-front.vercel.app/';
export const WEB_APP_TEST = 'https://dowrybot-front-test.vercel.app/';
export const WAITING_IMAGE = WEB_APP + 'images/wait.jpg';
export const STOP_TEXT = 'Раздачу продолжать нельзя';
export const LIMIT_TIME_IN_MINUTES_FOR_ORDER = 30;
export const LIMIT_TIME_IN_MINUTES_FOR_ORDER_WITH_FILTER = 120;
export const LIMIT_TIME_IN_MINUTES_FOR_BUY = 90;
export const LIMIT_TIME_IN_MINUTES_FOR_BUY_WITH_FILTER = 180;
export const SUBSCRIBE_CHAT_URL = 'https://t.me/dowry_wb';
export const MESSAGE_LIMIT_ORDER = '❌Превышен лимит заказов одного артикула❌';
export const MESSAGE_WAITING =
  'Это популярная раздача. Сейчас все места заняты. Попробуйте оформить раздачу позже. Места могут периодически освобождаться или появляться новые😉';
export const START_NAME = '👉 DOWRY РАЗДАЧИ 👈';

export enum COMMAND_NAMES {
  start = 'start',
  help = 'help',
  history = 'history',
  call = 'call',
  messageSend = 'message_send',
  saveMessage = 'saveMessage',
  admin = 'admin',
  offers = 'offers',
}

export const COMMANDS_TELEGRAM = [
  { command: COMMAND_NAMES.start, description: 'Запуск бота' },
  { command: COMMAND_NAMES.offers, description: 'Раздачи' },
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
  help = 'Пошаговая инструкция',
}
export const STEP_ERROR_TEXT = 'На этом шаге нужно ';
export const STEP_EXAMPLE_TEXT_DOWN = ' (образец ⤵️)';
export const STEP_EXAMPLE_TEXT_UP = ' (образец ⬆️)';
export const TYPE_STEP = { image: 'image', text: 'text' };

export const STEP_TEXT_NUMBER_EMOJI = (numberStep: number) => {
  switch (numberStep) {
    case 13:
      return `1️⃣3️⃣ шагов\n`;
    case 12:
      return `1️⃣2️⃣ шагов\n`;
    case 11:
      return `1️⃣1️⃣ шагов\n`;
    case 10:
      return `🔟 шагов\n`;
    case 9:
      return '9️⃣ шагов\n';
    case 8:
      return '8️⃣ шагов\n';
    case 7:
      return `7️⃣ шагов\n`;
    case 6:
      return `6️⃣ шагов\n`;
    case 5:
      return `5️⃣ шагов\n`;
    case 4:
      return `4️⃣ шага\n`;
    case 3:
      return `3️⃣ шага\n`;
    case 2:
      return `2️⃣ шага\n`;
    case 1:
      return `1️⃣ шаг\n`;
  }
};

export const STEPS = {
  'В боте': {
    step: 0,
    value: 'В боте',
    erroText: 'выбрать раздачу',
    isActive: true,
    typeStep: TYPE_STEP.text,
  }, //в боте
  'Выбор раздачи': {
    step: 0,
    value: 'Выбор раздачи',
    erroText: 'поделиться сюда ссылкой найденного товара с wildberries',
    isActive: true,
    typeStep: TYPE_STEP.text,
  }, // выбор раздачи (web)
  'Артикул правильный': {
    step: 0,
    value: 'Артикул правильный',
    erroText: 'Поделитесь сюда ссылкой найденного товара с wildberries',
    image: '/images/11.jpg',
    isActive: true,
    typeStep: TYPE_STEP.text,
  }, // проверка артикул (text)
  Поиск: {
    step: 0,
    value: 'Поиск',
    erroText: 'загрузить скриншот поиска',
    image: '/images/10.jpg',
    isActive: true,
    typeStep: TYPE_STEP.image,
  }, //поиск (photo)
  Корзина: {
    step: 0,
    value: 'Корзина',
    erroText: 'загрузить скриншот корзины',
    image: '/images/1.jpeg',
    isActive: true,
    typeStep: TYPE_STEP.image,
  }, //поиск (photo)
  Заказ: {
    step: 0,
    value: 'Заказ',
    erroText: 'загрузить скриншот заказа',
    image: '/images/2.jpeg',
    isActive: true,
    typeStep: TYPE_STEP.image,
  }, //заказ (photo)
  'Дата доставки': {
    step: 0,
    value: 'Дата доставки',
    erroText: 'ввести дату доставки (в формате 12.12.2024)',
    isActive: true,
    typeStep: TYPE_STEP.text,
  }, //дата получения ориентировочная
  Получен: {
    step: 0,
    value: 'Получен',
    erroText: 'загрузить скриншот получения товара',
    image: '/images/3.jpeg',
    isActive: true,
    typeStep: TYPE_STEP.image,
  }, // получен (photo)
  'Дата получения': {
    step: 0,
    value: 'Дата получения',
    erroText: 'ввести дату получения (в формате 12.12.2024)',
    isActive: true,
    typeStep: TYPE_STEP.text,
  }, //дата получения фактическая
  'Отзыв на проверке': {
    step: 0,
    value: 'Отзыв на проверке',
    erroText: 'написать отзыв или ожидать ответа',
    isActive: false,
    typeStep: TYPE_STEP.text,
  }, // отзыв на проверке (text)
  Отзыв: {
    step: 0,
    value: 'Отзыв',
    erroText: 'загрузить скриншот отзыва с 5 ⭐️',
    image: '/images/4.jpeg',
    typeStep: TYPE_STEP.text,
    isActive: false,
  }, //отзыв (photo)
  ['Штрих-код']: {
    step: 0,
    value: 'Штрих-код',
    erroText: 'загрузить скриншот со штрих-кодом',
    image: '/images/5.jpeg',
    isActive: true,
    typeStep: TYPE_STEP.image,
  }, // штрих-код (photo)
  Чек: {
    step: 0,
    value: 'Чек',
    erroText: 'загрузить скриншот чека',
    image: '/images/6.jpeg',
    isActive: false,
    typeStep: TYPE_STEP.image,
  }, //чек link wb
  ЧекWb: {
    step: 0,
    value: 'ЧекWb',
    erroText:
      'загрузить ссылку на чек из личного кабинета wildberries (ниже пример как найти чек и переслать себе на почту файл, в котором будет ссылка на чек) или скриншот чека, где будет видна покупка (как удобно 🤙)',
    image: '/images/13.jpeg',
    isActive: true,
    typeStep: TYPE_STEP.text + TYPE_STEP.image,
  }, //чек link wb
  Товар: {
    step: 0,
    value: 'Товар',
    erroText: 'загрузить скриншот товара',
    image: '/images/12.jpg',
    isActive: true,
    typeStep: TYPE_STEP.image,
  },
  Цена: {
    step: 0,
    value: 'Цена',
    erroText:
      'напишите цену, которую вы заплатили на wildberries за этот товар',
    image: '',
    isActive: true,
    typeStep: TYPE_STEP.text,
  },
  Финиш: {
    step: 0,
    value: 'Финиш',
    erroText: 'написать данные для кешбэка (банк, ФИО, телефон)',
    isActive: true,
    typeStep: TYPE_STEP.text,
  }, // finish
  'Проблема с локацией': {
    step: -1,
    value: 'Проблема с локацией',
    erroText: '',
    isActive: true,
    typeStep: TYPE_STEP.text,
  }, //геолокация не совпадает с раздачей
  'Проблема с артикулом': {
    step: -2,
    value: 'Проблема с артикулом',
    erroText: 'ввести правильную ссылку из wildberries',
    image: '/images/11.jpg',
    isActive: true,
    typeStep: TYPE_STEP.text,
  }, // артикул не совпадает с раздачей
  HELP: {
    step: -3,
    value: '',
    erroText: '',
    isActive: true,
    typeStep: TYPE_STEP.text,
  },
  'Время истекло': {
    step: -4,
    value: 'Время истекло',
    erroText: 'написать о своей проблеме',
    isActive: true,
    typeStep: TYPE_STEP.text,
  },
  'Лимит заказов': {
    step: -5,
    value: 'Лимит заказов',
    erroText: MESSAGE_LIMIT_ORDER,
    isActive: true,
    typeStep: TYPE_STEP.text,
  },
  'Отмена пользователем': {
    step: -6,
    value: 'Отмена пользователем',
    erroText: 'Отмена пользователем',
    isActive: true,
    typeStep: TYPE_STEP.text,
  },
  'В ожидании': {
    step: -7,
    value: 'В ожидании',
    erroText: 'В ожидании',
    isActive: true,
    typeStep: TYPE_STEP.text,
  },
  'Чек неверный': {
    step: -8,
    value: 'Чек неверный',
    erroText:
      'ввести ссылку на чек из wildberries или скриншот чека (как удобно 🤙)',
    image: '/images/13.jpeg',
    isActive: true,
    typeStep: TYPE_STEP.text + TYPE_STEP.image,
  }, //
};

export const COUNT_STEPS = Object.values(STEPS).filter(
  (x) => x.step > 0 && x.isActive,
).length;

export const COUNT_TRY_ERROR = 4;

export const HEADER = 'Чтобы получить кешбэк Вам необходимо ⬇️ \n\n';
export const FIRST_STEP_START_HELP =
  '➡️ Для получения списка раздач нажмите "Dowry раздачи"';
export const FIRST_STEP_OFFER = '➡️ Выберите раздачу';
export const FIRST_STEP = '1️⃣ НАЙТИ товар на wildberries по запросу\n';
export const FIRST_STEP_KEY_VALUE =
  '1️⃣ Ваше ключевое слово для поиска на wildberries: ';
export const FIRST_STEP_KEY = '(его вы увидите после выбора раздачи)\n';
export const FIRST_STEP_LINK =
  'Поделитесь сюда ссылкой найденного товара с wildberries\n';
export const FIRST_STEP_A = '2️⃣ ✔️Загрузите скриншот поиска \n';
export const FIRST_STEP_CART =
  '✔️Положите в корзину в wildberries несколько товаров от других продавцов.\n' +
  '3️⃣ ✔️Загрузите скриншот корзины\n';
export const FIRST_STEP_B =
  '❗️Заказ нужно сделать в течение 30 минут после подтверждения или повторно запросить его.\n';
export const FIRST_STEP_C =
  '❗️Оформить заказ нужно через 20-30 минут❗️\n' +
  '4️⃣ ✔️Загрузите скриншот с подтверждением факта заказа (на скриншоте должен быть указан адрес ПВЗ)\n';
export const SECOND_STEP =
  ' ЗАБРАТЬ ТОВАР\n' +
  '5️⃣ ✔️Загрузите скриншот о получении товара из «мои покупки» \n' +
  'Проверьте товар на ПВЗ (если товар с браком , вернуть товар  по браку прям на ПВЗ и уведомить нас об этом ) \n' +
  '‼️ ВОЗВРАТ ТОВАРА СДЕЛАТЬ НЕВОЗМОЖНО ‼️ \n';
//export const THREE_STEP =
// '5️⃣ НАПИСАТЬ ОТЗЫВ\n' +
// '✔️После получения товара пришлите нам отзыв на согласование. Когда отзыв будет согласован, вам в бот придет сообщение. Обычно мы отвечаем в течение дня.\n\n';
//export const FOUR_STEP = '6️⃣ ЗАГРУЗИТЕ\n';
//export const FOUR_STEP_A =
// 'Напишите отзыв с фотографией и поставьте 5 звезд ⭐️\n';
//export const FOUR_STEP_B = '7️⃣ ✔️загрузите скриншот отзыва;\n\n';
export const FIVE_STEP =
  '6️⃣ ЗАГРУЗИТЕ\n' +
  '✔️ фотографию порванного на 4 части (не разрезанного, а именно порванного) штрих-кода УПАКОВКИ И БИРКИ \n';
export const SIX_STEP =
  '7️⃣ ЗАГРУЗИТЕ\n' + '✔️Чек покупки из личного кабинета ВБ\n';
export const SIX_STEP_LINK =
  '7️⃣ ЗАГРУЗИТЕ\n' +
  '✔️Ссылку на чек из личного кабинета wildberries (ниже пример как найти чек и переслать себе на почту файл, в котором будет ссылка на чек) или скриншот чека, где будет видна покупка (как удобно 🤙)\n';
export const SEVEN_STEP = '8️⃣ ЗАГРУЗИТЕ\n' + '✔️Фото товара\n';
export const FOOTER =
  '💰НА 15-17 ДЕНЬ ПОСЛЕ получения товара с ПВЗ получите кешбэк на карту Сбербанк или Тинькофф\n' +
  '‼️Если товар заказан и Покупатель не отвечает/не присылает данные в течении 25 дней с даты заказа - кешбэк не будет выплачен.\n' +
  'Переводы осуществляются с понедельника по пятницу с 10.00 до 23.00\n\n' +
  '❗️Если дата вашего получения выпала на выходные, то кешбэк будет начислен в ПН🙌\n\n' +
  '🤝 Кешбэк будет выплачен только при соблюдении всех условий инструкции\n\n';

export const IMAGES_STEP_FOR_HELP = [
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
    type: STEPS['Артикул правильный'],
    url: WEB_APP + '/images/7.jpg',
    text: FIRST_STEP + FIRST_STEP_KEY + FIRST_STEP_LINK,
  },
  {
    type: STEPS['Выбор раздачи'],
    url: WEB_APP + '/images/11.jpg',
    text: FIRST_STEP_A,
  },
  {
    type: STEPS.Поиск,
    url: WEB_APP + '/images/10.jpg',
    text: FIRST_STEP_CART,
  },
  {
    type: STEPS.Заказ,
    url: WEB_APP + '/images/1.jpeg',
    text: FIRST_STEP_B + FIRST_STEP_C,
  },
  {
    type: STEPS.Получен.value,
    url: WEB_APP + '/images/2.jpeg',
    text: SECOND_STEP + FIVE_STEP,
  },
  // {
  //   type: STEPS.Отзыв.value,
  //   url: WEB_APP + '/images/3.jpeg',
  //   text: THREE_STEP + FOUR_STEP + FOUR_STEP_A + FOUR_STEP_B,
  // },
  // {
  //   type: STEPS['Отзыв на проверке'].value,
  //   url: WEB_APP + '/images/4.jpeg',
  //   text: FIVE_STEP,
  // },
  {
    type: STEPS['Штрих-код'].value,
    url: WEB_APP + '/images/5.jpeg',
    text: SIX_STEP_LINK,
  },

  {
    type: STEPS.Финиш.value,
    url: WEB_APP + '/images/13.jpeg',
    text: SEVEN_STEP,
  },
  {
    type: STEPS['Товар'].value,
    url: WEB_APP + '/images/12.jpg',
    text: FOOTER,
  },
];

export const createHelpText = () => {
  const medias = [];
  for (let i = 0; i < IMAGES_STEP_FOR_HELP.length; i++) {
    medias.push({
      type: 'photo',
      media: IMAGES_STEP_FOR_HELP[i].url,
      caption: IMAGES_STEP_FOR_HELP[i].text,
    });
  }
  return medias;
};

export const CASH_STOP_WORDS = [
  'кешбэк',
  'кеш',
  'кэшбэк',
  'кэшбек',
  'кэш',
  'деньги',
];
export const CACHE_WAIT_STATUS = 'Кэш задержка';
