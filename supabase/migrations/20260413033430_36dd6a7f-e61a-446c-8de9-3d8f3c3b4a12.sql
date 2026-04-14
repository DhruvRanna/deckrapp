
-- Drop the existing permissive update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a restrictive update policy that only allows updating safe columns
-- We use a trigger to block plan/counter changes from non-service-role
CREATE OR REPLACE FUNCTION public.prevent_plan_self_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If called from service_role, allow everything
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- Block changes to sensitive columns
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    NEW.plan := OLD.plan;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_plan_self_upgrade_trigger ON public.profiles;
CREATE TRIGGER prevent_plan_self_upgrade_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_plan_self_upgrade();

-- Re-create the update policy
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
