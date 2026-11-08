export const CATEGORY_LABELS = {
  roses: 'Розы',
  tulips: 'Тюльпаны',
  peonies: 'Пионы',
  lilies: 'Лилии',
  chrysanthemums: 'Хризантемы',
  bouquets: 'Букеты',
};

export const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const CURRENCY = 'сом';
