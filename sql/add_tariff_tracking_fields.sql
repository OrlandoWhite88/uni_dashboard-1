-- Add tariff tracking fields to product_classifications table
ALTER TABLE product_classifications 
ADD COLUMN IF NOT EXISTS tariff_version TEXT DEFAULT '2024',
ADD COLUMN IF NOT EXISTS last_tariff_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tariff_change_detected TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS previous_tariff_data JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'current' CHECK (status IN ('current', 'outdated', 'needs_review', 'changed'));

-- Create index for efficient querying of classifications that need review
CREATE INDEX IF NOT EXISTS idx_product_classifications_needs_review 
ON product_classifications(needs_review) WHERE needs_review = TRUE;

-- Create index for efficient querying by status
CREATE INDEX IF NOT EXISTS idx_product_classifications_status 
ON product_classifications(status);

-- Create index for efficient querying by last_tariff_check
CREATE INDEX IF NOT EXISTS idx_product_classifications_tariff_check 
ON product_classifications(last_tariff_check);

-- Update existing records to set initial values
UPDATE product_classifications 
SET 
  tariff_version = '2024',
  status = CASE 
    WHEN classification_date < NOW() - INTERVAL '6 months' THEN 'needs_review'
    ELSE 'current'
  END,
  needs_review = CASE 
    WHEN classification_date < NOW() - INTERVAL '6 months' THEN TRUE
    ELSE FALSE
  END
WHERE tariff_version IS NULL;

-- Add comment to document the new fields
COMMENT ON COLUMN product_classifications.tariff_version IS 'HTS revision version when classification was made';
COMMENT ON COLUMN product_classifications.last_tariff_check IS 'Last time tariff data was checked for changes';
COMMENT ON COLUMN product_classifications.needs_review IS 'Whether this classification needs manual review';
COMMENT ON COLUMN product_classifications.tariff_change_detected IS 'When a tariff change was detected for this classification';
COMMENT ON COLUMN product_classifications.previous_tariff_data IS 'Previous tariff data before change was detected';
COMMENT ON COLUMN product_classifications.status IS 'Current status: current, outdated, needs_review, or changed';
