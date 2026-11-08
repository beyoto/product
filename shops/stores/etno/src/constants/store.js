export const STORE = {
  name: 'ETNO ZAMANBAP',
  phone: '+996 707 780 048',
  phoneHref: 'tel:+996707780048',
  whatsapp: '996707780048',
  instagram: 'https://www.instagram.com/etno.zamanbap/',
  address: 'Suerkulova 1/5, Bishkek, Kyrgyzstan',
  map: 'https://2gis.kg/bishkek/search/Suerkulova%201%2F5',
};

export const CATEGORIES = [
  { value: 'tshirt', label: 'Футболка' },
  { value: 'jeans', label: 'Джинсы' },
  { value: 'jacket', label: 'Куртка' },
  { value: 'hoodie', label: 'Худи' },
  { value: 'shirt', label: 'Рубашка' },
  { value: 'pants', label: 'Брюки' },
  { value: 'shorts', label: 'Шорты' },
  { value: 'shoes', label: 'Обувь' },
];

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map(({ value, label }) => [value, label])
);
