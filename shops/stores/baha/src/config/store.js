export const STORE = {
  name: 'BAHA 777',
  category: 'Автосалон · Авто в наличии и под заказ',
  headerSubtitle: 'Автосалон · Бишкек',
  footerTagline: 'Автомобили, которые выбирают с уверенностью',
  phone: {
    display: '+996 707 780 048',
    digits: '996707780048',
  },
  instagram: {
    label: 'Instagram',
    url: 'https://www.instagram.com/baha_avto777bishkek2/?hl=ru',
  },
  stores: [
    {
      city: 'Бишкек',
      address: 'Льва Толстого, Путепроводная 1/4А',
      mapUrl: 'https://2gis.kg/bishkek/search/%D0%9B%D1%8C%D0%B2%D0%B0%20%D0%A2%D0%BE%D0%BB%D1%81%D1%82%D0%BE%D0%B3%D0%BE%20%D0%9F%D1%83%D1%82%D0%B5%D0%BF%D1%80%D0%BE%D0%B2%D0%BE%D0%B4%D0%BD%D0%B0%D1%8F%201%2F4%D0%90',
    },
  ],
};

export const WHATSAPP_URL = `https://wa.me/${STORE.phone.digits}`;
