import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ljxfezqvwsppewvibxnz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqeGZlenF2d3NwcGV3dmlieG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjIyMTAsImV4cCI6MjA1NzYzODIxMH0.0MLCuRHQlF2Kkt4PokL2IKCVDqbkrXZThqJ0BAaLOhg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// User plan functions
export async function getUserPlan(userId: string) {
  const { data, error } = await supabase
    .from('user_plans')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('Error getting user plan:', error);
    return null;
  }
  
  return data;
}

export async function createUserPlan(userId: string, stripeCustomerId?: string) {
  const { data, error } = await supabase
    .from('user_plans')
    .insert([{
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      plan_type: 'free'
    }])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating user plan:', error);
    return null;
  }
  
  return data;
}

export async function updateUserPlan(userId: string, planData: any) {
  const { data, error } = await supabase
    .from('user_plans')
    .update({
      ...planData,
      updated_at: new Date()
    })
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating user plan:', error);
    return null;
  }
  
  return data;
}

// Usage tracking functions
export async function logUsage(userId: string, requestType: string) {
  const { data, error } = await supabase
    .from('usage_logs')
    .insert([{
      user_id: userId,
      request_type: requestType
    }]);
    
  if (error) {
    console.error('Error logging usage:', error);
    return false;
  }
  
  return true;
}

export async function getDailyUsageCount(userId: string) {
  // Get today's date at midnight in UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const { count, error } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());
    
  if (error) {
    console.error('Error getting daily usage count:', error);
    return 0;
  }
  
  return count || 0;
}

export async function getMonthlyUsageCount(userId: string) {
  // Get first day of current month at midnight in UTC
  const today = new Date();
  const firstDay = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
  firstDay.setUTCHours(0, 0, 0, 0);
  
  const { count, error } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', firstDay.toISOString());
    
  if (error) {
    console.error('Error getting monthly usage count:', error);
    return 0;
  }
  
  return count || 0;
}
