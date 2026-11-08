export const CATEGORY_LABELS = {
  gold: 'Золото',
  silver: 'Серебро',
  diamond: 'Бриллианты',
};

export const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const CURRENCY = 'сом';
