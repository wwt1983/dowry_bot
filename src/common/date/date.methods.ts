import { formatInTimeZone } from 'date-fns-tz';
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isValid,
} from 'date-fns';

export const FORMAT_DATE = 'yyyy-MM-dd HH:mm';
export const FORMAT_DATE_NO_TIME = 'yyyy-MM-dd';
export const FORMAT_DATE_NO_DATE = 'HH:mm';

const ERROR_TIME = -1000;

export const getTimeWithTz = () =>
  formatInTimeZone(new Date(), 'Europe/Moscow', FORMAT_DATE);

export const getDifferenceInMinutes = (date: string) => {
  try {
    if (!date || date === 'undefined') return ERROR_TIME;
    return differenceInMinutes(
      getTimeWithTz(),
      formatInTimeZone(date, 'Europe/Moscow', FORMAT_DATE),
    );
  } catch (e) {
    return ERROR_TIME;
  }
};

export const getDifferenceInHours = (date: string) => {
  try {
    return differenceInHours(
      getTimeWithTz(),
      formatInTimeZone(date, 'Europe/Moscow', FORMAT_DATE),
    );
  } catch (e) {
    console.log(e);
    return ERROR_TIME;
  }
};

export const getDifferenceInDays = (date: string) => {
  return differenceInDays(
    getTimeWithTz(),
    formatInTimeZone(date, 'Europe/Moscow', FORMAT_DATE),
  );
};

export const dateFormat = (date: string) => {
  if (!date) return null;
  if (isValid(new Date(date))) {
    return formatInTimeZone(
      new Date(date),
      'Europe/Moscow',
      FORMAT_DATE_NO_TIME,
    );
  }
  return null;
};

export const dateFormatWithTZ = (date: string) => {
  if (!date) return null;
  if (isValid(new Date(date))) {
    return formatInTimeZone(new Date(date), 'Europe/Moscow', FORMAT_DATE);
  }
  return null;
};

export const getTimesFromDate = (dates: string[]) => {
  try {
    if (!dates || dates.length === 0) return null;
    return dates.map((date) =>
      formatInTimeZone(date, 'Europe/Moscow', FORMAT_DATE_NO_DATE),
    );
  } catch (e) {
    console.log(e);
    return null;
  }
};
