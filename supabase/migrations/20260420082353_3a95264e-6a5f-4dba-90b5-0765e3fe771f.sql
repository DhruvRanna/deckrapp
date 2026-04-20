
-- Add last_streak_date to track streak continuity
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_streak_date date;

-- Function: update streak on profile update when swipes_today goes from 0 to >0 today
CREATE OR REPLACE FUNCTION public.update_streak_on_swipe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today date := CURRENT_DATE;
BEGIN
  -- Only act when swipes_today increased and we have at least 1 swipe today
  IF NEW.swipes_today > COALESCE(OLD.swipes_today, 0) AND NEW.swipes_today > 0 THEN
    IF NEW.last_streak_date IS NULL THEN
      NEW.streak := 1;
      NEW.last_streak_date := today;
    ELSIF NEW.last_streak_date = today THEN
      -- already counted today, keep streak as-is
      NULL;
    ELSIF NEW.last_streak_date = today - INTERVAL '1 day' THEN
      NEW.streak := COALESCE(OLD.streak, 0) + 1;
      NEW.last_streak_date := today;
    ELSE
      -- gap detected, reset
      NEW.streak := 1;
      NEW.last_streak_date := today;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_streak_on_swipe ON public.profiles;
CREATE TRIGGER trg_update_streak_on_swipe
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_streak_on_swipe();
