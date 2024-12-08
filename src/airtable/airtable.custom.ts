import { removeEmojis } from 'src/telegram/telegram.custom.functions';
import { FILTER_BY_FORMULA } from './airtable.constants';
import { IOffers } from './types/IOffer.interface';
import { WEB_APP } from 'src/telegram/telegram.constants';

export const getFilterById = (keyIds: string[]) => {
  return keyIds.length === 1
    ? `&${FILTER_BY_FORMULA}=FIND("${keyIds[0]}",{Id})`
    : `&${FILTER_BY_FORMULA}=OR(${keyIds.map((x) => `{Id}="${x}"`).join(',')})`;
};

/**
 * Получаем список раздач с полем ссылки и название
 */
export const getOffersLink = (offers: IOffers, withoutUrl?: boolean) => {
  try {
    if (
      offers &&
      offers.records &&
      Array.isArray(offers.records) &&
      offers.records.length > 0
    ) {
      return offers?.records
        .filter(
          (x) =>
            x.fields['Name'] !== undefined &&
            x.fields['Name'] !== '' &&
            x.fields?.Артикул &&
            x.fields?.Фото &&
            Array.isArray(x.fields.Фото) &&
            x.fields.Фото.length > 0,
        )
        .map((x) => ({
          type: 'photo',
          media: x.fields.Фото[0].thumbnails.full.url,
          caption: withoutUrl
            ? x.fields.Описание
            : `➡️ ${removeEmojis(x.fields.Name)}\n${
                process.env.NODE_ENV === 'development'
                  ? x.fields['Ссылка'].replace('dowryworkbot', 'test_dowry_bot')
                  : x.fields['Ссылка']
              }`,
        }));
    }

    return [
      {
        type: 'photo',
        media: WEB_APP + 'images/waiting.webp',
        caption: 'Ждем новых раздач 😉',
      },
    ];
  } catch (e) {
    console.log(e);
    return [
      {
        type: 'photo',
        media: WEB_APP + 'images/waiting.webp',
        caption: 'Ждем новых раздач 😉',
      },
    ];
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
