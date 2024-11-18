import { InlineKeyboard, Keyboard } from 'grammy';
import {
  COUNT_TRY_ERROR,
  IGNORED_STATUSES,
  START_NAME,
  STEP_COMMANDS,
  WEB_APP,
  WEB_APP_TEST,
} from './telegram.constants';
import { BrokeBotStatus, IBot } from 'src/airtable/types/IBot.interface';
import { removeEmojis } from './telegram.custom.functions';

export const webKeyboard = {
  text: START_NAME,
  web_app: {
    url: process.env.NODE_ENV === 'development' ? WEB_APP_TEST : WEB_APP,
  },
};

export const stepKeyboard = new InlineKeyboard()
  .text(STEP_COMMANDS.del, 'del')
  .text(STEP_COMMANDS.next, 'next');

export const commentKeyboard = new InlineKeyboard().text(
  STEP_COMMANDS.next,
  'next',
);

export const operatorKeyboard = new InlineKeyboard().text(
  STEP_COMMANDS.operator,
  'operator',
);

export const articulKeyboard = new InlineKeyboard().text(
  STEP_COMMANDS.check_articul,
  'check_articul',
);

export const helpKeyboard = new InlineKeyboard().text(
  STEP_COMMANDS.help,
  'help',
);

export const deliveryDateKeyboard = new InlineKeyboard().text(
  STEP_COMMANDS.no_delivery_date,
  'no_delivery_date',
);

export const recivingDateKeyboard = new InlineKeyboard().text(
  STEP_COMMANDS.delivery_date,
  'date_receiving',
);

export const shareKeyboard = new Keyboard()
  .requestLocation('Геолокация')
  .placeholder('Я хочу поделиться...')
  .resized();

export const userMenu = new InlineKeyboard().text('История раздач', 'history');

export const createLabelHistory = (
  data: IBot[],
  isUserStop?: boolean,
  isReturn?: boolean,
) => {
  if (!data || data.length === 0) return [];
  if (isUserStop) {
    return data?.reduce(function (newArr, record) {
      if (
        record.fields.Статус == 'Выбор раздачи' ||
        record.fields.Статус == 'Корзина' ||
        record.fields.Статус == 'Поиск' ||
        record.fields.Статус == 'Артикул правильный' ||
        record.fields.Статус == 'Проблема с артикулом'
      ) {
        newArr.push([
          removeEmojis(record.fields.Раздача),
          'sessionId_' + record.fields.SessionId + '_del',
        ]);
      }
      return newArr;
    }, []);
  }

  if (isReturn) {
    return data?.reduce(function (newArr, record) {
      if (
        !record.fields.Финиш &&
        !IGNORED_STATUSES.includes(record.fields.Статус) &&
        record.fields.Статус !== 'В боте' &&
        !record.fields['Снять с раздачи']
      ) {
        newArr.push([
          removeEmojis(record.fields.Раздача),
          'sessionId_' + record.fields.SessionId + '_return',
        ]);
      }
      return newArr;
    }, []);
  }
  return data?.reduce(function (newArr, record) {
    if (
      !record.fields.Финиш &&
      !IGNORED_STATUSES.includes(record.fields.Статус) &&
      record.fields.Статус !== 'В боте' &&
      !record.fields['Снять с раздачи']
    ) {
      newArr.push([
        removeEmojis(record.fields.Раздача),
        'sessionId_' + record.fields.SessionId,
      ]);
    }
    return newArr;
  }, []);
};

/**
 *isUserStop - флаг для создания кнопок для удаления пользователем
 */
export const createHistoryKeyboard = (
  data: IBot[],
  web?: boolean,
  isUserStop?: boolean,
  isReturn?: boolean,
) => {
  const ordersLabel = createLabelHistory(data, isUserStop, isReturn);

  const keyboard = new InlineKeyboard().row();
  if (web) {
    keyboard
      .add(
        InlineKeyboard.webApp(
          START_NAME,
          process.env.NODE_ENV === 'development' ? WEB_APP_TEST : WEB_APP,
        ),
      )
      .row();
  }
  if (ordersLabel && ordersLabel.length > 0) {
    ordersLabel.forEach(([label, data]) =>
      keyboard
        .add(
          InlineKeyboard.text(
            (isUserStop || isReturn ? '❌ ' : '➡️ ') + label,
            data,
          ),
        )
        .row(),
    );
  }
  return (ordersLabel && ordersLabel.length > 0) || web ? keyboard : null;
};

export const getArticulCommand = (
  countTryError: number,
  status: BrokeBotStatus,
) => {
  if (countTryError < COUNT_TRY_ERROR) return null;
  if (countTryError === COUNT_TRY_ERROR) {
    return {
      reply_markup: operatorKeyboard,
    };
  } else {
    switch (status) {
      case 'operator':
        return null;
      case 'wait':
      case 'check_articul':
        return {
          reply_markup: operatorKeyboard,
        };
      default:
        return {
          reply_markup: articulKeyboard,
        };
    }
  }
};
