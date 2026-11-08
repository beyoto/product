const { SITE_TYPES, THEMES } = require('../config/siteTypes.js');
const { RESERVED_SLUGS } = require('../config/stores.js');

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/;
const MAX_ADDRESSES = 5;

class ValidationError extends Error {}

const fail = (message) => {
  throw new ValidationError(message);
};

function cleanText(value, label, max, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) fail(`Заполни поле «${label}»`);
    return '';
  }
  if (typeof value !== 'string') fail(`Поле «${label}» должно быть текстом`);
  const trimmed = value.trim();
  if (required && !trimmed) fail(`Заполни поле «${label}»`);
  if (trimmed.length > max) fail(`«${label}»: не длиннее ${max} символов`);
  return trimmed;
}

// Только https, чтобы в ссылку на сайте нельзя было подставить javascript: и т.п.
function cleanUrl(value, label) {
  const url = cleanText(value, label, 600);
  if (!url) return '';
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    fail(`«${label}»: неверная ссылка`);
  }
  if (parsed.protocol !== 'https:') fail(`«${label}»: ссылка должна начинаться с https://`);
  return parsed.href;
}

function validateSlug(slug) {
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) {
    fail('Адрес: 2–40 символов, латиница в нижнем регистре, цифры и дефис');
  }
  if (RESERVED_SLUGS.has(slug)) fail('Этот адрес уже занят');
  return slug;
}

const validateType = (type) => (Object.hasOwn(SITE_TYPES, type) ? type : fail('Неизвестный тип магазина'));
const validateTheme = (theme) => (Object.hasOwn(THEMES, theme) ? theme : fail('Неизвестная тема'));

function validateInfo(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) fail('Неверные данные магазина');

  const phone = cleanText(input.phone, 'Телефон', 30);
  const whatsapp = cleanText(input.whatsapp, 'WhatsApp', 30).replace(/\D/g, '');
  if (whatsapp && (whatsapp.length < 8 || whatsapp.length > 15)) fail('WhatsApp: от 8 до 15 цифр');

  const badges = input.badges ?? [];
  if (!Array.isArray(badges) || badges.length > 3) fail('Преимуществ может быть не больше трёх');

  const addresses = input.addresses ?? [];
  if (!Array.isArray(addresses) || addresses.length > MAX_ADDRESSES) fail(`Адресов может быть не больше ${MAX_ADDRESSES}`);

  return {
    tagline: cleanText(input.tagline, 'Подзаголовок', 120),
    description: cleanText(input.description, 'Описание', 600),
    heroTitle: cleanText(input.heroTitle, 'Заголовок на главной', 80),
    heroText: cleanText(input.heroText, 'Текст на главной', 200),
    badges: badges.map((badge) => cleanText(badge, 'Преимущество', 60)),
    phone,
    phoneDigits: phone.replace(/\D/g, ''),
    whatsapp,
    instagram: cleanUrl(input.instagram, 'Instagram'),
    hours: cleanText(input.hours, 'Режим работы', 120),
    currency: cleanText(input.currency, 'Валюта', 10) || 'сом',
    addresses: addresses
      .map((item) => ({
        city: cleanText(item?.city, 'Город', 60),
        address: cleanText(item?.address, 'Адрес', 200),
        mapUrl: cleanUrl(item?.mapUrl, 'Ссылка на карту'),
      }))
      .filter((item) => item.city || item.address),
  };
}

function checkFieldValue(field, value) {
  switch (field.type) {
    case 'text': {
      if (typeof value !== 'string') fail(`«${field.label}» должно быть текстом`);
      const trimmed = value.trim();
      if (trimmed.length > 200) fail(`«${field.label}»: не длиннее 200 символов`);
      return trimmed;
    }
    case 'number': {
      const num = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(num)) fail(`«${field.label}» должно быть числом`);
      if (field.integer && !Number.isInteger(num)) fail(`«${field.label}» должно быть целым числом`);
      if (num < (field.min ?? 0)) fail(`«${field.label}»: не меньше ${field.min ?? 0}`);
      if (num > (field.max ?? 1e9)) fail(`«${field.label}»: не больше ${field.max ?? 1e9}`);
      return num;
    }
    case 'select':
      if (!field.options.some((option) => option.value === value)) fail(`«${field.label}»: неверное значение`);
      return value;
    case 'multiselect': {
      if (!Array.isArray(value)) fail(`«${field.label}»: неверное значение`);
      const allowed = field.options.map((option) => option.value);
      if (value.some((item) => !allowed.includes(item))) fail(`«${field.label}»: неверное значение`);
      // Порядок как в справочнике, без повторов
      return allowed.filter((item) => value.includes(item));
    }
    default:
      return fail('Неизвестный тип поля');
  }
}

// Особые поля товара. Неизвестные ключи отбрасываются, пустые значения не сохраняются.
function validateAttributes(typeDef, input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) fail('Неверные характеристики товара');

  const result = {};
  for (const field of typeDef.fields) {
    const raw = input[field.key];
    const empty = raw === undefined || raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0);

    if (empty) {
      if (field.required) fail(`Заполни поле «${field.label}»`);
      continue;
    }

    const value = checkFieldValue(field, raw);
    if (value === '' && field.required) fail(`Заполни поле «${field.label}»`);
    if (value !== '') result[field.key] = value;
  }
  return result;
}

// partial: при изменении товара можно прислать только часть полей (например, is_active).
function validateProduct(typeDef, body, { partial = false } = {}) {
  const values = {};
  const has = (key) => body[key] !== undefined;

  if (!partial || has('name')) values.name = cleanText(body.name, 'Название', 255, { required: true });
  if (!partial || has('description')) values.description = cleanText(body.description, 'Описание', 5000);

  if (!partial || has('price')) {
    const price = Number(body.price);
    if (body.price === '' || body.price === null || !Number.isFinite(price) || price < 0 || price > 1e10) {
      fail('Укажи цену (0 — «цена по запросу»)');
    }
    values.price = price;
  }

  if (!partial || has('category')) {
    if (!typeDef.categories.some((category) => category.value === body.category)) fail('Выбери категорию');
    values.category = body.category;
  }

  if (!partial || has('attributes')) values.attributes = validateAttributes(typeDef, body.attributes ?? {});

  if (has('is_active')) {
    if (typeof body.is_active !== 'boolean') fail('is_active must be boolean');
    values.is_active = body.is_active;
  }

  return values;
}

module.exports = {
  ValidationError,
  validateSlug,
  validateType,
  validateTheme,
  validateInfo,
  validateProduct,
};
