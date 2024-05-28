import { formatInTimeZone } from 'date-fns-tz';
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from 'date-fns';

export const FORMAT_DATE = 'yyyy-MM-dd HH:mm';
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
