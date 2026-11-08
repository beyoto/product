// Ключ 'main' — роуты без суффикса (/api/products), остальные — /api/products_<ключ>.
const key = import.meta.env.VITE_STORE_KEY;
const suffix = key === 'main' ? '' : `_${key}`;

export const API_PATHS = {
  products: `/products${suffix}`,
  analytics: `/analytics${suffix}`,
};

export const productPath = (id = '') => `${API_PATHS.products}${id ? `/${id}` : ''}`;
export const productImagesPath = (id) => `${productPath(id)}/images`;
