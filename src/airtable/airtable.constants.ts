import { IData } from './types/airtable.interfaces';

export const Base: string = 'appVMEtut0NWayq26';
export const AIRTABLE_WEBHOOK_URL =
  'https://hooks.airtable.com/workflows/v1/genericWebhook/';
export const AIRTABLE_URL = 'https://api.airtable.com/v0/' + Base;
export const FILTER_BY_FORMULA = 'filterByFormula';

export enum TablesName {
  Orders = 'Заказы',
  Articuls = 'Артикулы',
  Helpers = 'Хэлперы',
  Buyer = 'Покупатели',
  Distributions = 'Раздачи',
  Bot = 'Бот',
  Offers = 'Offers',
  Notifications = 'Оповещения',
  NotificationStatistics = 'Оповещения статистика',
  UserComments = 'Бот сообщения',
  KeyWords = 'Ключевые слова',
  TimeOffer = 'Время раздач',
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
    title: TablesName.Buyer,
    tableName: 'tblMr3awrotkLiHFw',
    view: 'viwFZfxcGEIhZwgoY',
  },

  {
    title: TablesName.Bot,
    tableName: 'tbl0ibSir3z7hhdsW',
    view: 'viwF04g0zSkrK5c3Y',
  },
  {
    title: TablesName.Offers,
    tableName: 'tblGUNSCgAEwhxchx',
    view: 'viwyvuNy99P47bMZc',
  },
  {
    title: TablesName.Notifications,
    tableName: 'tblMoaw7nGVYjNs84',
    view: 'viw0H5BaEFFOx1d5i',
  },
  {
    title: TablesName.NotificationStatistics,
    tableName: 'tblzqiU7Gi4NSci4Y',
    view: 'viw18CCrp8izswhSA',
  },
  {
    title: TablesName.UserComments,
    tableName: 'tblUi3oMVXlDc6kVQ',
    view: 'viwU3pdfqe01D2sTR',
  },
  {
    title: TablesName.KeyWords,
    tableName: 'tbl0bMwjoMwtrhOjH',
    view: 'viwNbsbJ754Xgm0v4',
  },
  {
    title: TablesName.TimeOffer,
    tableName: 'tblc3PIVK9wiDPVCU',
    view: 'viwUNV2Uq0062fRie',
  },
];

export const ErrorKeyWord = 'Ключевое слово уточните у менеджера';
