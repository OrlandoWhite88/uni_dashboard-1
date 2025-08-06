-- Add enhanced product information fields to product_classifications table
ALTER TABLE product_classifications 
ADD COLUMN IF NOT EXISTS origin_country TEXT,
ADD COLUMN IF NOT EXISTS typical_value DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS typical_quantity DECIMAL(12,3),
ADD COLUMN IF NOT EXISTS quantity_unit TEXT,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(12,3),
ADD COLUMN IF NOT EXISTS supplier_info JSONB,
ADD COLUMN IF NOT EXISTS incoterms TEXT,
ADD COLUMN IF NOT EXISTS product_tags TEXT[],
ADD COLUMN IF NOT EXISTS fta_certificates JSONB,
ADD COLUMN IF NOT EXISTS import_frequency TEXT,
ADD COLUMN IF NOT EXISTS last_import_date DATE,
ADD COLUMN IF NOT EXISTS total_duty_paid DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS duty_calculation_data JSONB,
ADD COLUMN IF NOT EXISTS annual_import_value DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS is_manual_entry BOOLEAN DEFAULT FALSE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_classifications_origin_country 
ON product_classifications(origin_country);

CREATE INDEX IF NOT EXISTS idx_product_classifications_product_tags 
ON product_classifications USING GIN(product_tags);

CREATE INDEX IF NOT EXISTS idx_product_classifications_is_manual 
ON product_classifications(is_manual_entry);

-- Add comments to document the new fields
COMMENT ON COLUMN product_classifications.origin_country IS 'Country of origin for FTA eligibility';
COMMENT ON COLUMN product_classifications.typical_value IS 'Typical invoice value in USD';
COMMENT ON COLUMN product_classifications.typical_quantity IS 'Typical quantity per shipment';
COMMENT ON COLUMN product_classifications.quantity_unit IS 'Unit of measurement (KG, PCS, etc.)';
COMMENT ON COLUMN product_classifications.weight_kg IS 'Weight in kilograms for specific duty calculations';
COMMENT ON COLUMN product_classifications.supplier_info IS 'JSON object with supplier details';
COMMENT ON COLUMN product_classifications.incoterms IS 'Incoterms (FOB, CIF, EXW, etc.)';
COMMENT ON COLUMN product_classifications.product_tags IS 'Array of tags for organization';
COMMENT ON COLUMN product_classifications.fta_certificates IS 'JSON object with FTA certificate details';
COMMENT ON COLUMN product_classifications.import_frequency IS 'How often product is imported (monthly, quarterly, etc.)';
COMMENT ON COLUMN product_classifications.last_import_date IS 'Date of last import';
COMMENT ON COLUMN product_classifications.total_duty_paid IS 'Total duty paid to date';
COMMENT ON COLUMN product_classifications.duty_calculation_data IS 'Cached duty calculation results';
COMMENT ON COLUMN product_classifications.annual_import_value IS 'Estimated annual import value';
COMMENT ON COLUMN product_classifications.is_manual_entry IS 'Whether this was manually added vs classified';
