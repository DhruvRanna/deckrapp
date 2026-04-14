CREATE POLICY "Users can update their own scripts"
ON public.scripts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);