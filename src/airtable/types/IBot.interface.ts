export interface IBot {
  User: string;
  Images: string[];
  Раздача: string;
  Артикул: string;
  StartTime: string;
  ['Время выкупа']: string;
  StopTime: string;
  ['Сообщения от пользователя']: string;
}

export type BotStatus =
  | 'В боте'
  | 'Выбор раздачи'
  | 'Поиск'
  | 'Заказ'
  | 'Получен'
  | 'Отзыв на проверке'
  | 'Отзыв'
  | 'Штрих-код'
  | 'Чек'
  | 'Артикул правильный'
  | 'Проблема с артикулом'
  | 'Проблема с локацией'
  | 'Вызов'
  | 'Бот удален'
  | 'Ошибка'
  | 'Снять с раздачи';

export type BrokeBotStatus = 'locationError' | 'articulError' | 'operatorCall';
