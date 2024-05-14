export interface IBot {
  User: string;
  Images: string[];
  Раздача: string;
  Артикул: string;
  StartTime: string;
  StopBuyTime: string;
  StopTime: string;
  Отзыв: string;
}

export type BotStatus =
  | 'Поиск'
  | 'Заказ'
  | 'Получен'
  | 'Отзыв'
  | 'Штрих-код'
  | 'Чек';
