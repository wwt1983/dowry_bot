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
          keyword.substring(0, 23),
        );
      case 'Корзина':
      case 'Заказ':
        return check(
          text.ParsedResults[0].ParsedText,
          step.textCheck as string[],
        );
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
 * проверка корзины заказа
 **/
function check(text: string, keywords: string[]): boolean {
  try {
    return keywords.every((keyword) => text.toLowerCase().includes(keyword));
  } catch (error) {
    console.log('check=', error);
    return false;
  }
}

/*
https://ocr.space/OCRAPI
25000 - запросов бесплатно
https://api.ocr.space/parse/imageurl?apikey=K87126672788957&url=https://firebasestorage.googleapis.com/v0/b/dowry-332af.appspot.com/o/file_1730211664350?alt=media&language=rus&isOverlayRequired=true
*/
