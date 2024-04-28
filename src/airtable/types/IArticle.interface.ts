export interface IArticle {
  id: string;
  createdTime: Date;
  fields: {
    Name: string;
    'Артикул WB': number;
    Клиенты: string[];
    Заказы: string[];
    Раздачи: string[];
    'Состав материала': string;
    Цвет: string;
    Barcode?: {
      text: string;
    };
  };
}

export interface IArticles {
  records: IArticle[];
}
