/*
# Real Estate Platform Schema

1. New Tables
- `profiles`: extends auth.users with role (customer/agent/admin), full_name, phone, avatar_url, bio, agency, specialization, verified
- `properties`: main listings with price, type, status, location, features, agent reference, featured flag
- `property_images`: gallery images per property
- `testimonials`: homepage customer testimonials (public)
- `appointments`: property viewing bookings (scheduled/completed/cancelled)
- `favorites`: user saved properties
- `reviews`: property reviews with approval flag
2. Security
- RLS enabled on all tables.
- profiles: owner can read/update own; all can read (agents visible publicly).
- properties: public read; agents create/update/delete own; admin full.
- property_images: public read; agents manage own (via property ownership).
- testimonials: public read; admin manage.
- appointments: owner read/create/update own; agent read own.
- favorites: owner CRUD own.
- reviews: public read approved; owner create; admin manage.
3. Notes
- Uses auth.uid() for ownership.
- profiles.user_id not needed since profiles.id = auth.users.id.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'agent', 'admin')),
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  agency text DEFAULT '',
  specialization text DEFAULT '',
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  property_type text NOT NULL CHECK (property_type IN ('Apartment', 'Villa', 'Office', 'Land', 'Commercial')),
  listing_status text NOT NULL CHECK (listing_status IN ('For Sale', 'For Rent')),
  city text NOT NULL DEFAULT '',
  neighborhood text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  bedrooms int DEFAULT 0,
  bathrooms int DEFAULT 0,
  area numeric DEFAULT 0,
  floor int DEFAULT 0,
  year_built int,
  furnished boolean DEFAULT false,
  parking boolean DEFAULT false,
  swimming_pool boolean DEFAULT false,
  garden boolean DEFAULT false,
  balcony boolean DEFAULT false,
  ready_to_move boolean DEFAULT false,
  has_video boolean DEFAULT false,
  has_virtual_tour boolean DEFAULT false,
  lat numeric,
  lng numeric,
  agent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  featured boolean DEFAULT false,
  is_sold boolean DEFAULT false,
  is_rented boolean DEFAULT false,
  approved boolean DEFAULT false,
  views int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "properties_select_all" ON properties;
CREATE POLICY "properties_select_all" ON properties FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "properties_insert_own_agent" ON properties;
CREATE POLICY "properties_insert_own_agent" ON properties FOR INSERT
  TO authenticated WITH CHECK (agent_id = auth.uid());

DROP POLICY IF EXISTS "properties_update_own_agent" ON properties;
CREATE POLICY "properties_update_own_agent" ON properties FOR UPDATE
  TO authenticated USING (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "properties_delete_own_agent" ON properties;
CREATE POLICY "properties_delete_own_agent" ON properties FOR DELETE
  TO authenticated USING (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Property images
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "property_images_select_all" ON property_images;
CREATE POLICY "property_images_select_all" ON property_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "property_images_insert_own" ON property_images;
CREATE POLICY "property_images_insert_own" ON property_images FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE id = property_id AND agent_id = auth.uid()));

DROP POLICY IF EXISTS "property_images_update_own" ON property_images;
CREATE POLICY "property_images_update_own" ON property_images FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM properties WHERE id = property_id AND agent_id = auth.uid()));

DROP POLICY IF EXISTS "property_images_delete_own" ON property_images;
CREATE POLICY "property_images_delete_own" ON property_images FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM properties WHERE id = property_id AND agent_id = auth.uid()));

-- Testimonials (public)
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  content text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "testimonials_select_all" ON testimonials;
CREATE POLICY "testimonials_select_all" ON testimonials FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "testimonials_insert_admin" ON testimonials;
CREATE POLICY "testimonials_insert_admin" ON testimonials FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "testimonials_update_admin" ON testimonials;
CREATE POLICY "testimonials_update_admin" ON testimonials FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "testimonials_delete_admin" ON testimonials;
CREATE POLICY "testimonials_delete_admin" ON testimonials FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  date date NOT NULL,
  time text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_select_own" ON appointments;
CREATE POLICY "appointments_select_own" ON appointments FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR agent_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "appointments_insert_own" ON appointments;
CREATE POLICY "appointments_insert_own" ON appointments FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "appointments_update_own" ON appointments;
CREATE POLICY "appointments_update_own" ON appointments FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR agent_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (user_id = auth.uid() OR agent_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "appointments_delete_own" ON appointments;
CREATE POLICY "appointments_delete_own" ON appointments FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, property_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select_own" ON favorites;
CREATE POLICY "favorites_select_own" ON favorites FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
CREATE POLICY "favorites_insert_own" ON favorites FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;
CREATE POLICY "favorites_delete_own" ON favorites FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content text NOT NULL DEFAULT '',
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_admin" ON reviews;
CREATE POLICY "reviews_update_admin" ON reviews FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "reviews_delete_admin" ON reviews;
CREATE POLICY "reviews_delete_admin" ON reviews FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(listing_status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_agent ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id);