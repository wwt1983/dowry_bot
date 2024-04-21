import { IData } from './interfaces/airtable.interfaces';

export const DataDowray: IData[] = [
  {
    title: 'Заказы',
    tableName: 'tblrO51VWm55xtT4l',
    view: 'viwV8FkeYw5bAGmUf',
  },
  {
    title: 'Артикулы',
    tableName: 'tblBzl07Ttl945Exq',
    view: 'viwV46r0J0qtm1nqr',
  },
  {
    title: 'Хэлперы',
    tableName: 'tbl0GnkR6VekwoxVo',
    view: 'viwTezHxlbthKC6EQ',
  },
  {
    title: 'Раздачи',
    tableName: 'tbl1U4a3Tl2W4qbk3',
    view: 'viwZ3ao7eTO3Ljeu5',
  },
];

export const Base: string = 'appVMEtut0NWayq26';
export const AIRTABLE_WEBHOOK_URL =
  'https://hooks.airtable.com/workflows/v1/genericWebhook/';
export const AIRTABLE_URL = 'https://hooks.airtable.com/';
