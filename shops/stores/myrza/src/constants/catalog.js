export const CATEGORY_LABELS = {
  tshirt: 'Футболка',
  jeans: 'Джинсы',
  jacket: 'Куртка',
  hoodie: 'Худи',
  shirt: 'Рубашка',
  pants: 'Брюки',
  shorts: 'Шорты',
  shoes: 'Обувь',
};

export const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const CURRENCY = '₸';
