//limit 1000 on free

const TOKEN = '472c7572-704e-4189-bad4-257774d83457';

export const getGeoUrl = (longitude: number, latitude: number) => {
  return `https://geocode-maps.yandex.ru/1.x?format=json&lang=ru_RU&result=1&kind=locality&geocode=${longitude},${latitude}&apikey=${TOKEN}`;
};

export const parseGeoResponse = (data: any): string => {
  try {
    const value =
      data?.response?.GeoObjectCollection?.featureMember[0].GeoObject;
    if (value) {
      return value.name + ', ' + value.description;
    } else {
      return null;
    }
  } catch (e) {
    console.log('parseGeoResponse', e);
    return null;
  }
};
