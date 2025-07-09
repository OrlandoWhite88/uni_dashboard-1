-- Add fields for trade compliance flags to product_classifications table
ALTER TABLE product_classifications 
ADD COLUMN pga_flags JSONB DEFAULT NULL,
ADD COLUMN cvd_flags JSONB DEFAULT NULL,
ADD COLUMN compliance_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add indexes for better query performance
CREATE INDEX idx_product_classifications_pga_flags ON product_classifications USING GIN (pga_flags);
CREATE INDEX idx_product_classifications_cvd_flags ON product_classifications USING GIN (cvd_flags);
CREATE INDEX idx_product_classifications_compliance_checked ON product_classifications(compliance_checked_at);

-- Add comment for documentation
COMMENT ON COLUMN product_classifications.pga_flags IS 'JSON array of PGA (Partner Government Agency) requirements and flags';
COMMENT ON COLUMN product_classifications.cvd_flags IS 'JSON array of ADD/CVD (Anti-Dumping/Countervailing Duty) flags and rates';
COMMENT ON COLUMN product_classifications.compliance_checked_at IS 'Timestamp when compliance flags were last checked';

-- Example data structure for pga_flags:
-- [
--   {
--     "id": "fda-1",
--     "agency": "Food and Drug Administration",
--     "agencyCode": "FDA",
--     "requirement": "Prior Notice Required",
--     "severity": "standard",
--     "description": "FDA requires prior notice for imported food products.",
--     "documents": ["Prior Notice Confirmation", "FDA Registration Number"],
--     "additionalInfo": "Must be submitted 2-8 hours before arrival",
--     "url": "https://www.fda.gov/food/importing-food-products-united-states/prior-notice-imported-foods"
--   }
-- ]

-- Example data structure for cvd_flags:
-- [
--   {
--     "id": "cvd-1",
--     "type": "CVD",
--     "rate": 7.5,
--     "country": "Vietnam",
--     "effectiveDate": "2023-01-15",
--     "expiryDate": "2028-01-14",
--     "caseNumber": "C-552-802",
--     "status": "active",
--     "description": "Countervailing duty on certain frozen fish fillets from Vietnam",
--     "productScope": "Frozen fish fillets of the species Pangasius"
--   }
-- ]
