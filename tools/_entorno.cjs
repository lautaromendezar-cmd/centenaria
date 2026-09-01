// Resuelve las rutas que cambian entre máquinas: dónde están los node_modules
// (este repo no puede tener package.json, ver README) y dónde está Chrome.
const { createRequire } = require('module');
const fs = require('fs');

const CANDIDATOS_MODULES = [
  'C:/Users/Lautaro/Desktop/Claude/latina/node_modules/', // PC de casa
  'C:/Users/Lautaro/Desktop/Claude/node_modules/',        // notebook
];
const CANDIDATOS_CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

const modules = CANDIDATOS_MODULES.find(p => fs.existsSync(p));
if (!modules) {
  console.error('No hay node_modules con sharp/puppeteer-core en ninguna ruta conocida.');
  console.error('Correr `npm i sharp puppeteer-core` en una de estas carpetas (fuera del repo):');
  CANDIDATOS_MODULES.forEach(p => console.error('  ' + p.replace(/\/node_modules\/$/, '')));
  process.exit(1);
}

const CHROME = CANDIDATOS_CHROME.find(p => fs.existsSync(p));
if (!CHROME) console.error('Aviso: no se encontró Chrome en las rutas conocidas.');

module.exports = { req: createRequire(modules), CHROME };
