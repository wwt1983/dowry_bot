export interface INotificationStatistic {
  id: string;
  createdTime: string;
  fields: {
    ['Количество отправок']: number;
    Шаблон: string[]; //связь с таблицей Оповещения по id
    SessionId: string;
    Время: string;
    Статус: NotificationStatisticStatuses;
    Бот: string; //связь с таблицей Бот по id
  };
}

export interface INotificationStatistics {
  records: INotificationStatistic[];
}

export type NotificationStatisticStatuses =
  | 'Доставлено'
  | 'Не доставлено'
  | 'Ошибка'
  | 'Остановлено';
