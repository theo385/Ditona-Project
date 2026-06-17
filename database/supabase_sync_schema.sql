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

CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TEXT DEFAULT ''
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_all_orders ON orders;
DROP POLICY IF EXISTS allow_all_messages ON messages;
DROP POLICY IF EXISTS allow_all_appointments ON appointments;
DROP POLICY IF EXISTS allow_all_training ON training_requests;
DROP POLICY IF EXISTS allow_all_site_content ON site_content;

CREATE POLICY allow_all_orders ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_messages ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_appointments ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_training ON training_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_site_content ON site_content FOR ALL USING (true) WITH CHECK (true);
