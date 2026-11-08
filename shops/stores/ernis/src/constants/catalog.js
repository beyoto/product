export const CATEGORY_LABELS = {
  suits: 'Костюмы',
  shirts: 'Рубашки',
  accessories: 'Аксессуары',
};

export const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const CURRENCY = 'сом';
