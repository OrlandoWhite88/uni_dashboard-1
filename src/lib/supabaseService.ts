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

// Classification history functions
export interface ClassificationRecord {
  id?: string;
  user_id: string;
  user_email?: string;
  product_description: string;
  hs_code: string;
  confidence?: number;
  classification_date?: string;
  full_path?: string;
  tariff_data?: any;
  notes?: string;
  is_favorite?: boolean;
  tariff_version?: string;
  last_tariff_check?: string;
  needs_review?: boolean;
  tariff_change_detected?: string;
  previous_tariff_data?: any;
  status?: 'current' | 'outdated' | 'needs_review' | 'changed';
}

export async function saveClassification(classification: ClassificationRecord) {
  console.log('Saving classification:', classification);
  
  try {
    // Fetch tariff data for the HS code if not already provided
    let tariffData = classification.tariff_data;
    if (!tariffData && classification.hs_code) {
      try {
        console.log('Fetching tariff data for HS code:', classification.hs_code);
        const { getTariffInfo } = await import('./classifierService');
        tariffData = await getTariffInfo(classification.hs_code);
        console.log('Tariff data fetched successfully');
      } catch (tariffError) {
        console.warn('Failed to fetch tariff data:', tariffError);
        // Continue saving without tariff data
      }
    }

    const { data, error } = await supabase
      .from('product_classifications')
      .insert([{
        user_id: classification.user_id,
        user_email: classification.user_email,
        product_description: classification.product_description,
        hs_code: classification.hs_code,
        confidence: classification.confidence,
        full_path: classification.full_path,
        tariff_data: tariffData,
        notes: classification.notes,
        is_favorite: classification.is_favorite || false,
        tariff_version: '2024',
        last_tariff_check: new Date().toISOString(),
        status: 'current'
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Error saving classification:', error);
      return null;
    }
    
    console.log('Classification saved successfully with tariff data:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error saving classification:', error);
    return null;
  }
}

export async function getUserClassifications(userId: string, limit: number = 50, offset: number = 0) {
  console.log('Getting user classifications:', { userId, limit, offset });
  
  try {
    const { data, error } = await supabase
      .from('product_classifications')
      .select('*')
      .eq('user_id', userId)
      .order('classification_date', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error getting user classifications:', error);
      return [];
    }
    
    console.log('Retrieved classifications:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Unexpected error getting classifications:', error);
    return [];
  }
}

export async function updateClassification(id: string, updates: Partial<ClassificationRecord>) {
  console.log('Updating classification:', { id, updates });
  
  try {
    const { data, error } = await supabase
      .from('product_classifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating classification:', error);
      return null;
    }
    
    console.log('Classification updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error updating classification:', error);
    return null;
  }
}

export async function deleteClassification(id: string) {
  console.log('Deleting classification:', id);
  
  try {
    const { error } = await supabase
      .from('product_classifications')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting classification:', error);
      return false;
    }
    
    console.log('Classification deleted successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error deleting classification:', error);
    return false;
  }
}

export async function toggleClassificationFavorite(id: string, isFavorite: boolean) {
  return updateClassification(id, { is_favorite: isFavorite });
}

