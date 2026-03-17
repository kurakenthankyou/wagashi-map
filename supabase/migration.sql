-- ① shops テーブルに status と submitted_by を追加
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS status       TEXT    DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS submitted_by UUID    REFERENCES auth.users(id);

-- 既存レコードをすべて approved に
UPDATE shops SET status = 'approved' WHERE status IS NULL;

-- ② RLS ポリシー（参考 / 必要に応じて設定）
-- 一般ユーザーは approved のみ閲覧可
-- CREATE POLICY "approved only" ON shops FOR SELECT USING (status = 'approved');
-- 登録者は自分のお店を更新可能
-- CREATE POLICY "owner update" ON shops FOR UPDATE
--   USING (submitted_by = auth.uid());
