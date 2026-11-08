import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { storage } from '../site.js';

const FavoritesContext = createContext(null);

function readFavorites() {
  try {
    const parsed = JSON.parse(storage.get('favorites') || '[]');
    return Array.isArray(parsed) ? parsed.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(readFavorites);

  useEffect(() => {
    storage.set('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Убирает из избранного товары, которых больше нет в каталоге.
  const syncFavorites = useCallback((products) => {
    const existing = new Set(products.map((product) => product.id));
    setFavorites((prev) => prev.filter((id) => existing.has(id)));
  }, []);

  const toggleFavorite = (productId) => {
    setFavorites((prev) => (prev.includes(productId)
      ? prev.filter((id) => id !== productId)
      : [...prev, productId]));
  };

  const isFavorite = (productId) => favorites.includes(productId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, syncFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
