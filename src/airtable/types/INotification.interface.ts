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
  | 'В боте'
  | 'Поиск'
  | 'Корзина'
  | 'Выбор раздачи'
  | 'Заказ'
  | 'Время истекло'
  | 'Получен'
  | 'Штрих-код'
  | 'ЧекWb'
  | 'Товар';

export type NotificatonType = 'Информация' | 'Статус раздачи' | 'Проблема';
