-- This SQL script updates the usage_logs table to support anonymous users

-- Add an is_anonymous column to the usage_logs table if it doesn't exist
ALTER TABLE public.usage_logs 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Create an index on is_anonymous for better query performance
CREATE INDEX IF NOT EXISTS usage_logs_is_anonymous_idx ON public.usage_logs (is_anonymous);

-- Add a comment to the is_anonymous column
COMMENT ON COLUMN public.usage_logs.is_anonymous IS 'Indicates if the usage is from an anonymous (non-logged in) user';
