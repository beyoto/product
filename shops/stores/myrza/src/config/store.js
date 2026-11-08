export const STORE = {
  name: 'MYRZA BRANDS',
  category: 'Мужская одежда',
  headerSubtitle: 'Мужская одежда | Алматы | Астана | Шымкент | Орал',
  footerTagline: 'Мужская одежда для твоего стиля',
  phone: {
    display: '+7 708 208 9757',
    digits: '77082089757',
  },
  instagram: {
    label: 'Instagram',
    url: 'https://www.instagram.com/myrza.brands',
  },
  stores: [
    {
      city: 'Алматы',
      address: 'Достық, 36',
      mapUrl: 'https://2gis.kz/almaty/search/Myrza%20Brands%20%D0%94%D0%BE%D1%81%D1%82%D1%8B%D2%9B%2036',
    },
    {
      city: 'Астана',
      address: 'Сығанақ, 58',
      mapUrl: 'https://2gis.kz/astana/search/Myrza%20Brands%20%D0%A1%D1%8B%D2%93%D0%B0%D0%BD%D0%B0%D2%9B%2058',
    },
    {
      city: 'Шымкент',
      address: 'Нұрсат, 29/6 к3',
      mapUrl: 'https://2gis.kz/shymkent/search/Myrza%20Brands%20%D0%9D%D2%B1%D1%80%D1%81%D0%B0%D1%82%2029%2F6%20%D0%BA3',
    },
    {
      city: 'Орал',
      address: 'Абай, 103',
      mapUrl: 'https://2gis.kz/uralsk/search/Myrza%20Brands%20%D0%90%D0%B1%D0%B0%D0%B9%20103',
    },
  ],
};

export const WHATSAPP_URL = `https://wa.me/${STORE.phone.digits}`;
