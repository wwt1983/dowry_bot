import Jimp from 'jimp';
import jsQR from 'jsqr';

export async function parseQrCode(imgUrl) {
  try {
    const image = await Jimp.read(imgUrl);
    const imageData = {
      data: new Uint8ClampedArray(image.bitmap.data),
      width: image.bitmap.width,
      height: image.bitmap.height,
    };
    const decodedQR = jsQR(imageData.data, imageData.width, imageData.height);
    if (!decodedQR) {
      return null;
    }

    return decodedQR.data;
  } catch (e) {
    console.log('qrcode error=', e);
    return null;
  }
}
