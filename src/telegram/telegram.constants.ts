import { ISteps } from './telegram.interface';
//https://api.airtable.com/v0/meta/enterpriseAccounts/usrkZH2gnYRYReD06/auditLogs
export const TELEGRM_NOT_WORK =
  'Здравствуйте, сейчас в боте проводятся обновления.👷‍♂️ Скоро заработаем 😉 По всем вопросам пишите оператору';

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
export const LIMIT_TIME_IN_MINUTES_FOR_ORDER_WITH_FILTER = 30;
export const LIMIT_TIME_IN_MINUTES_FOR_BUY = 30;
export const LIMIT_TIME_IN_MINUTES_FOR_BUY_WITH_FILTER = 30;
export const SUBSCRIBE_CHAT_URL = 'https://t.me/dowry_wb';
export const MESSAGE_LIMIT_ORDER = '❌Превышен лимит заказов одного артикула❌';
export const MESSAGE_WAITING =
  'Это популярная раздача с ограниченным числом мест. Места могут периодически освобождаться😉';
export const START_NAME = '👉 DOWRY РАЗДАЧИ 👈';
export const OFERTA_URL =
  'https://dowry.pro/%D0%BE%D1%84%D0%B5%D1%80%D1%82%D0%B0';
export const FORM_SURVEY =
  'https://airtable.com/appVMEtut0NWayq26/shrisfugvxlt89Edo';
export const INTERVAL_FOR_NEXT_CHOOSE = 20;
export const ADMIN_CHAT_ID = 193250152;
export const ERROR_DATE_MESSAGE = 'Дата должна быть в формате 12.11.2024';
export const MESSAGE_ANSWER_FOR_ASK =
  'Ваше сообщение отправлено! Мы уже готовим вам ответ 🧑‍💻';
export const POLL =
  'https://airtable.com/appVMEtut0NWayq26/pagzETSWeImAbtKev/form?prefill_Id=';

export enum COMMAND_NAMES {
  start = 'start',
  help = 'help',
  history = 'history',
  call = 'call',
  messageSend = 'message_send',
  saveMessage = 'saveMessage',
  admin = 'admin',
  offers = 'offers',
  return = 'return',
  question = 'question',
}

