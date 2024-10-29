import { BotStatus } from 'src/airtable/types/IBot.interface';

type ResponseParse = {
  check: boolean;
  count?: number;
  data?: string;
};

const DEFAULT_RESPONSE_TEXT = '\nПроверка: ❌';
const DEFAULT_RESPONSE: ResponseParse = {
  check: false,
  count: 0,
  data: null,
};

const checkParse = (
  text: string,
  status: BotStatus,
  articul: string,
  title: string,
) => {
  try {
    if (!text) return DEFAULT_RESPONSE_TEXT;

    text = text.replace(/\s/gi, ' ');
    let result: ResponseParse = null;
    switch (status) {
      case 'Артикул правильный':
        result = checkSearch(articul, text);
        break;
      case 'Поиск':
        result = checkAddress(articul, text);
        break;
      case 'Заказ':
        break;
      // case 'Отзыв на проверке':
      //   result = checkComment(title, text);
      //   break;
      case 'Штрих-код':
        result = checkCheck(title, text);
        break;
      default:
        break;
    }

    return result ? getMessage(result) : DEFAULT_RESPONSE_TEXT;
  } catch (error) {
    console.log('checkParse=', error);
    return DEFAULT_RESPONSE_TEXT;
  }
};

const getMessage = (result: ResponseParse) => {
  if (!result) return DEFAULT_RESPONSE_TEXT;
  const data = result.data ? ` ➡️ ${result.data}` : '';
  return `\nПроверка: ${result.check ? '✅' : '❌'} ${data}`;
};

/* проверка фото поиска */
const checkSearch = (data: string, text: string): ResponseParse => {
  try {
    const count = (text.match(/Артикул/g) || []).length;
    if (count > 0) {
      return {
        check: text.includes(data),
        count: count,
      };
    } else {
      const count = (text.match(/Кошельком/g) || []).length;
      return {
        check: count > 1,
        count: count,
      };
    }
  } catch (error) {
    console.log('checkSearch=', error);
    return DEFAULT_RESPONSE;
  }
};

/* проверка ссылки чека */
const checkCheck = (data: string, text: string): ResponseParse => {
  try {
    const count = (text.match(/receipt/g) || []).length;
    if (count > 0) {
      const re = new RegExp(data, 'gi');
      return {
        check: (text.match(re) || []).length > 0,
      };
    } else {
      return DEFAULT_RESPONSE;
    }
  } catch (error) {
    console.log('checkCheck=', error);
    return DEFAULT_RESPONSE;
  }
};

/* проверка фото отзыв */
const checkComment = (data: string, text: string): ResponseParse => {
  try {
    const re = new RegExp(data, 'gi');
    const countTitle = (text.match(re) || []).length;
    return {
      check: countTitle > 0,
    };
  } catch (error) {
    console.log('checkComment=', error);
    return DEFAULT_RESPONSE;
  }
};

/* проверка фото адрес пвз */
const checkAddress = (data: string, text: string): ResponseParse => {
  try {
    const isPageBuy = (text.match(/ПУНКТ ВЫДАЧИ ЗАКАЗОВ/) || []).length > 0;

    return {
      check: isPageBuy,
      data: isPageBuy
        ? text
            .split('ПУНКТ ВЫДАЧИ ЗАКАЗОВ')[1]
            .split('Ежедневно')[0]
            .replace('[ 7)', '')
        : '',
    };
  } catch (error) {
    console.log('checkAddress=', error);
    return DEFAULT_RESPONSE;
  }
};

/*
https://api.ocr.space/parse/imageurl?apikey=K87126672788957&url=https://firebasestorage.googleapis.com/v0/b/dowry-332af.appspot.com/o/file_1730211664350?alt=media&language=rus&isOverlayRequired=true
*/
