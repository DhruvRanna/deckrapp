-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'CREATOR', 'PRO')),
  niches TEXT[] NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  posting_frequency TEXT NOT NULL DEFAULT '',
  swipes_today INTEGER NOT NULL DEFAULT 0,
  scripts_this_month INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_swipe_date DATE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create saved_ideas table
CREATE TABLE public.saved_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  hook TEXT NOT NULL,
  insight TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  duration TEXT NOT NULL DEFAULT '',
  competition TEXT NOT NULL DEFAULT '',
  viral_score INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'save',
  scheduled_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ideas" ON public.saved_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ideas" ON public.saved_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ideas" ON public.saved_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ideas" ON public.saved_ideas FOR DELETE USING (auth.uid() = user_id);

-- Create scripts table
CREATE TABLE public.scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  idea_id UUID REFERENCES public.saved_ideas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  hook_text TEXT NOT NULL,
  body_text TEXT NOT NULL,
  cta_text TEXT NOT NULL DEFAULT '',
  delivery_tip TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scripts" ON public.scripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scripts" ON public.scripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scripts" ON public.scripts FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();