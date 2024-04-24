export interface IHelper {
  id: string;
  createdTime: Date;
  fields: {
    Name: string;
    Заказы: string[];
    Phone: string;
    'Адрес ПВЗ': string;
    Поручитель: string[];
    'Адрес Курьера': string;
    Paid: string[];
    'Выплачено всего': string;
    'Заказов в работе': number;
    'К выплате': string;
    Артикулы: string[];
    'Артикул WB': string[];
    'К выплате отзыв': string;
    проверено: boolean;
  };
}
export interface IHelpers {
  records: IHelper[];
}
