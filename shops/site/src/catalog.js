// Отображение товара по описанию типа магазина (type.fields и type.categories приходят с бэкенда).

export function formatPrice(price, currency) {
  const value = Number(price);
  return value > 0 ? `${value.toLocaleString('ru-RU')} ${currency}` : 'Цена по запросу';
}

export const categoryLabel = (type, value) => (
  type.categories.find((category) => category.value === value)?.label || value
);

const optionLabel = (field, value) => field.options.find((option) => option.value === value)?.label || value;

export function formatValue(field, value) {
  switch (field.type) {
    case 'select':
      return optionLabel(field, value);
    case 'multiselect':
      return value.map((item) => optionLabel(field, item)).join(', ');
    case 'number':
      return `${Number(value).toLocaleString('ru-RU')}${field.unit ? ` ${field.unit}` : ''}`;
    default:
      return String(value);
  }
}

// Заполненные характеристики товара в порядке полей типа.
export function productFacts(type, product, { cardOnly = false } = {}) {
  const attributes = product.attributes || {};
  return type.fields
    .filter((field) => (!cardOnly || field.card) && attributes[field.key] !== undefined)
    .map((field) => ({ key: field.key, label: field.label, value: formatValue(field, attributes[field.key]) }));
}

export const whatsappUrl = (info) => {
  const digits = info.whatsapp || info.phoneDigits;
  return digits ? `https://wa.me/${digits}` : '';
};
