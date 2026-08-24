import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.resolve('public/icons/favicon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  console.log('Generating 192x192 PNG...');
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve('public/icons/icon-192x192.png'));

  console.log('Generating 512x512 PNG...');
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/icons/icon-512x512.png'));

  console.log('Generating maskable 512x512 PNG...');
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/icons/icon-maskable-512x512.png'));

  console.log('All icons generated successfully!');
}

generate().catch(console.error);
