import { formatInTimeZone } from 'date-fns-tz';
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isValid,
  format,
} from 'date-fns';
import { ISessionData } from 'src/telegram/telegram.interface';

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

export const getDateWithTz = (date: string, format?: string) =>
  formatInTimeZone(date, TIME_ZONE, format || FORMAT_DATE);

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
    if (
      session.data.times &&
      session.data.times?.length &&
      session.data.times?.length > 0
    ) {
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
    console.log(error);
    return {
      time: session.startTime,
      itsFutureTime: false,
      itsTimeOrder: false,
    };
  }
};
