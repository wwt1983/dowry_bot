import { IData } from './types/airtable.interfaces';

export const Base: string = 'appVMEtut0NWayq26';
export const AIRTABLE_WEBHOOK_URL =
  'https://hooks.airtable.com/workflows/v1/genericWebhook/';
export const AIRTABLE_URL = 'https://api.airtable.com/v0/';

export enum TablesName {
  Orders = 'Заказы',
  Articuls = 'Артикулы',
  Helpers = 'Хэлперы',
  Distributions = 'Раздачи',
  Test = 'test_api',
}

export const TablesDowray: IData[] = [
  {
    title: TablesName.Orders,
    tableName: 'tblrO51VWm55xtT4l',
    view: 'viwV8FkeYw5bAGmUf',
  },
  {
    title: TablesName.Articuls,
    tableName: 'tblBzl07Ttl945Exq',
    view: 'viwV46r0J0qtm1nqr',
  },
  {
    title: TablesName.Helpers,
    tableName: 'tbl0GnkR6VekwoxVo',
    view: 'viwTezHxlbthKC6EQ',
  },
  {
    title: TablesName.Distributions,
    tableName: 'tbl1U4a3Tl2W4qbk3',
    view: 'viwZ3ao7eTO3Ljeu5',
  },
  {
    title: TablesName.Test,
    tableName: 'tbl0ibSir3z7hhdsW',
    view: 'viwF04g0zSkrK5c3Y',
  },
];
