export const STORE = {
  name: 'Flowers',
  category: 'Цветы и букеты',
  headerSubtitle: '',
  footerTagline: '',
  phone: {
    display: '',
    digits: '',
  },
  instagram: {
    label: 'Instagram',
    url: '',
  },
  stores: [],
};

export const WHATSAPP_URL = STORE.phone.digits ? `https://wa.me/${STORE.phone.digits}` : '';
