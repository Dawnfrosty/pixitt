const puppeteer = require("puppeteer");
const Jimp = require("jimp");
const express = require("express");
const path = require("path");

// ====== PALLET WARNA CONTOH ======
// Ganti dengan palet Wplace jika mau
const palette = [
  { r: 255, g: 0, b: 0 },     // merah
  { r: 0, g: 255, b: 0 },     // hijau
  { r: 0, g: 0, b: 255 },     // biru
  { r: 0, g: 0, b: 0 },       // hitam
  { r: 255, g: 255, b: 255 }  // putih
];

// ====== FUNGSI CARI WARNA TERDEKAT ======
function closestColor(r, g, b) {
  let best = palette[0];
  let minDist = Infinity;
  for (let c of palette) {
    let dist = Math.sqrt((r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2);
    if (dist < minDist) {
      minDist = dist;
      best = c;
    }
  }
  return `rgb(${best.r},${best.g},${best.b})`;
}

(async () => {
  // ====== SERVE CANVAS.HTML ======
  const app = express();
  app.use(express.static(path.join(__dirname)));
  const server = app.listen(3000, () => {
    console.log("Server berjalan di http://localhost:3000/canvas.html");
  });

  // ====== BACA GAMBAR TARGET ======
  const img = await Jimp.read("sketsa.png");
  const width = img.bitmap.width;
  const height = img.bitmap.height;

  // ====== JALANKAN PUPPETEER ======
  const browser = await puppeteer.launch({
    headless: true, // di Replit biasanya cuma bisa headless
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/canvas.html");

  // Loop semua pixel
  let totalPixels = width * height;
  let painted = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = img.getPixelColor(x, y);
      const { r, g, b } = Jimp.intToRGBA(color);
      const targetColor = closestColor(r, g, b);

      // Ambil warna yang ada di kanvas sekarang
      const currentColor = await page.evaluate((x, y) => {
        return window.getPixelColor(x, y);
      }, x, y);

      // Hanya menggambar kalau warna berbeda
      if (currentColor !== targetColor) {
        await page.evaluate((x, y, color) => {
          window.placePixel(x, y, color);
        }, x, y, targetColor);
        painted++;
      }
    }
  }

  console.log(`Selesai! Total pixel digambar: ${painted} dari ${totalPixels}`);
  await browser.close();
  server.close();
})();

