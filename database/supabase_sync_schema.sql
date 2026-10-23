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
DROP POLICY IF EXISTS public_insert_orders ON orders;
DROP POLICY IF EXISTS admin_manage_orders ON orders;
DROP POLICY IF EXISTS public_insert_messages ON messages;
DROP POLICY IF EXISTS admin_manage_messages ON messages;
DROP POLICY IF EXISTS public_insert_appointments ON appointments;
DROP POLICY IF EXISTS admin_manage_appointments ON appointments;
DROP POLICY IF EXISTS public_insert_training_requests ON training_requests;
DROP POLICY IF EXISTS admin_manage_training_requests ON training_requests;
DROP POLICY IF EXISTS public_insert_maintenance_requests ON maintenance_requests;
DROP POLICY IF EXISTS admin_manage_maintenance_requests ON maintenance_requests;
DROP POLICY IF EXISTS public_read_comments ON machine_comments;
DROP POLICY IF EXISTS public_insert_comments ON machine_comments;
DROP POLICY IF EXISTS admin_manage_comments ON machine_comments;
DROP POLICY IF EXISTS public_read_site_content ON site_content;
DROP POLICY IF EXISTS admin_manage_site_content ON site_content;
DROP POLICY IF EXISTS customer_read_own_account ON customer_accounts;
DROP POLICY IF EXISTS customer_insert_own_account ON customer_accounts;
DROP POLICY IF EXISTS customer_update_own_account ON customer_accounts;
DROP POLICY IF EXISTS admin_manage_customer_accounts ON customer_accounts;
DROP POLICY IF EXISTS media_public_read ON storage.objects;
DROP POLICY IF EXISTS media_admin_insert ON storage.objects;
DROP POLICY IF EXISTS media_admin_update ON storage.objects;
DROP POLICY IF EXISTS media_admin_delete ON storage.objects;

-- One row is created manually for each administrator, with their auth.users id.
CREATE TABLE IF NOT EXISTS admin_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_read_own_profile ON admin_profiles;
CREATE POLICY admin_read_own_profile ON admin_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- SECURITY DEFINER avoids an RLS recursion while policies determine whether a
-- signed-in user is an administrator. The fixed search_path prevents search
-- path injection into this privileged function.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()) $$;

-- Forms are insert-only for visitors. Requests and customer PII can only be
-- read, changed, or deleted by a signed-in administrator.
CREATE POLICY public_insert_orders ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY admin_manage_orders ON orders FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY public_insert_messages ON messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY admin_manage_messages ON messages FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY public_insert_appointments ON appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY admin_manage_appointments ON appointments FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY public_insert_training_requests ON training_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY admin_manage_training_requests ON training_requests FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY public_insert_maintenance_requests ON maintenance_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY admin_manage_maintenance_requests ON maintenance_requests FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY public_read_comments ON machine_comments FOR SELECT TO anon, authenticated USING (status = 'Publie');
CREATE POLICY public_insert_comments ON machine_comments FOR INSERT TO anon, authenticated WITH CHECK (status = 'Publie');
CREATE POLICY admin_manage_comments ON machine_comments FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY public_read_site_content ON site_content FOR SELECT TO anon, authenticated USING (key = 'main');
CREATE POLICY admin_manage_site_content ON site_content FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY customer_read_own_account ON customer_accounts FOR SELECT TO authenticated USING (id = auth.uid()::text);
CREATE POLICY customer_insert_own_account ON customer_accounts FOR INSERT TO authenticated WITH CHECK (id = auth.uid()::text);
CREATE POLICY customer_update_own_account ON customer_accounts FOR UPDATE TO authenticated USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);
CREATE POLICY admin_manage_customer_accounts ON customer_accounts FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Public media may be displayed by the site, but only admins can upload,
-- replace, or delete it. These policy names match store.js.
CREATE POLICY media_public_read ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'ditona-media');
CREATE POLICY media_admin_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ditona-media' AND is_admin());
CREATE POLICY media_admin_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ditona-media' AND is_admin()) WITH CHECK (bucket_id = 'ditona-media' AND is_admin());
CREATE POLICY media_admin_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ditona-media' AND is_admin());
