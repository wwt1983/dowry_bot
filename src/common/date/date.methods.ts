import { formatInTimeZone } from 'date-fns-tz';
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isValid,
} from 'date-fns';

export const FORMAT_DATE = 'yyyy-MM-dd HH:mm';
export const FORMAT_DATE_SIMPLE = 'dd.MM.yyyy HH:mm';
export const FORMAT_DATE_NO_TIME = 'yyyy-MM-dd';
export const FORMAT_DATE_NO_DATE = 'HH:mm';
export const TIME_ZONE = 'Europe/Moscow';
export const ONLY_TIME = 'time';
export const TIME_FULL = 'full';
const ERROR_TIME = -1000;

export const getTimeWithTz = (format?: string) =>
  formatInTimeZone(new Date(), TIME_ZONE, format || FORMAT_DATE);

export const getDifferenceInMinutes = (date: string, format?: string) => {
  console.log(getTimeWithTz(format), date, format);
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

export const getDifferenceInDays = (date: string) => {
  try {
    return differenceInDays(
      getTimeWithTz(),
      formatInTimeZone(date, TIME_ZONE, FORMAT_DATE),
    );
  } catch (e) {
    console.log('getDifferenceInDays', e);
    return ERROR_TIME;
  }
};

export const dateFormat = (date: string, format?: string) => {
  if (!date) return null;
  if (isValid(new Date(date))) {
    return formatInTimeZone(
      new Date(date),
      TIME_ZONE,
      format || FORMAT_DATE_NO_TIME,
    );
  }
  return null;
};

export const getTimesFromTimesTable = (dates: {
  startTime: string;
  stopTime: string;
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
      formatInTimeZone(
        dates.stopTime,
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
