import { createContext, useContext } from 'react';

// Настройки магазина с бэкенда: name, info, theme, type (категории и поля).
export const SiteContext = createContext(null);

export const useSite = () => useContext(SiteContext);
