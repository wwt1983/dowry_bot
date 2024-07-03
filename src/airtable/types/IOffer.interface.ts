export interface IOffers {
  records: IOffer[];
}
export type OfferStatus =
  | 'Done'
  | 'In progress'
  | 'Stop'
  | 'Public in chat'
  | 'Test';
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
    'Ключевые слова'?: string;
    Время?: string[];
    'Время бронь'?: {
      startTime: string;
      onlyTime: boolean;
    }; // время из списка которое закрепляется за пользователем как и ключевое слово
    Ссылка: string;
    Переход: ['Чат', 'Бот'];
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
