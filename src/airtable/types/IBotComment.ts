export interface IBotComment {
  id: string;
  createdTime: Date;
  fields: {
    chat_id: string;
    Комментарии: string;
    Status: string;
    Name: string;
  };
}

export interface IBotComments {
  records: IBotComment[];
}
