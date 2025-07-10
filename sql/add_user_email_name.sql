-- Add email and name columns to user_plans table for better user identification
ALTER TABLE public.user_plans 
ADD COLUMN email TEXT,
ADD COLUMN name TEXT;

-- Create an index on email for faster searching
CREATE INDEX user_plans_email_idx ON public.user_plans (email);

-- Update the table comment
COMMENT ON TABLE public.user_plans IS 'User subscription plans with contact information for easier user management';
COMMENT ON COLUMN public.user_plans.email IS 'User email address from Clerk authentication';
COMMENT ON COLUMN public.user_plans.name IS 'User full name from Clerk authentication';
