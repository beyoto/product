// Старые магазины со своим кодом (папки stores/). Их пути не трогает middleware.js,
// а vercel.json отправляет их в собственные сборки. Сверяется при сборке: scripts/stores.mjs.
export const LEGACY_STORES = [
  'asiamixx', 'aveline', 'baha', 'crowncarat', 'ernis', 'etno', 'hayk', 'myrza', 'nova',
];
