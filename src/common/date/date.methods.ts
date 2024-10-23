import { formatInTimeZone } from 'date-fns-tz';
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isValid,
  format,
  parse,
  addMinutes,
  compareAsc,
  isFuture,
} from 'date-fns';
import { ru } from 'date-fns/locale';

import { ISessionData } from 'src/telegram/telegram.interface';
import { IBot } from 'src/airtable/types/IBot.interface';
import { INTERVAL_FOR_NEXT_CHOOSE } from 'src/telegram/telegram.constants';

export const FORMAT_DATE = 'yyyy-MM-dd HH:mm';
export const FORMAT_DATE_SIMPLE = 'dd.MM.yyyy HH:mm';

export const FORMAT_DATE_SIMPLE_NO_TIME = 'dd.MM.yyyy';
export const FORMAT_DATE_NO_TIME = 'yyyy-MM-dd';
export const FORMAT_DATE_NO_DATE = 'HH:mm';
export const TIME_ZONE = 'Europe/Moscow';
export const ONLY_TIME = 'time';
export const TIME_FULL = 'full';
const ERROR_TIME = -1000;

export const getTimeWithTz = (format?: string) =>
  formatInTimeZone(new Date(), TIME_ZONE, format || FORMAT_DATE);

export const getDateWithTz = (date: string | Date, format?: string) => {
  if (!date) return null;
  return formatInTimeZone(date, TIME_ZONE, format || FORMAT_DATE);
};

export const getDate = () =>
  formatInTimeZone(new Date(), TIME_ZONE, FORMAT_DATE_NO_TIME);

export const getDifferenceInMinutes = (date: string, format?: string) => {
  try {
    if (!date || date === 'undefined') return ERROR_TIME;
    return differenceInMinutes(
      getTimeWithTz(format),
      formatInTimeZone(date, TIME_ZONE, format || FORMAT_DATE),
    );
  } catch (e) {
    console.log('getDifferenceInMinutes=', e);
    return ERROR_TIME;
  }
};

export const getDifferenceInHours = (date: string) => {
  try {
    return differenceInHours(
      getTimeWithTz(),
      formatInTimeZone(date, TIME_ZONE, FORMAT_DATE),
    );
  } catch (e) {
    console.log('getDifferenceInHours=', e);
    return ERROR_TIME;
  }
};

export const getDifferenceInDays = (date: string, format?: string) => {
  try {
    if (!isValid(new Date(date))) return ERROR_TIME;
    return differenceInDays(
      getTimeWithTz(),
      formatInTimeZone(date, TIME_ZONE, format || FORMAT_DATE),
    );
  } catch (e) {
    console.log('getDifferenceInDays', date, e);
    return ERROR_TIME;
  }
};

export const dateFormat = (date: string, format?: string) => {
  if (!date || !isValid(new Date(date))) return null;

  return formatInTimeZone(
    new Date(date),
    TIME_ZONE,
    format || FORMAT_DATE_NO_TIME,
  );
};

export const dateFormatNoTZ = (date: string, formatType?: string) => {
  if (!date) return null;
  if (isValid(new Date(date))) {
    return format(date, formatType || FORMAT_DATE_NO_TIME);
  }
  return null;
};
export const getTimesFromTimesTable = (dates: {
  startTime: string;
  onlyTime: boolean;
}) => {
  try {
    if (!dates) return null;
    return [
      formatInTimeZone(
        dates.startTime,
        TIME_ZONE,
        dates.onlyTime ? FORMAT_DATE_NO_DATE : FORMAT_DATE,
      ),
      dates.onlyTime ? ONLY_TIME : TIME_FULL,
    ];
  } catch (e) {
    console.log('getTimesFromTimesTable=', e);
    return null;
  }
};

export const getOfferTime = (session: ISessionData) => {
  try {
    if (session.data?.times?.length > 0) {
      let time = null;
      if (session.data.times[1] === TIME_FULL) {
        time = session.data.times[0];
      } else {
        time = `${getDate()} ${session.data.times[0]}`;
      }
      return {
        time: time,
        itsFutureTime: getDifferenceInMinutes(time) < 0,
        itsTimeOrder: true,
      };
    } else {
      return {
        time: session.startTime,
        itsFutureTime: false,
        itsTimeOrder: false,
      };
    }
  } catch (error) {
    console.log(error, session);
    return {
      time: session.startTime,
      itsFutureTime: false,
      itsTimeOrder: false,
    };
  }
};
export const parsedDate = (date: string) => {
  if (!date) return null;
  return parse(date, FORMAT_DATE_SIMPLE_NO_TIME, new Date());
};

export const getLastIntervalData = (data: IBot[], interval: string) => {
  //console.log(data.map((x) => x.fields.StartTime));
  const lastInterval = data.sort((a, b) =>
    compareAsc(
      new Date(b.fields['StartTime']),
      new Date(a.fields['StartTime']),
    ),
  );

  const nextInterval = addMinutes(
    new Date(lastInterval[0].fields['StartTime']),
    +interval || INTERVAL_FOR_NEXT_CHOOSE,
  );

  // Преобразуем даты в московское время
  const moscowOffset = 3 * 60; // Московское время UTC+3 в минутах
  const nextIntervalMoscow = new Date(
    nextInterval.getTime() + moscowOffset * 60 * 1000,
  );

  console.log(
    'next ===>  ',
    lastInterval[0].fields.StartTime,
    nextIntervalMoscow,
    isFuture(nextIntervalMoscow),
  );

  if (isFuture(nextIntervalMoscow)) {
    return nextIntervalMoscow.toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });
  } else {
    return getTimeWithTz();
  }
};

export const formatSimple = (date: string) =>
  format(date, 'HH:mm d MMMM', { locale: ru });
