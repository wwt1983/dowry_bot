export interface IOffers {
  records: IOffer[];
}
export type OfferStatus =
  | 'Done'
  | 'In progress'
  | 'Stop'
  | 'Public in chat'
  | 'Test'
  | 'Архив';

export type KeyType = 'Ограниченный ключ' | 'Ключ без ограничения';
export type OfferType = 'Открытая' | 'Закрытая';
export interface IOffer {
  id: string;
  createdTime: Date;
  fields: {
    Name: string;
    Описание: string;
    Фото: IPhoto[];
    Status: OfferStatus;
    Старт: Date;
    Стоп: Date;
    Количество: number;
    Артикул: number;
    'Количество заказов': number;
    'Цена WB': string;
    Кешбэк: string;
    'Ваша цена': string;
    Id: string;
    Региональность: string;
    'Позиция в WB': string;
    Ключи?: string[];
    'Количество заказов сегодня': number;
    'Длина очереди': number;
    'Ключевое слово'?: string;
    Время?: string[];
    'Время бронь'?: {
      startTime: string;
      onlyTime: boolean;
    }; // время из списка которое закрепляется за пользователем как и ключевое слово
    Ссылка: string;
    Переход: ['Чат', 'Бот'];
    Фильтры?: string[];
    Фильтр?: string;
    'Включить фильтры': boolean;
    Интервал: string;
    'Id (from OfferId)': string;
    'Тип ключей': KeyType;
    'Короткое название': string;
    'Правила раздачи': string;
    Тип: OfferType;
    Расширенная: boolean;
  };
}

interface IPhoto {
  id: string;
  width: string;
  height: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  thumbnails: {
    small: {
      url: string;
      width: string;
      height: string;
    };
    large: {
      url: string;
      width: string;
      height: string;
    };
    full: {
      url: string;
      width: string;
      height: string;
    };
  };
}
