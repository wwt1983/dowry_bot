import { formatInTimeZone } from 'date-fns-tz';
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isValid,
  format,
  parse,
  addMinutes,
  addDays,
  compareAsc,
  formatISO,
  isToday,
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
    return formatISO(format(date, formatType || FORMAT_DATE_NO_TIME));
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

export const addMinutesToInterval = (date: string, interval: number) => {
  if (!date) date = getTimeWithTz();
  return formatInTimeZone(addMinutes(date, interval), TIME_ZONE, FORMAT_DATE);
};

export const getLastIntervalData = (data: IBot[], interval: string) => {
  //console.log(data.map((x) => x.fields.StartTime));
  const lastInterval =
    data.length === 1
      ? data
      : data.sort((a, b) =>
          compareAsc(
            new Date(b.fields['StartTime']),
            new Date(a.fields['StartTime']),
          ),
        );

  const nextInterval = addMinutesToInterval(
    lastInterval[0].fields['StartTime'],
    +interval || INTERVAL_FOR_NEXT_CHOOSE,
  );

  // console.log(
  //   'next ===>  ',
  //   lastInterval[0].fields.StartTime,
  //   nextInterval,
  //   getDifferenceInMinutes(nextInterval),
  //);

  if (getDifferenceInMinutes(nextInterval) < 0) {
    return nextInterval;
  } else {
    return getTimeWithTz();
  }
};

export const formatSimple = (date: string) =>
  format(date, 'd MMMM HH:mm', { locale: ru });

export const convertDateFromString = (date: string) => {
  if (!date || date.length < 5) return null;
  const regex = /[,\-\s\/]/g;
  date = date.replace(regex, '.');

  // Функция для форматирования даты в DD.MM.YYYY
  const format = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const regex2 = /^\d{2}\.\d{2}\.\d{4}$/; // DD.MM.YYYY
  const regex3 = /^\d{2}\.\d{2}$/; // DD.MM
  const regex4 = /^\d{2}\.\d{2}.\d{2}$/; // DD.MM.YY
  const regex5 = /^\d{1}\.\d{2}.\d{4}$/; // D.MM.YYYY
  const regex6 = /^\d{2}\.\d{1}.\d{4}$/; // DD.M.YYYY
  const regex7 = /^\d{1}\.\d{1}.\d{4}$/; // D.M.YYYY

  const currentYear = new Date().getFullYear();
  if (regex2.test(date)) {
    // Если дата в формате DD.MM.YYYY, возвращаем её как есть
    return date;
  } else if (regex3.test(date) || regex4.test(date)) {
    // Если дата в формате DD.MM или DD/MM, добавляем текущий год
    const [day, month] = date.split(/[\.\/]/);
    return format(new Date(`${currentYear}-${month}-${day}`));
  } else if (regex5 || regex6 || regex7) {
    const [day, month, currentYear] = date.split('.');

    // Добавляем ведущие нули, если необходимо
    const formattedDay = day.padStart(2, '0');
    const formattedMonth = month.padStart(2, '0');
    return format(new Date(`${currentYear}-${formattedMonth}-${formattedDay}`));
  } else {
    return null;
  }
};

export const formatMinutesToHoursAndMinutes = (totalMinutes: number) => {
  if (!totalMinutes) return null;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} мин.`;
  return `${hours} час${hours !== 1 ? 'а' : ''} ${minutes} мин.`;
};

export const isTodayDate = (date: string) => {
  if (!date) return false;
  try {
    return isToday(formatInTimeZone(date, TIME_ZONE, FORMAT_DATE));
  } catch (error) {
    return false;
  }
};

export const addDaysToDate = (date: string, count: number) => {
  if (!date) date = getDate();
  return formatInTimeZone(addDays(date, count), TIME_ZONE, FORMAT_DATE_NO_TIME);
};
