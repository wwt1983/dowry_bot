export interface IKeyWord {
  id: string;
  createdTime: Date;
  fields: {
    Offers: string;
    Количество: number;
    Статус: KeyWordStatus;
    Название: string;
  };
}

export interface IKeyWords {
  records: IKeyWord[];
}

export type KeyWordStatus = 'In progress' | 'Done';
