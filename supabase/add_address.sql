-- shopsテーブルに住所カラムを追加 + lat/lngをNULL許容に変更
-- Supabase SQL Editorで実行してください

-- 1. 住所カラムを追加
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS address text DEFAULT NULL;

COMMENT ON COLUMN shops.address IS '住所 例: 東京都新宿区新宿3-1-1';

-- 2. lat / lng を NULL 許容に変更（ユーザー申請時はまだ座標不明のため）
ALTER TABLE shops
  ALTER COLUMN lat DROP NOT NULL,
  ALTER COLUMN lng DROP NOT NULL;