export async function searchClassifications(userId: string, searchTerm: string, limit: number = 50) {
  console.log('Searching classifications:', { userId, searchTerm, limit });
  
  try {
    const { data, error } = await supabase
      .from('product_classifications')
      .select('*')
      .eq('user_id', userId)
      .or(`product_description.ilike.%${searchTerm}%,hs_code.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
      .order('classification_date', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error searching classifications:', error);
      return [];
    }
    
    console.log('Search results:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Unexpected error searching classifications:', error);
    return [];
  }
}

// Tariff change detection functions
export async function getClassificationsNeedingTariffCheck(userId: string, hoursThreshold: number = 12) {
  console.log('Getting classifications needing tariff check:', { userId, hoursThreshold });
  
  try {
    // Calculate the threshold timestamp (12 hours ago)
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - hoursThreshold);
    
    const { data, error } = await supabase
      .from('product_classifications')
      .select('*')
      .eq('user_id', userId)
      .or(`last_tariff_check.is.null,last_tariff_check.lt.${thresholdTime.toISOString()}`)
      .order('classification_date', { ascending: false })
      .limit(20); // Limit to 20 classifications per check to avoid timeouts
      
    if (error) {
      console.error('Error getting classifications needing tariff check:', error);
      return [];
    }
    
    console.log('Classifications needing tariff check:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Unexpected error getting classifications needing tariff check:', error);
    return [];
  }
}

export async function checkTariffChanges(userId: string): Promise<{ checked: number; changed: number; errors: number }> {
  console.log('Checking tariff changes for user:', userId);
  
  try {
    // Get classifications that need checking (last checked > 12 hours ago)
    const classificationsToCheck = await getClassificationsNeedingTariffCheck(userId, 12);
    
    if (classificationsToCheck.length === 0) {
      console.log('No classifications need tariff checking');
      return { checked: 0, changed: 0, errors: 0 };
    }
    
    let checkedCount = 0;
    let changedCount = 0;
    let errorCount = 0;
    
    // Import getTariffInfo function
    const { getTariffInfo } = await import('./classifierService');
    
    // Check each classification for tariff changes
    for (const classification of classificationsToCheck) {
      try {
        console.log(`Checking tariff for HS code: ${classification.hs_code}`);
        
        // Fetch current tariff data
        const currentTariffData = await getTariffInfo(classification.hs_code);
        
        // Compare with stored tariff data
        const hasChanged = compareTariffData(classification.tariff_data, currentTariffData);
        
        if (hasChanged) {
          console.log(`Tariff change detected for HS code: ${classification.hs_code}`);
          
          // Update classification with change detection
          await updateClassification(classification.id!, {
            previous_tariff_data: classification.tariff_data,
            tariff_data: currentTariffData,
            tariff_change_detected: new Date().toISOString(),
            status: 'changed',
            needs_review: true,
            last_tariff_check: new Date().toISOString()
          });
          
          changedCount++;
        } else {
          // Update last check time
          await updateClassification(classification.id!, {
            last_tariff_check: new Date().toISOString()
          });
        }
        
        checkedCount++;
        
        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error checking tariff for ${classification.hs_code}:`, error);
        errorCount++;
        
        // Still update the last check time even if there was an error
        try {
          await updateClassification(classification.id!, {
            last_tariff_check: new Date().toISOString()
          });
        } catch (updateError) {
          console.error('Error updating last check time:', updateError);
        }
      }
    }
    
    console.log(`Tariff check completed: ${checkedCount} checked, ${changedCount} changed, ${errorCount} errors`);
    return { checked: checkedCount, changed: changedCount, errors: errorCount };
    
  } catch (error) {
    console.error('Error in checkTariffChanges:', error);
    return { checked: 0, changed: 0, errors: 1 };
  }
}

function compareTariffData(oldData: any, newData: any): boolean {
  // If either is null/undefined, consider it changed if they're different
  if (!oldData || !newData) {
    return oldData !== newData;
  }
  
  // Compare key tariff fields that matter for change detection
  const keyFields = [
    'mfn_text_rate',
    'mfn_ad_val_rate',
    'mfn_specific_rate',
    'mfn_other_rate',
    'col2_text_rate',
    'col2_ad_val_rate',
    'col2_specific_rate',
    'col2_other_rate',
    'begin_effect_date',
    'end_effective_date'
  ];
  
  for (const field of keyFields) {
    if (oldData[field] !== newData[field]) {
      console.log(`Tariff change detected in field ${field}: ${oldData[field]} -> ${newData[field]}`);
      return true;
    }
  }
  
  // Check trade program indicators for changes
  const tradePrograms = [
    'gsp_indicator',
    'cbi_indicator',
    'agoa_indicator',
    'nafta_canada_ind',
    'nafta_mexico_ind',
    'usmca_indicator',
    'israel_fta_indicator',
    'jordan_indicator',
    'singapore_indicator',
    'chile_indicator',
    'australia_indicator',
    'bahrain_indicator',
    'dr_cafta_indicator',
    'oman_indicator',
    'peru_indicator',
    'korea_indicator',
    'columbia_indicator',
    'panama_indicator',
    'morocco_indicator'
  ];
  
  for (const program of tradePrograms) {
    if (oldData[program] !== newData[program]) {
      console.log(`Trade program change detected in ${program}: ${oldData[program]} -> ${newData[program]}`);
      return true;
    }
  }
  
  return false;
}

export async function getTariffChangeStats(userId: string) {
  console.log('Getting tariff change stats for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('product_classifications')
      .select('status, tariff_change_detected, needs_review')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error getting tariff change stats:', error);
      return {
        total: 0,
        changed: 0,
        needsReview: 0,
        recentChanges: 0
      };
    }
    
    const total = data.length;
    const changed = data.filter(c => c.status === 'changed').length;
    const needsReview = data.filter(c => c.needs_review).length;
    
    // Count recent changes (within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentChanges = data.filter(c => 
      c.tariff_change_detected && 
      new Date(c.tariff_change_detected) > sevenDaysAgo
    ).length;
    
    return {
      total,
      changed,
      needsReview,
      recentChanges
    };
  } catch (error) {
    console.error('Error getting tariff change stats:', error);
    return {
      total: 0,
      changed: 0,
      needsReview: 0,
      recentChanges: 0
    };
  }
}
