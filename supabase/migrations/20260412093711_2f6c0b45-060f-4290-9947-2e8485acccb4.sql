
-- Create the trigger that was missing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any existing users who don't have one
INSERT INTO public.profiles (user_id, display_name, email)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  email
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles);
