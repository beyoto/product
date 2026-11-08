// Типы магазинов-конструкторов и цветовые темы.
// Отсюда берут данные и бэкенд (проверка товаров), и панель (форма создания), и сайт магазина.
// Значения полей (value) хранятся в базе — их нельзя переименовывать, подписи (label) — можно.

const opts = (pairs) => pairs.map(([value, label]) => ({ value, label }));

const text = (key, label, extra = {}) => ({ key, label, type: 'text', ...extra });
const number = (key, label, extra = {}) => ({ key, label, type: 'number', ...extra });
const select = (key, label, options, extra = {}) => ({ key, label, type: 'select', options: opts(options), ...extra });
const multi = (key, label, options, extra = {}) => ({ key, label, type: 'multiselect', options: opts(options), ...extra });

const CONDITION = [['new', 'Новый'], ['used', 'Б/у']];

// taglines — варианты подзаголовка для быстрого выбора в панели.
// fields: card — показывать на карточке в каталоге, filter — фильтр в каталоге (только select/multiselect).
const SITE_TYPES = {
  flowers: {
    label: 'Цветы',
    taglines: ['Цветы и букеты · Бишкек', 'Свежие цветы с доставкой', 'Букеты на любой повод'],
    categories: opts([
      ['roses', 'Розы'], ['tulips', 'Тюльпаны'], ['peonies', 'Пионы'], ['chrysanthemums', 'Хризантемы'],
      ['bouquets', 'Букеты'], ['compositions', 'Композиции'], ['potted', 'Комнатные растения'], ['gifts', 'Подарки'],
    ]),
    fields: [
      number('stems', 'Количество цветов', { unit: 'шт', integer: true, card: true }),
      number('height', 'Высота', { unit: 'см', integer: true }),
      text('colors', 'Цвет / оттенки'),
      select('packaging', 'Упаковка', [
        ['paper', 'Упаковочная бумага'], ['box', 'Шляпная коробка'], ['basket', 'Корзина'], ['none', 'Без упаковки'],
      ], { filter: true }),
    ],
    badges: [
      { icon: 'flower', text: 'Свежие цветы' },
      { icon: 'gift', text: 'Букеты на любой повод' },
      { icon: 'heart', text: 'Собираем с любовью' },
    ],
    catalogTitle: 'Найдите свой букет',
  },

  clothing: {
    label: 'Одежда',
    taglines: ['Одежда · Бишкек', 'Стильная одежда на каждый день', 'Мужская и женская одежда'],
    categories: opts([
      ['tshirt', 'Футболки'], ['shirt', 'Рубашки'], ['hoodie', 'Худи и свитшоты'], ['outerwear', 'Верхняя одежда'],
      ['dress', 'Платья'], ['pants', 'Брюки'], ['jeans', 'Джинсы'], ['skirt', 'Юбки'], ['shorts', 'Шорты'],
      ['suit', 'Костюмы'], ['accessory', 'Аксессуары'],
    ]),
    fields: [
      select('gender', 'Для кого', [['women', 'Женское'], ['men', 'Мужское'], ['unisex', 'Унисекс'], ['kids', 'Детское']], { filter: true, card: true }),
      multi('sizes', 'Размеры', [
        ['xs', 'XS'], ['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL'], ['xxl', 'XXL'], ['xxxl', '3XL'],
      ], { filter: true }),
      text('color', 'Цвет'),
      text('material', 'Материал / состав'),
      text('brand', 'Бренд'),
      select('season', 'Сезон', [['all', 'Всесезон'], ['summer', 'Лето'], ['demi', 'Демисезон'], ['winter', 'Зима']]),
    ],
    badges: [
      { icon: 'style', text: 'Актуальные модели' },
      { icon: 'verified', text: 'Проверенное качество' },
      { icon: 'chat', text: 'Поможем с размером' },
    ],
    catalogTitle: 'Каталог одежды',
  },

  shoes: {
    label: 'Обувь',
    taglines: ['Обувь · Бишкек', 'Обувь для всей семьи', 'Кроссовки, ботинки и туфли'],
    categories: opts([
      ['sneakers', 'Кроссовки'], ['boots', 'Ботинки'], ['classic', 'Туфли'], ['sandals', 'Сандалии'],
      ['winter', 'Зимняя обувь'], ['slippers', 'Домашняя обувь'], ['care', 'Уход и аксессуары'],
    ]),
    fields: [
      select('gender', 'Для кого', [['women', 'Женская'], ['men', 'Мужская'], ['unisex', 'Унисекс'], ['kids', 'Детская']], { filter: true, card: true }),
      multi('sizes', 'Размеры', [
        ['30', '30'], ['31', '31'], ['32', '32'], ['33', '33'], ['34', '34'], ['35', '35'], ['36', '36'], ['37', '37'],
        ['38', '38'], ['39', '39'], ['40', '40'], ['41', '41'], ['42', '42'], ['43', '43'], ['44', '44'], ['45', '45'], ['46', '46'],
      ], { filter: true }),
      text('color', 'Цвет'),
      text('material', 'Материал'),
      text('brand', 'Бренд'),
    ],
    badges: [
      { icon: 'verified', text: 'Качественные материалы' },
      { icon: 'style', text: 'Модели на любой сезон' },
      { icon: 'chat', text: 'Поможем с размером' },
    ],
    catalogTitle: 'Каталог обуви',
  },

  jewelry: {
    label: 'Ювелирные изделия',
    taglines: ['Ювелирные украшения · Бишкек', 'Золото и серебро', 'Украшения для особых моментов'],
    categories: opts([
      ['ring', 'Кольца'], ['earrings', 'Серьги'], ['chain', 'Цепочки'], ['bracelet', 'Браслеты'],
      ['pendant', 'Подвески'], ['necklace', 'Колье'], ['set', 'Комплекты'],
    ]),
    fields: [
      select('metal', 'Металл', [
        ['gold', 'Золото'], ['white_gold', 'Белое золото'], ['silver', 'Серебро'], ['platinum', 'Платина'], ['other', 'Другое'],
      ], { filter: true, card: true }),
      select('purity', 'Проба', [['375', '375'], ['585', '585'], ['750', '750'], ['925', '925'], ['999', '999']]),
      number('weight', 'Вес', { unit: 'г', step: 0.01 }),
      text('stones', 'Камни / вставки'),
      text('size', 'Размер'),
    ],
    badges: [
      { icon: 'diamond', text: 'Изделия с пробой' },
      { icon: 'gift', text: 'Подарочная упаковка' },
      { icon: 'verified', text: 'Гарантия качества' },
    ],
    catalogTitle: 'Коллекция украшений',
  },

  doors: {
    label: 'Двери',
    taglines: ['Двери · Бишкек', 'Межкомнатные и входные двери', 'Двери с установкой под ключ'],
    categories: opts([
      ['interior', 'Межкомнатные'], ['entrance', 'Входные'], ['sliding', 'Раздвижные'],
      ['glass', 'Стеклянные'], ['hardware', 'Фурнитура'],
    ]),
    fields: [
      select('material', 'Материал', [
        ['solid_wood', 'Массив'], ['mdf', 'МДФ'], ['veneer', 'Шпон'], ['eco_veneer', 'Экошпон'],
        ['metal', 'Металл'], ['glass', 'Стекло'], ['pvc', 'ПВХ'],
      ], { filter: true, card: true }),
      number('width', 'Ширина', { unit: 'мм', integer: true }),
      number('height', 'Высота', { unit: 'мм', integer: true }),
      number('thickness', 'Толщина полотна', { unit: 'мм', integer: true }),
      select('glazing', 'Остекление', [['none', 'Глухая'], ['partial', 'Частичное'], ['full', 'Полное']], { filter: true }),
      select('opening', 'Открывание', [['left', 'Левое'], ['right', 'Правое'], ['universal', 'Универсальное']]),
      text('color', 'Цвет / покрытие'),
      text('kit', 'Комплектация'),
      text('country', 'Производитель'),
    ],
    badges: [
      { icon: 'door', text: 'Двери в наличии и под заказ' },
      { icon: 'ruler', text: 'Поможем с размерами' },
      { icon: 'verified', text: 'Качественная фурнитура' },
    ],
    catalogTitle: 'Каталог дверей',
  },

  cars: {
    label: 'Автосалон',
    taglines: ['Автосалон · Бишкек', 'Авто в наличии и под заказ', 'Новые и с пробегом'],
    categories: opts([
      ['sedan', 'Седан'], ['suv', 'Внедорожник'], ['crossover', 'Кроссовер'], ['hatchback', 'Хэтчбек'],
      ['minivan', 'Минивэн'], ['coupe', 'Купе'], ['pickup', 'Пикап'],
    ]),
    fields: [
      text('brand', 'Марка', { required: true }),
      text('model', 'Модель', { required: true }),
      number('year', 'Год выпуска', { integer: true, min: 1950, max: 2100, required: true, card: true }),
      number('mileage', 'Пробег', { unit: 'км', integer: true, card: true }),
      select('condition', 'Состояние', [['new', 'Новый'], ['used', 'С пробегом']], { filter: true }),
      select('transmission', 'Коробка', [
        ['automatic', 'Автомат'], ['manual', 'Механика'], ['robot', 'Робот'], ['cvt', 'Вариатор'],
      ], { filter: true }),
      select('fuel', 'Топливо', [
        ['petrol', 'Бензин'], ['diesel', 'Дизель'], ['hybrid', 'Гибрид'], ['electric', 'Электро'], ['gas', 'Газ / бензин'],
      ], { filter: true }),
      text('engine_volume', 'Объём двигателя'),
      select('drive', 'Привод', [['fwd', 'Передний'], ['rwd', 'Задний'], ['awd', 'Полный']]),
      select('steering', 'Руль', [['left', 'Левый'], ['right', 'Правый']]),
      text('color', 'Цвет'),
      text('vin', 'VIN'),
    ],
    badges: [
      { icon: 'car', text: 'Авто в наличии и под заказ' },
      { icon: 'verified', text: 'Проверка перед продажей' },
      { icon: 'chat', text: 'Консультация по выбору' },
    ],
    catalogTitle: 'Автомобили в продаже',
  },

  furniture: {
    label: 'Мебель',
    taglines: ['Мебель · Бишкек', 'Мебель для дома и офиса', 'Мебель на заказ'],
    categories: opts([
      ['sofa', 'Диваны'], ['bed', 'Кровати'], ['table', 'Столы'], ['chair', 'Стулья и кресла'],
      ['wardrobe', 'Шкафы'], ['kitchen', 'Кухни'], ['kids', 'Детская мебель'], ['office', 'Офисная мебель'],
    ]),
    fields: [
      text('material', 'Материал', { card: true }),
      text('dimensions', 'Размеры (Ш × Г × В)'),
      text('color', 'Цвет'),
      select('assembly', 'Сборка', [['assembled', 'Доставляется собранной'], ['required', 'Требуется сборка']]),
      text('country', 'Производитель'),
    ],
    badges: [
      { icon: 'home', text: 'Мебель для всего дома' },
      { icon: 'ruler', text: 'Изготовление под размер' },
      { icon: 'verified', text: 'Надёжные материалы' },
    ],
    catalogTitle: 'Каталог мебели',
  },

  cosmetics: {
    label: 'Косметика',
    taglines: ['Косметика · Бишкек', 'Уход, макияж и парфюмерия', 'Оригинальная косметика'],
    categories: opts([
      ['skincare', 'Уход за лицом'], ['makeup', 'Макияж'], ['hair', 'Уход за волосами'],
      ['body', 'Уход за телом'], ['perfume', 'Парфюмерия'], ['sets', 'Наборы'],
    ]),
    fields: [
      text('brand', 'Бренд', { card: true }),
      number('volume', 'Объём', { unit: 'мл', step: 0.1 }),
      select('skin_type', 'Тип кожи', [
        ['all', 'Для всех типов'], ['dry', 'Сухая'], ['oily', 'Жирная'], ['combination', 'Комбинированная'], ['sensitive', 'Чувствительная'],
      ], { filter: true }),
      text('country', 'Страна'),
    ],
    badges: [
      { icon: 'spa', text: 'Оригинальная продукция' },
      { icon: 'gift', text: 'Подарочные наборы' },
      { icon: 'chat', text: 'Поможем подобрать уход' },
    ],
    catalogTitle: 'Каталог косметики',
  },

  electronics: {
    label: 'Электроника',
    taglines: ['Электроника · Бишкек', 'Смартфоны, ноутбуки, аксессуары', 'Техника с гарантией'],
    categories: opts([
      ['phones', 'Смартфоны'], ['laptops', 'Ноутбуки'], ['tablets', 'Планшеты'], ['audio', 'Аудио'],
      ['watches', 'Смарт-часы'], ['accessories', 'Аксессуары'],
    ]),
    fields: [
      text('brand', 'Бренд', { card: true }),
      text('model', 'Модель'),
      text('memory', 'Память'),
      text('color', 'Цвет'),
      select('condition', 'Состояние', CONDITION, { filter: true, card: true }),
      text('warranty', 'Гарантия'),
    ],
    badges: [
      { icon: 'devices', text: 'Популярные модели' },
      { icon: 'verified', text: 'Гарантия' },
      { icon: 'chat', text: 'Консультация по выбору' },
    ],
    catalogTitle: 'Каталог техники',
  },

  general: {
    label: 'Универсальный',
    taglines: ['Магазин · Бишкек', 'Всё нужное в одном месте', 'Новинки каждую неделю'],
    categories: opts([['goods', 'Товары'], ['new', 'Новинки'], ['popular', 'Популярное'], ['sale', 'Акции']]),
    fields: [
      text('brand', 'Бренд'),
      text('color', 'Цвет'),
      text('size', 'Размер'),
      select('condition', 'Состояние', CONDITION),
    ],
    badges: [
      { icon: 'verified', text: 'Проверенные товары' },
      { icon: 'chat', text: 'Быстро отвечаем' },
      { icon: 'heart', text: 'Работаем для вас' },
    ],
    catalogTitle: 'Каталог',
  },
};

