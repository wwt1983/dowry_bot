import { BotStatus } from 'src/airtable/types/IBot.interface';
import { IOCRResponse } from './image.interface';
import { STEPS } from 'src/telegram/telegram.constants';

export const checkParseImage = (
  text: IOCRResponse,
  stepName: BotStatus,
  keyword?: string,
) => {
  try {
    //console.log('checkParseImage', stepName, keyword, text);

    if (
      !text ||
      !text?.ParsedResults ||
      text.IsErroredOnProcessing ||
      text?.ParsedResults?.length === 0
    )
      return false;

    const step = STEPS[stepName];

    if (!step) return false;

    switch (stepName) {
      case 'Поиск':
        return checkSearch(
          text.ParsedResults[0].ParsedText,
          keyword.substring(0, 16).trim(),
        );
      case 'Корзина':
        return checkCart(
          text.ParsedResults[0].ParsedText,
          step.textCheck as string[],
        );
      case 'Заказ':
        return checkOrder(
          text.ParsedResults[0].ParsedText,
          step.textCheck as string[],
        );
      case 'Получен':
        return checkBuy(text.ParsedResults[0].ParsedText, 'Покупки');
      default:
        return false;
    }
  } catch (error) {
    console.log('checkParseImage error=', error);
    return false;
  }
};

/**
 * проверка фото поиска
 **/
function checkSearch(text: string, keyword: string): boolean {
  try {
    return text.toLowerCase().includes(keyword.toLowerCase());
  } catch (error) {
    console.log('checkSearch=', error);
    return false;
  }
}

/**
 * проверка корзины
 **/
function checkCart(text: string, keywords: string[]): boolean {
  try {
    return keywords.every((keyword) => text.toLowerCase().includes(keyword));
  } catch (error) {
    console.log('checkCart=', error);
    return false;
  }
}

/**
 * проверка заказа
 **/
function checkOrder(text: string, keywords: string[]): boolean {
  try {
    const regex = new RegExp(keywords.join('|').split('|').join('|'), 'gi');
    return regex.test(text.toLowerCase());
  } catch (error) {
    console.log('checkOrder=', error);
    return false;
  }
}
/**
 * проверка покупки
 **/
function checkBuy(text: string, keyword: string): boolean {
  try {
    return text.toLowerCase().includes(keyword);
  } catch (error) {
    console.log('checkBuy=', error);
    return false;
  }
}
/*
https://ocr.space/OCRAPI
25000 - запросов бесплатно
https://api.ocr.space/parse/imageurl?apikey=K87126672788957&url=https://firebasestorage.googleapis.com/v0/b/dowry-332af.appspot.com/o/file_1730211664350?alt=media&language=rus&isOverlayRequired=true
*/
