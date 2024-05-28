import { formatInTimeZone } from 'date-fns-tz';
import { differenceInMinutes, differenceInHours } from 'date-fns';

export const FORMAT_DATE = 'yyyy-MM-dd HH:mm';
export const getTimeWithTz = () =>
  formatInTimeZone(new Date(), 'Europe/Moscow', FORMAT_DATE);

export const getMinutes = (date: string) => {
  return differenceInMinutes(getTimeWithTz(), date);
};

export const getHours = (date: string) => {
  return differenceInHours(getTimeWithTz(), date);
};
