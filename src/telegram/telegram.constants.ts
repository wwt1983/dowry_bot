export const TELEGRAM_MODULE_OPTIONS = Symbol('TELEGRAM_MODULE_OPTIONS');
export const TELEGRAM_BOT_ID = '6486222045';
export const TELEGRAM_CHAT_ID = '-1002101395017';
export const TELEGRAM_SECRET_CHAT_ID = '-1002140115397';
export const TELEGRAM_API_URL = 'https://api.telegram.org/bot';
export const TELEGRAM_BOT_URL = 'https://t.me/@DowryWorkBot';
export const FILE_FROM_BOT_URL = 'https://api.telegram.org/file/bot';
export const WEB_APP = 'https://dowrybot-front.vercel.app';

export enum COMMAND_NAMES {
  start = 'start',
  help = 'help',
  history = 'history',
}

export const COMMANDS_TELEGRAM = [
  { command: COMMAND_NAMES.start, description: 'Запуск бота' },
  { command: COMMAND_NAMES.help, description: 'Помощь' },
  { command: COMMAND_NAMES.history, description: 'Ваша история' },
];

export enum STEP_COMMANDS {
  del = 'Изменить',
  next = 'Да',
  comment = 'Отправить отзыв на соглосование?',
  cancel = 'Отменить',
  back = 'Назад',
}

export const STEPS_TYPES = {
  image: [0, 1, 2, 4, 5, 6, 7],
  text: [3],
};
export const COUNT_STEPS = 7;

export const HEADER = 'Чтобы получить кешбэк Вам необходимо ⬇️ \n\n';
export const FIRST_STEP = '1️⃣ НАЙТИ наш товар по ключевому запросу:\n';
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
  '✔️После получения товара пришлите нам отзыв на согласование. \n' +
  'Напишите положительный отзыв с фотографией (уточнить у менеджера)\n' +
  'и поставьте 5 звезд ⭐️\n\n';

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
  FOUR_STEP +
  FOUR_STEP_A +
  FOUR_STEP_B +
  FOOTER;
