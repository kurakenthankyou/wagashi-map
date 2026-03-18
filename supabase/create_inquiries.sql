-- お問い合わせテーブルを作成
-- Supabase SQL Editorで実行してください

CREATE TABLE IF NOT EXISTS inquiries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id),
  user_name   text        NOT NULL DEFAULT '',
  subject     text        NOT NULL,
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inquiry_replies (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id   uuid        NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  user_id      uuid        REFERENCES auth.users(id),
  user_name    text        NOT NULL DEFAULT '',
  content      text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS（Row Level Security）を有効化
ALTER TABLE inquiries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_replies ENABLE ROW LEVEL SECURITY;

-- 全員が読める
CREATE POLICY "inquiries_select"        ON inquiries       FOR SELECT USING (true);
CREATE POLICY "inquiry_replies_select"  ON inquiry_replies FOR SELECT USING (true);

-- ログインユーザーが投稿できる
CREATE POLICY "inquiries_insert"        ON inquiries       FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inquiry_replies_insert"  ON inquiry_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
