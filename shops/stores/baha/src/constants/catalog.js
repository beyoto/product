export const CATEGORY_LABELS = {
  sedan: 'Седан',
  suv: 'Кроссовер / внедорожник',
  hatchback: 'Хэтчбек',
  minivan: 'Минивэн',
  coupe: 'Купе',
  pickup: 'Пикап',
};

export const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const CURRENCY = 'сом';
export const formatPrice = (value) => `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(value) || 0)} ${CURRENCY}`;