// Цвета: шапка и подвал отдельно от основного фона.
// onAccent — цвет текста на кнопках с фоном accent.
const THEMES = {
  blush: {
    label: 'Пудровый',
    colors: {
      bg: '#fff9f6', surface: '#fffefd', surfaceHover: '#f8efec', text: '#493d3d', muted: '#887979',
      accent: '#b7727d', accentStrong: '#95636b', onAccent: '#ffffff', border: '#eadeda',
      headerBg: '#fff9f6', headerText: '#493d3d', footerBg: '#493d3d', footerText: '#f6ebe8',
    },
  },
  noir: {
    label: 'Золото на чёрном',
    colors: {
      bg: '#0f0e0c', surface: '#191714', surfaceHover: '#231f1b', text: '#f3ecdf', muted: '#a39a8a',
      accent: '#c9a05f', accentStrong: '#e0bd80', onAccent: '#17130f', border: '#2f2a24',
      headerBg: '#0f0e0c', headerText: '#f3ecdf', footerBg: '#080706', footerText: '#cfc6b6',
    },
    dark: true,
  },
  graphite: {
    label: 'Графит',
    colors: {
      bg: '#111418', surface: '#1a1f25', surfaceHover: '#232a32', text: '#eef1f4', muted: '#9aa4af',
      accent: '#e0703a', accentStrong: '#f08a57', onAccent: '#ffffff', border: '#2c343d',
      headerBg: '#0b0e11', headerText: '#eef1f4', footerBg: '#0b0e11', footerText: '#b9c2cc',
    },
    dark: true,
  },
  sage: {
    label: 'Шалфей',
    colors: {
      bg: '#f6f8f3', surface: '#ffffff', surfaceHover: '#edf2e8', text: '#24311f', muted: '#6a7765',
      accent: '#4f7d4a', accentStrong: '#3d6339', onAccent: '#ffffff', border: '#dde5d6',
      headerBg: '#ffffff', headerText: '#24311f', footerBg: '#24311f', footerText: '#e9efe4',
    },
  },
  ocean: {
    label: 'Морской',
    colors: {
      bg: '#f5f8fb', surface: '#ffffff', surfaceHover: '#eaf1f7', text: '#1d2a38', muted: '#627387',
      accent: '#2b6cb0', accentStrong: '#225a93', onAccent: '#ffffff', border: '#d8e2ec',
      headerBg: '#1d2a38', headerText: '#ffffff', footerBg: '#1d2a38', footerText: '#d6e0ea',
    },
  },
  sand: {
    label: 'Песочный минимализм',
    colors: {
      bg: '#f7f4ef', surface: '#fffdf9', surfaceHover: '#efe9df', text: '#2a2622', muted: '#776f66',
      accent: '#2a2622', accentStrong: '#000000', onAccent: '#ffffff', border: '#e4ddd2',
      headerBg: '#f7f4ef', headerText: '#2a2622', footerBg: '#2a2622', footerText: '#efe9df',
    },
  },
};

const toList = (map) => Object.entries(map).map(([key, value]) => ({ key, ...value }));

module.exports = { SITE_TYPES, THEMES, toList };
