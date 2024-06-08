import { BotStatus } from 'src/airtable/types/IBot.interface';
import { OEM, PSM, createWorker } from 'tesseract.js';
import Jimp from 'jimp';

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

export const parseTextFromPhoto = async (
  image: string,
  status: BotStatus,
  articul: string,
  title: string,
): Promise<string> => {
  try {
    const worker = await createWorker(['rus', 'eng'], OEM.LSTM_ONLY);
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
      tessedit_char_blacklist: '\n',
    });

    await imageToGray(image, status);

    const {
      data: { text },
    } = await worker.recognize('grayscale_image.jpg');
    //console.log('Распознанный текст: ', text.replace(/\s/g, ' '));

    await worker.terminate();
    return checkParse(text, status, articul, title);
  } catch (e) {
    console.log('parseText=', e);
    return null;
  }
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
      case 'Отзыв на проверке':
        result = checkComment(title, text);
        break;
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

async function imageToGray(imgUrl: string, status: BotStatus) {
  try {
    const image = await Jimp.read(imgUrl);
    status === 'Поиск'
      ? image.normalize().dither565()
      : image.grayscale().normalize().dither565();

    return await image.writeAsync('grayscale_image.jpg');
  } catch (e) {
    console.log('imageToGray=', e);
    return null;
  }
}

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

/* проверка фото чека */
const checkCheck = (data: string, text: string): ResponseParse => {
  try {
    const count = (text.match(/receipt.wb.ru/g) || []).length;
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
PageSegMod представляет собой целочисленное значение, которое указывает Tesseract, как он должен сегментировать страницу для распознавания текста. Доступные значения для PageSegMod включают:

1. PSM_OSD_ONLY (0) - Определяет только ориентацию и направление письма.
2. PSM_AUTO_OSD (1) - Автоматически определяет ориентацию и направление письма.
3. PSM_AUTO_ONLY (2) - Автоматически определяет страницу, но не выполняет распознавание.
4. PSM_AUTO (3) - Автоматически определяет страницу и выполняет распознавание.
5. PSM_SINGLE_COLUMN (4) - Обрабатывает страницу как единый столбец текста.
6. PSM_SINGLE_BLOCK_VERT_TEXT (5) - Обрабатывает страницу как единый вертикальный текстовый блок.
7. PSM_SINGLE_BLOCK (6) - Обрабатывает страницу как единый текстовый блок.
8. PSM_SINGLE_LINE (7) - Обрабатывает страницу как единую строку текста.
9. PSM_SINGLE_WORD (8) - Обрабатывает страницу как единое слово.
10. PSM_CIRCLE_WORD (9) - Обрабатывает страницу как единое слово в круге.
11. PSM_SINGLE_CHAR (10) - Обрабатывает страницу как единый символ.
12. PSM_SPARSE_TEXT (11) - Обрабатывает страницу как разреженный текст без поиска структуры.
13. PSM_SPARSE_TEXT_OSD (12) - Обрабатывает страницу как разреженный текст с определением ориентации и направления письма.

2. `tessedit_char_whitelist: string`:
   - Описание: Указывает список допустимых символов (белый список).
   - Пример значения: "0123456789" — разрешает только цифры.

3. `tessedit_char_blacklist: string`:
   - Описание: Указывает список запрещенных символов (черный список).
   - Пример значения: "abcdefghijklmnopqrstuvwxyz" — запрещает все строчные буквы.

4. `preserve_interword_spaces: string`:
   - Описание: Указывает, следует ли сохранять пробелы между словами.
   - Возможные значения: "0" (не сохранять пробелы) или "1" (сохранять пробелы).

5. `user_defined_dpi: string`:
   - Описание: Указывает разрешение изображения в DPI (dots per inch).
   - Пример значения: "300" — устанавливает разрешение изображения на 300 DPI.

6. `tessjs_create_hocr: string`:
   - Описание: Указывает, следует ли создавать HOCR (HTML Output for OCR).
   - Возможные значения: "0" (не создавать) или "1" (создавать).

7. `tessjs_create_tsv: string`:
   - Описание: Указывает, следует ли создавать TSV (Tab-Separated Values) файл.
   - Возможные значения: "0" (не создавать) или "1" (создавать).

8. `tessjs_create_box: string`:
   - Описание: Указывает, следует ли создавать BOX файл (формат файла для тренировочных данных Tesseract).
   - Возможные значения: "0" (не создавать) или "1" (создавать).

9. `tessjs_create_unlv: string`:
   - Описание: Указывает, следует ли создавать UNLV файл (формат файла для тренировочных данных UNLV).
   - Возможные значения: "0" (не создавать) или "1" (создавать).

10. `tessjs_create_osd: string`:
    - Описание: Указывает, следует ли выполнять определение ориентации и скрипта (OSD).
    - Возможные значения: "0" (не выполнять) или "1" (выполнять).

11. `[propName: string]: any`:
    - Описание: Позволяет добавлять любые другие произвольные параметры, которые могут быть поддержаны Tesseract.
*/
