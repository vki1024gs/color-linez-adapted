const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');

const root = path.join(__dirname, '..');
const placeholders = (value) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

function validateLocales(locales, html, javascript) {
  const base = locales.en;
  if (!base || typeof base !== 'object') throw Error('Missing English locale');
  const keys = Object.keys(base).sort();
  for (const [language, entries] of Object.entries(locales)) {
    const actual = Object.keys(entries).sort();
    if (JSON.stringify(actual) !== JSON.stringify(keys))
      throw Error(`${language} locale keys differ from English`);
    for (const key of keys) {
      if (typeof entries[key] !== 'string' || !entries[key].trim())
        throw Error(`${language}.${key} is empty`);
      if (JSON.stringify(placeholders(entries[key])) !== JSON.stringify(placeholders(base[key])))
        throw Error(`${language}.${key} has different placeholders`);
    }
  }
  const { document } = parseHTML(html);
  for (const element of document.querySelectorAll('[data-i18n]'))
    if (element.textContent.trim())
      throw Error(`Inline text duplicates i18n key: ${element.getAttribute('data-i18n')}`);
  const used = new Set(
    [...document.querySelectorAll('[data-i18n]')].map((element) =>
      element.getAttribute('data-i18n'),
    ),
  );
  for (const attribute of ['data-i18n-title', 'data-i18n-aria-label'])
    for (const element of document.querySelectorAll(`[${attribute}]`))
      used.add(element.getAttribute(attribute));
  for (const match of javascript.matchAll(/\btranslate\(\s*['"]([^'"]+)['"]/g)) used.add(match[1]);
  for (const key of used) if (!Object.hasOwn(base, key)) throw Error(`Unknown i18n key: ${key}`);
  return document;
}

function loadAndValidateLocales() {
  const locales = require('./locales.json');
  const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
  const javascript = fs
    .readdirSync(path.join(root, 'src'), { recursive: true })
    .filter((file) => file.endsWith('.js') && !file.startsWith('generated'))
    .map((file) => fs.readFileSync(path.join(root, 'src', file), 'utf8'))
    .join('\n');
  return { locales, html, document: validateLocales(locales, html, javascript) };
}

module.exports = { validateLocales, loadAndValidateLocales };
