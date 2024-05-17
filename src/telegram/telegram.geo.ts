export const getGeoUrl = (longitude: number, latitude: number) => {
  return `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
};

export const parseGeoResponse = (data: any): string => {
  try {
    const value = data?.address;
    if (value) {
      return value.city + ', ' + value.country;
    } else {
      return null;
    }
  } catch (e) {
    console.log('parseGeoResponse', e);
    return null;
  }
};
