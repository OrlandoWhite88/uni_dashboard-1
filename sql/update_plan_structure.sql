-- Update plan structure to support new pricing tiers
-- This script works with the existing user_plans and usage_logs table structure

-- 1. Update default plan type from 'free' to 'starter'
ALTER TABLE user_plans ALTER COLUMN plan_type SET DEFAULT 'starter';

-- 2. Update existing free users to starter plan
UPDATE user_plans SET plan_type = 'starter' WHERE plan_type = 'free';

-- 3. Add missing columns to usage_logs table if they don't exist
ALTER TABLE usage_logs 
ADD COLUMN IF NOT EXISTS usage_type TEXT,
ADD COLUMN IF NOT EXISTS feature_used TEXT,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- 4. Update existing usage_logs to populate new columns based on request_type
UPDATE usage_logs 
SET 
    usage_type = request_type,
    feature_used = request_type,
    is_anonymous = false
WHERE usage_type IS NULL;

-- 5. Create a view for user usage summary that works with existing tables
CREATE OR REPLACE VIEW user_usage_summary AS
SELECT 
    up.user_id,
    up.plan_type,
    
    -- Current month usage counts
    COUNT(CASE WHEN COALESCE(ul.usage_type, ul.request_type) = 'classification' 
               AND ul.created_at >= date_trunc('month', CURRENT_DATE) 
          THEN 1 END) AS monthly_classifications,
          
    COUNT(CASE WHEN COALESCE(ul.usage_type, ul.request_type) = 'pgaCalculator' 
               AND ul.created_at >= date_trunc('month', CURRENT_DATE) 
          THEN 1 END) AS monthly_pga_calculator,
          
    COUNT(CASE WHEN COALESCE(ul.usage_type, ul.request_type) = 'batchProcessing' 
               AND ul.created_at >= date_trunc('month', CURRENT_DATE) 
          THEN 1 END) AS monthly_batch_processing,
    
    -- Total counts
    COUNT(CASE WHEN COALESCE(ul.usage_type, ul.request_type) = 'classification' THEN 1 END) AS total_classifications,
    COUNT(CASE WHEN COALESCE(ul.usage_type, ul.request_type) = 'pgaCalculator' THEN 1 END) AS total_pga_calculator,
    COUNT(CASE WHEN COALESCE(ul.usage_type, ul.request_type) = 'batchProcessing' THEN 1 END) AS total_batch_processing,
    
    -- Plan limits (hardcoded based on plan type)
    CASE 
        WHEN up.plan_type = 'starter' THEN 100
        WHEN up.plan_type = 'growth' THEN 1000
        WHEN up.plan_type = 'enterprise' THEN -1  -- unlimited
        ELSE 100
    END AS max_monthly_classifications,
    
    CASE 
        WHEN up.plan_type = 'starter' THEN 5
        WHEN up.plan_type IN ('growth', 'enterprise') THEN -1  -- unlimited
        ELSE 5
    END AS max_monthly_pga_calculator,
    
    CASE 
        WHEN up.plan_type = 'starter' THEN 0  -- not allowed
        WHEN up.plan_type IN ('growth', 'enterprise') THEN -1  -- unlimited
        ELSE 0
    END AS max_monthly_batch_processing,
    
    up.created_at as plan_created_at,
    up.updated_at as plan_updated_at

FROM user_plans up
LEFT JOIN usage_logs ul ON up.user_id = ul.user_id AND COALESCE(ul.is_anonymous, false) = false
GROUP BY up.user_id, up.plan_type, up.created_at, up.updated_at;

-- 6. Create indexes on usage_logs for better performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created ON usage_logs (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_usage_type ON usage_logs (usage_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_request_type ON usage_logs (request_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_usage_type ON usage_logs (user_id, usage_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_request_type ON usage_logs (user_id, request_type);

-- 7. Insert sample usage data if needed (commented out for production)
-- INSERT INTO usage_logs (user_id, request_type, usage_type, feature_used, is_anonymous) 
-- SELECT user_id, 'classification', 'classification', 'classification', false 
-- FROM user_plans 
-- WHERE plan_type = 'starter' 
-- LIMIT 5;

COMMENT ON VIEW user_usage_summary IS 'Provides usage summary for each user with their current plan limits and usage counts';
