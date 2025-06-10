-- This SQL script adds the last_checkout_session column to track checkout session IDs

-- Add last_checkout_session column to user_plans table
ALTER TABLE public.user_plans 
ADD COLUMN IF NOT EXISTS last_checkout_session TEXT;

-- Add a comment to the last_checkout_session column
COMMENT ON COLUMN public.user_plans.last_checkout_session IS 'ID of the last checkout session that was processed';
