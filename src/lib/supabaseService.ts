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
  // Use upsert to handle both creating and updating
  // This prevents duplicate entries for the same user
  const { data, error } = await supabase
    .from('user_plans')
    .upsert([{
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      plan_type: 'free',
      updated_at: new Date()
    }], {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating user plan:', error);
    return null;
  }
  
  console.log('User plan created or updated:', data);
  return data;
}

export async function updateUserPlan(userId: string, planData: any) {
  console.log('Updating user plan:', { userId, planData });
  
  try {
    // First check if the user plan exists
    const { data: existingPlan } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    let result;
    
    if (existingPlan) {
      // Update existing plan
      console.log('Updating existing plan for user:', userId);
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
      
      result = data;
    } else {
      // Create a new plan if it doesn't exist
      console.log('Creating new plan for user as it doesn\'t exist:', userId);
      const { data, error } = await supabase
        .from('user_plans')
        .insert([{
          user_id: userId,
          ...planData,
          updated_at: new Date()
        }])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating user plan during update:', error);
        return null;
      }
      
      result = data;
    }
    
    console.log('User plan successfully updated:', result);
    return result;
  } catch (error) {
    console.error('Unexpected error in updateUserPlan:', error);
    return null;
  }
}

// Device ID management for anonymous users
const DEVICE_ID_KEY = 'hscode_genie_device_id';
const ANONYMOUS_USAGE_KEY = 'hscode_genie_anonymous_usage';

export function getDeviceId(): string {
  // Get existing device ID or create a new one
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    // Generate a unique device ID if none exists
    deviceId = `device_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

// Get anonymous usage count for the current day
export function getAnonymousDailyUsageCount(): number {
  try {
    const usageData = localStorage.getItem(ANONYMOUS_USAGE_KEY);
    
    if (!usageData) {
      return 0;
    }
    
    const { date, count } = JSON.parse(usageData);
    const today = new Date().toISOString().split('T')[0];
    
    // Reset count if it's a new day
    if (date !== today) {
      localStorage.setItem(ANONYMOUS_USAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error getting anonymous usage count:', error);
    return 0;
  }
}

// Increment anonymous usage count
export function incrementAnonymousUsage(): number {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentCount = getAnonymousDailyUsageCount();
    const newCount = currentCount + 1;
    
    localStorage.setItem(ANONYMOUS_USAGE_KEY, JSON.stringify({ date: today, count: newCount }));
    return newCount;
  } catch (error) {
    console.error('Error incrementing anonymous usage:', error);
    return 0;
  }
}

// Usage tracking functions - now supports both logged-in and anonymous users
export async function logUsage(userId: string | null, requestType: string) {
  // For anonymous users, use device ID and track locally
  if (!userId) {
    const deviceId = getDeviceId();
    incrementAnonymousUsage();
    
    // Also log to Supabase with device ID
    const { data, error } = await supabase
      .from('usage_logs')
      .insert([{
        user_id: deviceId,
        request_type: requestType,
        is_anonymous: true
      }]);
      
    if (error) {
      console.error('Error logging anonymous usage:', error);
      return false;
    }
    
    return true;
  }
  
  // For logged-in users
  const { data, error } = await supabase
    .from('usage_logs')
    .insert([{
      user_id: userId,
      request_type: requestType,
      is_anonymous: false
    }]);
    
  if (error) {
    console.error('Error logging usage:', error);
    return false;
  }
  
  return true;
}

export async function getDailyUsageCount(userId: string | null) {
  // For anonymous users, use localStorage count
  if (!userId) {
    return getAnonymousDailyUsageCount();
  }
  
  // For logged-in users, query Supabase
  // Get today's date at midnight in UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const { count, error } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_anonymous', false)
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
