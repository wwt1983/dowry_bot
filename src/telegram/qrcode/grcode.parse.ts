import Jimp from 'jimp';
import fs from 'fs';
import QrCode from 'qrcode-reader';

export async function parseQrCode(imgUrl) {
  try {
    const buffer = fs.readFileSync(imgUrl);
    const image = await Jimp.read(buffer);
    if (image instanceof Error) {
      console.error(image);
      return null;
    }
    const qr = new QrCode();
    qr.callback = function (err, value) {
      if (err) {
        console.error(err);
        return null;
      }
      console.log(value.result);
      console.log(value);
    };
    return qr.decode(image.bitmap);
  } catch (e) {
    console.log(e);
    return null;
  }
}
