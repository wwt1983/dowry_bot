import puppeteer from 'puppeteer';

export const getParseWbInfo = async (articul: string) => {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--disable-gpu',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--no-zygote',
      ],
    });
    const page = await browser.newPage();
    await page.goto(
      `https://www.wildberries.ru/catalog/${articul}/detail.aspx`,
      {
        waitUntil: 'networkidle0',
      },
    );

    await page.setViewport({ width: 1280, height: 720 });

    const wbScreen = await page.screenshot();
    await browser.close();
    return wbScreen;
  } catch (e) {
    console.log('getParseWbInfo=', e);
    return null;
  }
};
