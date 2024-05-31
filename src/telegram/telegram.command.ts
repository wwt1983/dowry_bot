import { InlineKeyboard, Keyboard } from 'grammy';
import { STEP_COMMANDS } from './telegram.constants';
import { IBot } from 'src/airtable/types/IBot.interface';

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
      record.fields.Статус !== 'Чек'
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
