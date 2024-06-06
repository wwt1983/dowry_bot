import { BotStatus } from 'src/airtable/types/IBot.interface';
import { OEM, PSM, createWorker } from 'tesseract.js';
import Jimp from 'jimp';

export const parseText = async (
  image: string,
  status: BotStatus,
  data: string,
) => {
  try {
    const worker = await createWorker(['rus', 'eng'], OEM.LSTM_ONLY);
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
    });

    await imageToGray(image);

    const {
      data: { text },
    } = await worker.recognize('grayscale_image.jpg');

    console.log('Распознанный текст: ', text);

    await worker.terminate();
    return checkParse(text, status, data);
  } catch (e) {
    console.log('parseText', e);
    return null;
  }
};

const checkParse = (text: string, status: BotStatus, data: string) => {
  try {
    if (!text) return false;
    switch (status) {
      case 'Артикул правильный':
        const result = checkSearch(data, text);
        return getMessageForSearch(result);
      default:
        return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

async function imageToGray(imgUrl: string) {
  try {
    const image = await Jimp.read(imgUrl);
    image.grayscale().contrast(+0.5).normalize().dither565();
    return await image.writeAsync('grayscale_image.jpg');
  } catch (e) {
    console.log('imageToGray error=', e);
    return null;
  }
}

/*проверка фото поиска*/
const checkSearch = (data: string, text: string) => {
  try {
    if (text.includes('Артикул')) {
      const count = (text.match(/Артикул/g) || []).length;
      return {
        check: true,
        count: count,
      };
    } else {
      if (text.includes('Кошельком')) {
        const count = (text.match(/Кошельком/g) || []).length;
        return {
          check: false,
          count: count,
        };
      }
    }
  } catch (error) {
    console.log(error);
  } finally {
    return {
      check: false,
      count: 0,
    };
  }
};

const getMessageForSearch = (result: { check: boolean; count: number }) => {
  if (!result) return '';
  return `Найдено в фото ${result.count} товара(-ов), 
  ${result.check ? 'артикул заказа ✅' : 'артикула заказа ❌'}
  `;
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
*/
