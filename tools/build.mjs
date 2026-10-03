import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('Building Lumina web distribution...');

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

const filesToCopy = ['index.html', 'manifest.webmanifest'];
const foldersToCopy = ['css', 'fonts', 'icons', 'js'];

for (const file of filesToCopy) {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
    console.log(`Copied ${file}`);
  }
}

for (const folder of foldersToCopy) {
  const src = path.join(rootDir, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, path.join(distDir, folder), { recursive: true });
    console.log(`Copied folder ${folder}`);
  }
}

console.log('Build completed! Dist folder ready for Capacitor.');
