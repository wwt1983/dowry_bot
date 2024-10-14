import { FILTER_BY_FORMULA } from './airtable.constants';
import { IOffers } from './types/IOffer.interface';

export const getFilterById = (keyIds: string[]) => {
  return keyIds.length === 1
    ? `&${FILTER_BY_FORMULA}=FIND("${keyIds[0]}",{Id})`
    : `&${FILTER_BY_FORMULA}=OR(${keyIds.map((x) => `{Id}="${x}"`).join(',')})`;
};

/**
 * Получаем список раздач с полем ссылки и название
 */
export const getOffersLink = (offers: IOffers) => {
  try {
    if (offers && offers.records && Array.isArray(offers.records)) {
      const result = offers?.records
        .filter(
          (x) => x.fields['Name'] !== undefined && x.fields['Name'] !== '',
        )
        .map((x) => ({
          name: x.fields['Name'],
          link: x.fields['Ссылка'],
        }));
      return result.reduce((acc, currentValue, index) => {
        acc += `${++index}. <a href='${currentValue.link}'>${currentValue.name}</a>\n`;
        return acc;
      }, '');
    }
    return 'Пока предложений нет😢';
  } catch (e) {
    console.log(e);
    return 'Произошла ошибка в запросе. Попробуйте посмотреть предложения позже.';
  }
};
/**
 * Получаем список раздач с полем ссылки и название
 */
export const getOffersLinkForNotification = (
  offers: IOffers,
  onlyCurrent?: string,
) => {
  try {
    const result = offers?.records
      .filter((x) =>
        onlyCurrent
          ? x.fields['Name'] === onlyCurrent
          : x.fields['Name'] !== undefined && x.fields['Name'] !== '',
      )
      .map((x) => ({
        name:
          x.fields['Name'] +
          (x.fields['Кешбэк'] && x.fields['Кешбэк'] !== undefined
            ? ' (💰💰💰 кэшбэк 👉' + x.fields['Кешбэк'] + ')'
            : ''),
        link: x.fields['Ссылка'],
      }));
    return result.reduce((acc, currentValue) => {
      if (onlyCurrent) {
        return `\n\n😉 Здравствуйте. У нас новая раздача <a href='${currentValue.link}'>${currentValue.name}</a>`;
      }
      acc += `😉 <a href='${currentValue.link}'>${currentValue.name}</a>\n`;
      return acc;
    }, '');
  } catch (e) {
    console.log(e);
    return 'Произошла ошибка в запросе. Попробуйте посмотреть предложения позже.';
  }
};
