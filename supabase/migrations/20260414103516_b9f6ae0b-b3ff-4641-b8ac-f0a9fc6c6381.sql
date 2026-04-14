CREATE OR REPLACE FUNCTION public.prevent_plan_self_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    NEW.plan := OLD.plan;
  END IF;

  RETURN NEW;
END;
$$;