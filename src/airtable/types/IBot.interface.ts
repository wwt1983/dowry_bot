export interface IBot {
  id: string;
  createdTime: Date;
  fields: {
    Id: string;
    User: string;
    chat_id: number;
    SessionId: string;
    Статус: BotStatus;
    Images: IPhoto[];
    Раздача: string;
    Артикул: string;
    StartTime: string;
    StopTime: string;
    ['Время выкупа']: string;
    CommentsLink: string;
    OfferId: string[];
    ['Id (from OfferId)']: [];
    ['Оповещения стаститка']: [];
    ['Статусы оповещения']: [];
    ['Статус (from Оповещения стаститка)']: [];
    ['Дата получения']: string;
    Location: string;
    Напомнить: boolean;
    ['Снять с раздачи']: boolean;
    Финиш: boolean;
    Помощь: string;
    'Ключевое слово': string;
    Подписка: boolean;
  };
}
interface IPhoto {
  id: string;
  width: string;
  height: string;
  url: string;
  size: string;
  type: string;
}

export interface IBots {
  records: IBot[];
}

export type BotStatus =
  | 'В боте'
  | 'Выбор раздачи'
  | 'Поиск'
  | 'Корзина'
  | 'Заказ'
  | 'Получен'
  | 'Отзыв на проверке'
  | 'Отзыв'
  | 'Штрих-код'
  | 'Чек'
  | 'Артикул правильный'
  | 'Проблема с артикулом'
  | 'Проблема с локацией'
  //| 'Вызов'
  | 'Бот удален'
  | 'Ошибка'
  | 'Время истекло'
  | 'Дата доставки'
  | 'Проблема с ключевым словом';

export type BrokeBotStatus =
  | 'locationError'
  | 'check_articul'
  | 'wait'
  | 'operator';
