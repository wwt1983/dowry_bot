export interface INotification {
  id: string;
  createdTime: string;
  fields: {
    Название: NotificationName;
    ['Количество попыток']: number;
    Сообщение: string;
    Id: string;
    Тип: 'Статус раздачи' | 'Проблема' | 'Информация';
    Активность: boolean;
    'Отправить сообщение': boolean;
    'Последнее обновление': string;
    Статус: 'Успешно' | 'Не успешно';
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
  | 'Товар'
  | 'Кэш задержка'
  | 'Новые раздачи для постоянных клиентов'
  | 'Новые раздачи для новых клиентов';

export type NotificatonType = 'Информация' | 'Статус раздачи' | 'Проблема';
