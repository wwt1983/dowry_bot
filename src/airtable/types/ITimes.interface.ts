export interface ITime {
  id: string;
  createdTime: Date;
  fields: {
    Start: string;
    Offer: string;
    Stop: string;
    'Количество предложений': number;
    Status: TimeStatus;
    'Только время': boolean;
  };
}

export interface ITimes {
  records: ITime[];
}

export type TimeStatus = 'In progress' | 'Done' | 'Stop';
