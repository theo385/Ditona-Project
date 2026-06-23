CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  machine_id TEXT,
  machine TEXT NOT NULL,
  price BIGINT,
  client TEXT,
  name TEXT,
  firstname TEXT,
  email TEXT,
  phone TEXT,
  note TEXT,
  status TEXT DEFAULT 'Nouvelle',
  reply TEXT DEFAULT '',
  seen_at TEXT DEFAULT '',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT,
  auto_reply TEXT DEFAULT '',
  reply TEXT DEFAULT '',
  status TEXT DEFAULT 'Nouveau',
  seen_at TEXT DEFAULT '',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  date TEXT,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'Nouveau',
  reply TEXT DEFAULT '',
  seen_at TEXT DEFAULT '',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS training_requests (
  id TEXT PRIMARY KEY,
  name TEXT,
  firstname TEXT,
  phone TEXT,
  email TEXT,
  training TEXT,
  level TEXT,
  message TEXT,
  subject TEXT,
  status TEXT DEFAULT 'Nouveau',
  reply TEXT DEFAULT '',
  seen_at TEXT DEFAULT '',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id TEXT PRIMARY KEY,
  name TEXT,
  firstname TEXT,
  phone TEXT,
  email TEXT,
  purchased_from_ditona TEXT,
  reference TEXT,
  photo_name TEXT,
  photo_url TEXT,
  behavior TEXT,
  subject TEXT,
  status TEXT DEFAULT 'Nouveau',
  reply TEXT DEFAULT '',
  seen_at TEXT DEFAULT '',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS machine_comments (
  id TEXT PRIMARY KEY,
  machine_id TEXT,
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'Publie',
  seen_at TEXT DEFAULT '',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS customer_accounts (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT DEFAULT '',
  role TEXT DEFAULT 'acheteur',
  provider TEXT DEFAULT '',
  last_login_at TEXT DEFAULT ''
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('ditona-media', 'ditona-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_all_orders ON orders;
DROP POLICY IF EXISTS allow_all_messages ON messages;
DROP POLICY IF EXISTS allow_all_appointments ON appointments;
DROP POLICY IF EXISTS allow_all_training ON training_requests;
DROP POLICY IF EXISTS allow_all_maintenance ON maintenance_requests;
DROP POLICY IF EXISTS allow_all_machine_comments ON machine_comments;
DROP POLICY IF EXISTS allow_all_site_content ON site_content;
DROP POLICY IF EXISTS allow_all_customer_accounts ON customer_accounts;
DROP POLICY IF EXISTS allow_public_media_read ON storage.objects;
DROP POLICY IF EXISTS allow_public_media_insert ON storage.objects;
DROP POLICY IF EXISTS allow_public_media_update ON storage.objects;
DROP POLICY IF EXISTS allow_public_media_delete ON storage.objects;

CREATE POLICY allow_all_orders ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_messages ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_appointments ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_training ON training_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_maintenance ON maintenance_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_machine_comments ON machine_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_site_content ON site_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_customer_accounts ON customer_accounts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY allow_public_media_read ON storage.objects FOR SELECT USING (bucket_id = 'ditona-media');
CREATE POLICY allow_public_media_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ditona-media');
CREATE POLICY allow_public_media_update ON storage.objects FOR UPDATE USING (bucket_id = 'ditona-media') WITH CHECK (bucket_id = 'ditona-media');
CREATE POLICY allow_public_media_delete ON storage.objects FOR DELETE USING (bucket_id = 'ditona-media');
