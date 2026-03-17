-- shopsテーブルへカラム追加
-- Supabase SQL Editorで実行してください

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS is_inside_gate  boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS closed_days     text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_methods text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS media_mentions  jsonb    DEFAULT '[]'::jsonb;

-- コメント
COMMENT ON COLUMN shops.is_inside_gate  IS '改札内かどうか';
COMMENT ON COLUMN shops.closed_days     IS '定休日 例: {"月曜日","祝日"}';
COMMENT ON COLUMN shops.payment_methods IS '決済方法 例: {"現金","カード","PayPay","交通系IC"}';
COMMENT ON COLUMN shops.media_mentions  IS 'メディア掲載情報 例: [{"name":"食べログ","url":"...","date":"2024-01"}]';
