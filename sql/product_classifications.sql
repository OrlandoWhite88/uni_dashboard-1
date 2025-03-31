-- First, check if uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a new table for storing product classifications
CREATE TABLE product_classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  product_description TEXT NOT NULL,
  hs_code TEXT NOT NULL,
  confidence NUMERIC(5,2),
  classification_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_path TEXT,
  tariff_data JSONB,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE
);

-- Create an index on user_id for faster lookups
CREATE INDEX idx_product_classifications_user_id ON product_classifications(user_id);

-- Create an index on classification_date for sorting
CREATE INDEX idx_product_classifications_date ON product_classifications(classification_date);

-- Add RLS policies
ALTER TABLE product_classifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own classifications
-- Cast auth.uid() to TEXT to match user_id column type
CREATE POLICY "Users can view their own classifications"
  ON product_classifications
  FOR SELECT
  USING (user_id = auth.uid()::TEXT);

-- Policy to allow users to insert their own classifications
CREATE POLICY "Users can insert their own classifications"
  ON product_classifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::TEXT);

-- Policy to allow users to update their own classifications
CREATE POLICY "Users can update their own classifications"
  ON product_classifications
  FOR UPDATE
  USING (user_id = auth.uid()::TEXT);

-- Policy to allow users to delete their own classifications
CREATE POLICY "Users can delete their own classifications"
  ON product_classifications
  FOR DELETE
  USING (user_id = auth.uid()::TEXT);