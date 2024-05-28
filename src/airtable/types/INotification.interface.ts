export interface INotification {
  id: string;
  createdTime: string;
  fields: {
    Название: NotificationName;
    ['Количество попыток']: number;
    Сообщение: string;
    Id: string;
  };
}

export interface INotifications {
  records: INotification[];
}

export type NotificationName =
  | 'Поиск'
  | 'Выбор раздачи'
  | 'Заказ'
  | 'Время истекло'
  | 'Получен'
  | 'Отзыв'
  | 'Штрих-код'
  | 'Чек';
