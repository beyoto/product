// Загружает фото из папки demo-photos в Cloudinary (demo/<тип>/<товар>-<фото>) и вписывает ссылки
// в images в config/demoProducts.js. Запуск: node src/scripts/uploadDemoPhotos.js [тип ...]
// Без аргументов — все типы, у которых есть фото. Повторный запуск перезаписывает те же фото.

const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

const PHOTOS_DIR = path.resolve(__dirname, '../../../../demo-photos');
const CONFIG_FILE = path.resolve(__dirname, '../config/demoProducts.js');
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

function listDirs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
}

// Заменяет n-й список images (по порядку) внутри блока типа
function setImages(source, type, index, urls) {
  const start = source.indexOf(`\n  ${type}: [`);
  if (start === -1) throw new Error(`Тип ${type} не найден в demoProducts.js`);
  const re = /images: \[[^\]]*\]/g;
  re.lastIndex = start;
  let match;
  for (let i = 0; i <= index; i += 1) {
    match = re.exec(source);
    if (!match) throw new Error(`У типа ${type} нет товара №${index + 1}`);
  }
  const list = urls.length ? `[\n${urls.map((u) => `        '${u}',`).join('\n')}\n      ]` : '[]';
  return source.slice(0, match.index) + `images: ${list}` + source.slice(match.index + match[0].length);
}

async function main() {
  const only = process.argv.slice(2);
  let source = fs.readFileSync(CONFIG_FILE, 'utf8');

  for (const typeDir of listDirs(PHOTOS_DIR)) {
    const type = (typeDir.match(/\(([a-z]+)\)/) || [])[1];
    if (!type || (only.length && !only.includes(type))) continue;

    for (const productDir of listDirs(path.join(PHOTOS_DIR, typeDir))) {
      const number = parseInt(productDir, 10);
      if (!number) continue;
      const files = fs.readdirSync(path.join(PHOTOS_DIR, typeDir, productDir)).filter((f) => IMAGE_RE.test(f)).sort();
      if (!files.length) continue;

      const urls = [];
      for (const [i, file] of files.entries()) {
        // Файл передаётся содержимым: путь с эмодзи Cloudinary не читает
        const data = fs.readFileSync(path.join(PHOTOS_DIR, typeDir, productDir, file)).toString('base64');
        const mime = path.extname(file).slice(1).toLowerCase().replace('jpg', 'jpeg');
        const result = await cloudinary.uploader.upload(`data:image/${mime};base64,${data}`, {
          folder: `demo/${type}`,
          public_id: `${number}-${i + 1}`,
          overwrite: true,
          unique_filename: false,
        });
        urls.push(result.secure_url);
        console.log(`${type} №${number}: ${file} → ${result.secure_url}`);
      }
      source = setImages(source, type, number - 1, urls);
    }
  }

  fs.writeFileSync(CONFIG_FILE, source);
  console.log('Готово: ссылки записаны в config/demoProducts.js');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
