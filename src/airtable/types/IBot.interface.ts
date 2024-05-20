export interface IBot {
  User: string;
  Images: string[];
  Раздача: string;
  Артикул: string;
  StartTime: string;
  ['Время выкупа']: string;
  StopTime: string;
  Отзыв: string;
}

export type BotStatus =
  | 'Поиск'
  | 'Заказ'
  | 'Получен'
  | 'Отзыв на проверке'
  | 'Отзыв'
  | 'Штрих-код'
  | 'Чек';
