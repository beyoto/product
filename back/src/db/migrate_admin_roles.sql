-- Роли и доступ к магазинам. Запускать через: npm run migrate:admins
-- Текущие админы получают все магазины, то есть сохраняют прежний доступ.
-- Повторный запуск ничего не меняет.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'admins' AND column_name = 'stores'
  ) THEN
    ALTER TABLE admins
      ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'store_admin'
        CHECK (role IN ('super_admin', 'store_admin')),
      ADD COLUMN stores TEXT[] NOT NULL DEFAULT '{}',
      ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

    UPDATE admins SET stores = ARRAY[
      'main', 'asiamixx', 'etno', 'myrzaBrands', 'crowncarat',
      'baha_auto', 'ernis_costumes', 'nova_flowers'
    ];
  END IF;
END $$;
