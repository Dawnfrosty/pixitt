const puppeteer = require('puppeteer');
const Jimp = require('jimp');

// palet warna Wplace contoh
const palette = [
  {name: 'Red', r: 255, g: 0, b: 0},
  {name: 'Green', r: 0, g: 255, b: 0},
  {name: 'Blue', r: 0, g: 0, b: 255},
  {name: 'Black', r: 0, g: 0, b: 0},
  {name: 'White', r: 255, g: 255, b: 255}
];

// fungsi cari warna terdekat
function closestColor(r, g, b) {
  let best = palette[0];
  let minDist = Infinity;
  for (let c of palette) {
    let dist = Math.sqrt((r-c.r)**2 + (g-c.g)**2 + (b-c.b)**2);
    if (dist < minDist) {
      minDist = dist;
      best = c;
    }
  }
  return `rgb(${best.r},${best.g},${best.b})`;
}

(async () => {
  // load gambar
  const img = await Jimp.read('sketsa.png');
  const width = img.bitmap.width;
  const height = img.bitmap.height;

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // buka canvas dummy lokal
  await page.goto(`file://${__dirname}/canvas.html`);

  // loop semua pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = img.getPixelColor(x, y);
      const { r, g, b } = Jimp.intToRGBA(color);
      const closest = closestColor(r, g, b);

      // panggil fungsi placePixel di canvas.html
      await page.evaluate((x, y, color) => {
        window.placePixel(x, y, color);
      }, x, y, closest);
    }
  }

  console.log('Gambar selesai digambar di kanvas dummy!');
})();
