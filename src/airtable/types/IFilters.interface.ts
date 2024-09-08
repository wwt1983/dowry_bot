export interface IFilter {
  id: string;
  createdTime: Date;
  fields: {
    Offers: string[];
    Использовано?: number;
    Название: string;
  };
}

export interface IFilters {
  records: IFilter[];
}
