export interface IOffers {
  records: IOffer[];
}

export interface IOffer {
  id: string;
  createdTime: Date;
  fields: {
    Name: string;
    Описание: string;
    Фото: IPhoto[];
    Status: 'Done' | 'In progress' | 'Stop' | 'Public in chat';
    Старт: Date;
    Стоп: Date;
    Количество: number;
    Артикул: number;
    'Ключевые слова': string;
    'Цена WB': string;
    Кешбэк: string;
    'Ваша цена': string;
    Id: string;
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
