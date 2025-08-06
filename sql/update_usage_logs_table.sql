-- Safe update: table structure is already correct, just need to create/update the view

-- Drop the existing view if it exists
DROP VIEW IF EXISTS user_usage_summary;

-- Create the user_usage_summary view
CREATE VIEW user_usage_summary AS
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
