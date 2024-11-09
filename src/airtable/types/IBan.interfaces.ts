export interface IBan {
  id: string;
  createdTime: Date;
  fields: {
    chat_id: string;
    Ник: string;
    Статус: 'Блокировка' | 'Разблокировать';
  };
}

export interface IBans {
  records: IBan[];
}
