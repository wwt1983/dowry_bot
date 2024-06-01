import { InlineKeyboard, Keyboard } from 'grammy';
import { COUNT_TRY_ERROR, STEP_COMMANDS } from './telegram.constants';
import { BrokeBotStatus, IBot } from 'src/airtable/types/IBot.interface';

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

export const articulKeyboard = new InlineKeyboard()
  //.text(STEP_COMMANDS.operator, 'operator')
  //.row()
  .text(STEP_COMMANDS.check_articul, 'check_articul');

export const deliveryDateKeyboard = new InlineKeyboard().text(
  STEP_COMMANDS.no_delivery_date,
  'no_delivery_date',
);

export const shareKeyboard = new Keyboard()
  .requestLocation('Геолокация')
  .placeholder('Я хочу поделиться...')
  .resized();

export const userMenu = new InlineKeyboard().text('История раздач', 'history');

export const createHistoryKeyboard = (data: IBot[]) => {
  const ordersLabel = data?.reduce(function (newArr, record) {
    if (
      !record.fields.Финиш &&
      record.fields.StartTime &&
      record.fields.Статус !== 'Бот удален' &&
      record.fields.Статус !== 'Поиск' &&
      record.fields.Статус !== 'Артикул правильный' &&
      record.fields.Статус !== 'Проблема с артикулом' &&
      record.fields.Статус !== 'Выбор раздачи' &&
      record.fields.Статус !== 'Время истекло' &&
      record.fields.Статус !== 'В боте' &&
      record.fields.Статус !== 'Ошибка' &&
      record.fields.Статус !== 'Проблема с локацией' &&
      record.fields.Статус !== 'Чек' &&
      record.fields.Статус !== 'Вызов'
    ) {
      newArr.push([
        record.fields.Раздача,
        'sessionId_' + record.fields.SessionId,
      ]);
    }
    return newArr;
  }, []);

  if (!ordersLabel || ordersLabel.length === 0) return null;

  const keyboard = new InlineKeyboard().row();
  ordersLabel.forEach(([label, data]) =>
    keyboard.add(InlineKeyboard.text(label, data)).row(),
  );
  return keyboard;
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
