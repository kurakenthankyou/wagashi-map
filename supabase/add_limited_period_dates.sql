-- 期間限定の開始日・終了日カラムを追加
ALTER TABLE shops ADD COLUMN IF NOT EXISTS limited_start date;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS limited_end date;