export const COMMANDS_TELEGRAM = [
  { command: COMMAND_NAMES.start, description: 'Запуск бота' },
  { command: COMMAND_NAMES.offers, description: 'Раздачи' },
  { command: COMMAND_NAMES.help, description: 'Инструкция' },
  { command: COMMAND_NAMES.history, description: 'История заказов' },
  { command: COMMAND_NAMES.call, description: 'Написать оператору' },
  { command: COMMAND_NAMES.question, description: 'Вопрос-ответ' },
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
  returnOfGood = 'Возврат товара',
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
export const COUNT_TRY_ERROR = 4;

export const HEADER = 'Чтобы получить кешбэк Вам необходимо ⬇️ \n\n';
export const FIRST_STEP_START_HELP =
  '➡️ Для получения списка раздач нажмите' + ' "Dowry раздачи"'.toUpperCase();
export const FIRST_STEP_OFFER =
  '➡️ Выберите раздачу\nЗаказ необходимо оформить в указанное время. На оформление отводится 20-30 минут\n';
export const FIRST_STEP = '1️⃣ НАЙТИ товар на wildberries по запросу\n';
export const FIRST_STEP_KEY_VALUE =
  '1️⃣ Ваше ключевое слово для поиска на wildberries: ';
export const FIRST_STEP_KEY = '(его вы увидите после выбора раздачи)\n';
export const FIRST_STEP_LINK = 'Поделитесь сюда ссылкой\n';
export const FIRST_STEP_A =
  '2️⃣ ✔️Загрузите скриншот поиска нашего товара, где виден ключевой запрос \n';
export const FIRST_STEP_CART =
  '3️⃣ ✔️Добавьте наш товар в корзину, а также несколько похожих товаров конкурентов. Перед оформлением заказа необходимо изучить нашу карточку. Товары конкурента необходимо удалить.\n';
export const FIRST_STEP_C =
  '4️⃣ ✔️Загрузите скриншот с подтверждением факта заказа (на скриншоте должен быть указан адрес ПВЗ)\n' +
  '❗️Возврат товара на ПВЗ возможен только по браку, иначе кешбек выплачен не будет \n';
export const SECOND_STEP =
  '5️⃣ ✔️Загрузите скриншот о получении товара из раздела "Покупки" \n';
//export const THREE_STEP =
// '5️⃣ НАПИСАТЬ ОТЗЫВ\n' +
// '✔️После получения товара пришлите нам отзыв на согласование. Когда отзыв будет согласован, вам в бот придет сообщение. Обычно мы отвечаем в течение дня.\n\n';
//export const FOUR_STEP = '6️⃣ ЗАГРУЗИТЕ\n';
//export const FOUR_STEP_A =
// 'Напишите отзыв с фотографией и поставьте 5 звезд ⭐️\n';
//export const FOUR_STEP_B = '7️⃣ ✔️загрузите скриншот отзыва;\n\n';
export const FIVE_STEP =
  '6️⃣ ✔️Загрузите фотографию мелко порванных или закрашенных штрих-кода с упаковки товара и бирки. \n';
export const SIX_STEP = '7️⃣ ✔️Чек покупки из личного кабинета ВБ\n';
export const SIX_STEP_LINK =
  '7️⃣ ✔️Загрузите ссылку на ЧЕК покупки из личного кабинета wildberries (профиль-финансы-вверху справа «эл.чеки» - найти нужный - отправить себе на почту ссылку - скопировать в бот) или скриншот чека, где будет видна покупка (как удобно 🤙)\n';
export const SEVEN_STEP = '8️⃣ ✔️Загрузите фото товара\n';
export const FOOTER_DAY =
  '👉 НА 15-17 ДЕНЬ ПОСЛЕ получения товара с ПВЗ или раньше (в зависимости от раздачи) получите кешбэк 💰 на карту Сбербанк или Тинькофф\n';
export const FOOTER =
  '👉 Переводы осуществляются с понедельника по пятницу с 10.00 до 23.00\n' +
  '👉 Если дата вашего получения выпала на выходные, кешбэк будет начислен в ПН\n' +
  '👉 Если товар заказан и Покупатель не отвечает/не присылает данные в течении 25 дней с даты заказа - кешбэк выплачен не будет \n' +
  '👉 Срок действия раздачи 1 месяц с момента заказа товара \n' +
  '👉 Для проверки факта невозврата товара менеджер дополнительно может запросить видео переход из чата в раздел Покупки\n' +
  '👉 Кешбэк будет выплачен только при соблюдении всех условий инструкции\n\n';

export const STEPS: ISteps = {
  'В боте': {
    step: 0,
    value: 'В боте',
    erroText: 'выбрать раздачу',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: false,
    textCheck: false,
  }, //в боте
  'Выбор раздачи': {
    step: 0,
    value: 'Выбор раздачи',
    erroText:
      'На этом шаге необходимо поделиться в бот ссылкой найденного товара',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: false,
    textCheck: false,
  }, // выбор раздачи (web)
  'Артикул правильный': {
    step: 0,
    value: 'Артикул правильный',
    erroText:
      'На этом шаге необходимо поделиться в бот ссылкой найденного товара',
    image: '/images/111.jpg',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: false,
    textCheck: false,
  }, // проверка артикул (text)
  Поиск: {
    step: 0,
    value: 'Поиск',
    erroText:
      'На этом шаге необходимо загрузить скриншот поиска нашего товара, где виден ключевой запрос ',
    image: '/images/101.jpg',
    isActive: true,
    typeStep: TYPE_STEP.image,
    stop: false,
    textCheck: [], //здесь будет пусто но проверка будет по ключевому слову
  }, //поиск (photo)
  Корзина: {
    step: 0,
    value: 'Корзина',
    erroText: 'На этом шаге необходимо загрузить скриншот корзины',
    image: '/images/1.jpeg',
    isActive: true,
    typeStep: TYPE_STEP.image,
    stop: false,
    textCheck: ['корзина', 'купить'],
  }, //поиск (photo)
  Заказ: {
    step: 0,
    value: 'Заказ',
    erroText: 'На этом шаге необходимо загрузить скриншот заказа',
    image: '/images/2.jpeg',
    isActive: true,
    typeStep: TYPE_STEP.image,
    stop: false,
    textCheck: ['доставки|заказ'],
  }, //заказ (photo)
  'Дата доставки': {
    step: 0,
    value: 'Дата доставки',
    erroText:
      'На этом шаге необходимо ввести дату доставки (в формате 12.12.2024)',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: false,
    textCheck: false,
  }, //дата получения ориентировочная
  Получен: {
    step: 0,
    value: 'Получен',
    erroText: 'На этом шаге необходимо загрузить скриншот получения товара',
    image: '/images/3.jpeg',
    isActive: true,
    typeStep: TYPE_STEP.image,
    stop: false,
    textCheck: ['покупки'],
  }, // получен (photo)
  'Дата получения': {
    step: 0,
    value: 'Дата получения',
    erroText:
      'На этом шаге необходимо ввести дату получения (в формате 12.12.2024)',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: false,
    textCheck: false,
  }, //дата получения фактическая
  ['Штрих-код']: {
    step: 0,
    value: 'Штрих-код',
    erroText: 'На этом шаге необходимо загрузить скриншот со штрих-кодом',
    image: '/images/shtrih_code.jpg',
    isActive: true,
    typeStep: TYPE_STEP.image,
    stop: false,
    textCheck: [],
  }, // штрих-код (photo)
  Чек: {
    step: 0,
    value: 'Чек',
    erroText: 'На этом шаге необходимо загрузить скриншот чека',
    image: '/images/6.jpeg',
    isActive: false,
    typeStep: TYPE_STEP.image,
    stop: false,
    textCheck: [],
  }, //чек link wb
  ЧекWb: {
    step: 0,
    value: 'ЧекWb',
    erroText:
      'На этом шаге необходимо загрузить ссылку на чек из личного кабинета wildberries (ниже пример как найти чек и переслать себе на почту файл, в котором будет ссылка на чек) или скриншот чека, где будет видна покупка (как удобно 🤙)',
    image: '/images/13.jpeg',
    isActive: true,
    typeStep: TYPE_STEP.text + TYPE_STEP.image,
    stop: false,
    textCheck: [],
  }, //чек link wb
  Товар: {
    step: 0,
    value: 'Товар',
    erroText: 'На этом шаге необходимо загрузить скриншот товара',
    image: '/images/12.jpg',
    isActive: true,
    typeStep: TYPE_STEP.image,
    stop: false,
    textCheck: false,
  },
  Цена: {
    step: 0,
    value: 'Цена',
    erroText:
      'На этом шаге необходимо напишите цену, которую вы заплатили на wildberries за этот товар',
    image: '',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: false,
    textCheck: false,
  },
  Финиш: {
    step: 0,
    value: 'Финиш',
    erroText:
      'На этом шаге необходимо написать данные для кешбэка (банк, ФИО, телефон)',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: false,
    textCheck: false,
  }, // finish
  'Проблема с локацией': {
    step: -1,
    value: 'Проблема с локацией',
    erroText: '',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: true,
    textCheck: false,
  }, //геолокация не совпадает с раздачей
  'Проблема с артикулом': {
    step: -2,
    value: 'Проблема с артикулом',
    erroText: 'ввести правильную ссылку из wildberries',
    image: '/images/11.jpg',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: false,
    textCheck: false,
  }, // артикул не совпадает с раздачей
  HELP: {
    step: -3,
    value: '',
    erroText: '',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: false,
    textCheck: false,
  },
  'Время истекло': {
    step: -4,
    value: 'Время истекло',
    erroText: 'написать о своей проблеме',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: true,
    textCheck: false,
  },
  'Лимит заказов': {
    step: -5,
    value: 'Лимит заказов',
    erroText: MESSAGE_LIMIT_ORDER,
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: true,
    textCheck: false,
  },
  'Отмена пользователем': {
    step: -6,
    value: 'Отмена пользователем',
    erroText: 'Отмена пользователем',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: true,
    textCheck: false,
  },
  'Чек неверный': {
    step: -8,
    value: 'Чек неверный',
    erroText:
      'ввести ссылку на чек из wildberries или скриншот чека (как удобно 🤙)',
    image: '/images/13.jpeg',
    isActive: true,
    typeStep: TYPE_STEP.text + TYPE_STEP.image,
    stop: false,
    textCheck: false,
  }, //
  Отмена: {
    step: -9,
    value: 'Отмена администратором',
    erroText: 'Отмена администратором',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: true,
    textCheck: false,
  },
};
/**
 * Дополнительные шаги для определенных групп пользователей
 */
export const STEPS_FOR_UNUSUAL_USER = {
  Отзыв: {
    step: 0,
    value: 'Отзыв',
    erroText: '👩‍💻 Напишите отзыв и отправьте его для согласования',
    isActive: true,
    typeStep: TYPE_STEP.text,
    stop: false,
    textCheck: false,
  }, //отзыв (photo)
};
export const COUNT_STEPS = Object.values(STEPS).filter(
  (x) => x.step > 0 && x.isActive,
).length;

export const IMAGES_STEP_FOR_HELP = [
  {
    type: STEPS['В боте'],
    url: WEB_APP + '/images/wb.jpg',
    text: FIRST_STEP_START_HELP,
  },
  {
    type: STEPS['Выбор раздачи'],
    url: WEB_APP + '/images/button-start.jpg',
    text: FIRST_STEP_OFFER,
  },
  {
    type: STEPS['Артикул правильный'],
    url: WEB_APP + '/images/example.jpg',
    text: FIRST_STEP + FIRST_STEP_KEY + FIRST_STEP_LINK,
  },
  {
    type: STEPS['Выбор раздачи'],
    url: WEB_APP + '/images/111.jpg',
    text: FIRST_STEP_A,
  },
  {
    type: STEPS.Поиск,
    url: WEB_APP + '/images/101.jpg',
    text: FIRST_STEP_CART,
  },
  {
    type: STEPS.Заказ,
    url: WEB_APP + '/images/1.jpeg',
    text: FIRST_STEP_C,
  },
  {
    type: STEPS.Получен.value,
    url: WEB_APP + '/images/2.jpeg',
    text: SECOND_STEP,
  },
  {
    type: STEPS.Получен.value,
    url: WEB_APP + '/images/4.jpeg',
    text: FIVE_STEP,
  },
  {
    type: STEPS['Штрих-код'].value,
    url: WEB_APP + '/images/shtrih_code.jpg',
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
    text: FOOTER_DAY + FOOTER,
  },
];

export const CASH_STOP_WORDS = [
  'кешбэк',
  'кеш',
  'кэшбэк',
  'кэшбек',
  'кэш',
  'деньги',
  'оплаты',
  'оплата',
  'выплат',
];
export const CACHE_WAIT_STATUS = 'Кэш задержка';

export const IGNORED_STATUSES = [
  'Бот удален',
  'Время истекло',
  'Проблема с локацией',
  'Лимит заказов',
  'Отмена пользователем',
  'Отмена',
  'Возврат',
];
