import { formatInTimeZone } from 'date-fns-tz';
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isValid,
  format,
} from 'date-fns';

export const FORMAT_DATE = 'yyyy-MM-dd HH:mm';
export const FORMAT_DATE_NO_TIME = 'yyyy-MM-dd';

export const getTimeWithTz = () =>
  formatInTimeZone(new Date(), 'Europe/Moscow', FORMAT_DATE);

export const getDifferenceInMinutes = (date: string) => {
  return differenceInMinutes(
    getTimeWithTz(),
    formatInTimeZone(date, 'Europe/Moscow', FORMAT_DATE),
  );
};

export const getDifferenceInHours = (date: string) => {
  return differenceInHours(
    getTimeWithTz(),
    formatInTimeZone(date, 'Europe/Moscow', FORMAT_DATE),
  );
};

export const getDifferenceInDays = (date: string) => {
  return differenceInDays(
    getTimeWithTz(),
    formatInTimeZone(date, 'Europe/Moscow', FORMAT_DATE),
  );
};

export const dateFormat = (date: string) => {
  if (isValid(new Date(date))) {
    return format(new Date(date), FORMAT_DATE_NO_TIME);
  }
  return null;
};
