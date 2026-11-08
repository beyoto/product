export const STORE = {
  name: 'Ernis Costumes',
  category: 'Мужские костюмы · рубашки · аксессуары',
  headerSubtitle: 'Мужские костюмы · Бишкек',
  footerTagline: 'Мужские костюмы на продажу и напрокат',
  phone: {
    display: '0501 111 105',
    digits: '996501111105',
  },
  instagram: {
    label: 'Instagram',
    url: 'https://www.instagram.com/ernis_costumes.kg/',
  },
  stores: [
    {
      city: 'Бишкек',
      address: 'Открыть магазин на карте',
      mapUrl: 'https://2gis.kg/bishkek/firm/70000001034247502',
    },
  ],
};

export const WHATSAPP_URL = `https://wa.me/${STORE.phone.digits}`;
