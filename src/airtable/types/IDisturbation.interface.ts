type ImageType = {
  url: string;
  width: string;
  height: string;
};

type PhotoDataType = {
  id: string;
  width: string;
  height: string;
  url: string;
  filename: string;
  size: string;
  type: string;
  thumbnails: {
    small: ImageType;
    large: ImageType;
    full: ImageType;
  };
};

export interface IDistribution {
  id: string;
  createdTime: Date;
  fields: {
    Раздача: string;
    Артикул: [];
    'Ключевой запрос': string;
    'Дата заказа': Date;
    Тариф: string[];
    'Цена товара': string;
    'Кэш выплачен': boolean;
    'Дата выкупа': Date;
    'Деньги от клиента': boolean;
    'Фото товар'?: PhotoDataType[];
    'Фото бирка'?: PhotoDataType[];
    'Скрин отзыв'?: PhotoDataType[];
    'Дней до кэшбэка': string;
    Покупатели?: string[];
    'Скрин чека'?: PhotoDataType[];
    Кэшбек: string;
    'Артикул WB': number[];
    'Цена услуги': string[];
    'Дата выплаты'?: Date;
    'Ник ТГ': string[];
    'Выплаченный кешбек'?: string;
  };
}

export interface IDistributions {
  records: IDistribution[];
}
