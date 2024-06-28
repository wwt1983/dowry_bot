import { InlineKeyboard, Keyboard } from 'grammy';
import {
  COUNT_TRY_ERROR,
  START_NAME,
  STEP_COMMANDS,
  WEB_APP,
  WEB_APP_TEST,
} from './telegram.constants';
import { BrokeBotStatus, IBot } from 'src/airtable/types/IBot.interface';

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

export const shareKeyboard = new Keyboard()
  .requestLocation('Геолокация')
  .placeholder('Я хочу поделиться...')
  .resized();

export const userMenu = new InlineKeyboard().text('История раздач', 'history');

export const createLabelHistory = (data: IBot[]) => {
  if (!data || data.length === 0) return [];
  return data?.reduce(function (newArr, record) {
    if (
      !record.fields.Финиш &&
      record.fields.StartTime &&
      record.fields.Статус !== 'Бот удален' &&
      record.fields.Статус !== 'Время истекло' &&
      record.fields.Статус !== 'В боте' &&
      record.fields.Статус !== 'Ошибка' &&
      record.fields.Статус !== 'Проблема с локацией' &&
      record.fields.Статус !== 'Чек' &&
      !record.fields['Снять с раздачи']
      //record.fields.Статус !== 'Проблема с артикулом' &&
      //record.fields.Статус !== 'Поиск' &&
      //record.fields.Статус !== 'Артикул правильный' &&
      //record.fields.Статус !== 'Проблема с артикулом'
      //record.fields.Статус !== 'Выбор раздачи' &&
      //record.fields.Статус !== 'Вызов'
    ) {
      newArr.push([
        record.fields.Раздача,
        'sessionId_' + record.fields.SessionId,
      ]);
    }
    return newArr;
  }, []);
};
export const createHistoryKeyboard = (data: IBot[], web?: boolean) => {
  const ordersLabel = createLabelHistory(data);

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
      keyboard.add(InlineKeyboard.text('➡️ ' + label, data)).row(),
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
