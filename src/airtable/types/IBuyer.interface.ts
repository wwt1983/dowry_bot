//покупатель
export interface IBuyer {
  id: string;
  createdTime: Date;
  fields: {
    Имя: string;
    'Номер СБП'?: number;
    'Ник ТГ': string;
    Банк?: string[];
    'Идентификация ФИО': string;
    Раздачи?: string[];
    chat_id: string;
    Оферта: string;
    Подписка: boolean;
    'Инфо по рассылкам': string;
  };
}

export interface IBuyers {
  records: IBuyer[];
}
