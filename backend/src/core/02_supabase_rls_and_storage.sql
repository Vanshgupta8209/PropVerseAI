-- ══════════════════════════════════════════════════════════════════
-- PropVerse AI — Supabase Row Level Security (RLS) & Storage Config
-- ══════════════════════════════════════════════════════════════════

-- 1. Enable Row Level Security (RLS) on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_property_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 2. Profiles RLS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Properties RLS Policies
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
CREATE POLICY "Properties are viewable by everyone"
  ON public.properties FOR SELECT USING (status = 'active' OR owner_id = auth.uid() OR auth.jwt()->>'role' = 'admin');

DROP POLICY IF EXISTS "Owners can insert properties" ON public.properties;
CREATE POLICY "Owners can insert properties"
  ON public.properties FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update own properties" ON public.properties;
CREATE POLICY "Owners can update own properties"
  ON public.properties FOR UPDATE USING (auth.uid() = owner_id OR auth.jwt()->>'role' = 'admin');

DROP POLICY IF EXISTS "Owners can delete own properties" ON public.properties;
CREATE POLICY "Owners can delete own properties"
  ON public.properties FOR DELETE USING (auth.uid() = owner_id OR auth.jwt()->>'role' = 'admin');

-- 4. Property Favorites RLS Policies
DROP POLICY IF EXISTS "Users can view own favorites" ON public.property_favorites;
CREATE POLICY "Users can view own favorites"
  ON public.property_favorites FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add own favorites" ON public.property_favorites;
CREATE POLICY "Users can add own favorites"
  ON public.property_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.property_favorites;
CREATE POLICY "Users can delete own favorites"
  ON public.property_favorites FOR DELETE USING (auth.uid() = user_id);

-- 5. Property Inquiries RLS Policies
DROP POLICY IF EXISTS "Users can view own inquiries or property owner view" ON public.property_inquiries;
CREATE POLICY "Users can view own inquiries or property owner view"
  ON public.property_inquiries FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.properties WHERE id = property_inquiries.property_id AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create inquiries" ON public.property_inquiries;
CREATE POLICY "Users can create inquiries"
  ON public.property_inquiries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Chat Messages RLS Policies
DROP POLICY IF EXISTS "Members can view room messages" ON public.messages;
CREATE POLICY "Members can view room messages"
  ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_members WHERE room_id = messages.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can insert room messages" ON public.messages;
CREATE POLICY "Members can insert room messages"
  ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.chat_members WHERE room_id = messages.room_id AND user_id = auth.uid())
  );

-- 7. Notifications RLS Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- 8. Supabase Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('property-images', 'property-images', true),
  ('property-documents', 'property-documents', false),
  ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 9. Storage Buckets RLS Policies
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
CREATE POLICY "Avatar Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar User Upload" ON storage.objects;
CREATE POLICY "Avatar User Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Property Images Public Access" ON storage.objects;
CREATE POLICY "Property Images Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Property Images User Upload" ON storage.objects;
CREATE POLICY "Property Images User Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- 10. Enable Supabase Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.property_inquiries;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
