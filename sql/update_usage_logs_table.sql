-- Update usage_logs table to include missing fields
ALTER TABLE usage_logs 
ADD COLUMN IF NOT EXISTS usage_type TEXT,
ADD COLUMN IF NOT EXISTS feature_used TEXT,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Create or replace the user_usage_summary view
CREATE OR REPLACE VIEW user_usage_summary AS
SELECT 
    user_id,
    COUNT(*) as total_usage,
    COUNT(CASE WHEN request_type = 'final_classification' OR usage_type = 'classification' THEN 1 END) as monthly_classifications,
    COUNT(CASE WHEN request_type = 'pga_calculator' OR usage_type = 'pga_calculator' THEN 1 END) as monthly_pga_usage,
    COUNT(CASE WHEN request_type = 'batch_processing' OR usage_type = 'batch_processing' THEN 1 END) as monthly_batch_usage,
    MAX(created_at) as last_usage_date,
    MIN(created_at) as first_usage_date
FROM usage_logs 
WHERE 
    created_at >= date_trunc('month', CURRENT_DATE)
    AND (is_anonymous = FALSE OR is_anonymous IS NULL)
GROUP BY user_id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_date ON usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_type ON usage_logs(usage_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_anonymous ON usage_logs(is_anonymous);
