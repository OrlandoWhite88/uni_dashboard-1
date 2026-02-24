'use server';

import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const TARIFF_API_BASE_URL = "https://hscode-eight.vercel.app";

async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

// ──────────────────────────────────────────────
// User plan operations
// ──────────────────────────────────────────────

export async function getUserPlan(overrideUserId?: string) {
  const userId = overrideUserId ?? await requireAuth();

  const { data, error } = await supabaseAdmin
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

export async function createUserPlan(
  overrideUserId?: string,
  stripeCustomerId?: string,
  email?: string,
  name?: string
) {
  const userId = overrideUserId ?? await requireAuth();

  const { data, error } = await supabaseAdmin
    .from('user_plans')
    .upsert(
      [
        {
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          plan_type: 'free',
          email,
          name,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'user_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    console.error('Error creating user plan:', error);
    return null;
  }
  return data;
}

export async function updateUserPlan(planData: Record<string, unknown>, overrideUserId?: string) {
  const userId = overrideUserId ?? await requireAuth();

  try {
    const { data: existingPlan } = await supabaseAdmin
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingPlan) {
      const { data, error } = await supabaseAdmin
        .from('user_plans')
        .update({ ...planData, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user plan:', error);
        return null;
      }
      return data;
    }

    const { data, error } = await supabaseAdmin
      .from('user_plans')
      .insert([
        {
          user_id: userId,
          ...planData,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user plan during update:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Unexpected error in updateUserPlan:', error);
    return null;
  }
}

// ──────────────────────────────────────────────
// Usage tracking
// ──────────────────────────────────────────────

export async function logUsage(usageType: string, featureUsed?: string) {
  const userId = await requireAuth();

  const { error } = await supabaseAdmin
    .from('usage_logs')
    .insert([
      {
        user_id: userId,
        request_type: usageType,
        usage_type: usageType,
        feature_used: featureUsed || usageType,
        is_anonymous: false,
      },
    ]);

  if (error) {
    console.error('Error logging usage:', error);
    return false;
  }
  return true;
}

export async function logAnonymousUsage(deviceId: string, usageType: string, featureUsed?: string) {
  const { error } = await supabaseAdmin
    .from('usage_logs')
    .insert([
      {
        user_id: deviceId,
        request_type: usageType,
        usage_type: usageType,
        feature_used: featureUsed || usageType,
        is_anonymous: true,
      },
    ]);

  if (error) {
    console.error('Error logging anonymous usage:', error);
    return false;
  }
  return true;
}

export async function getDailyUsageCount() {
  const userId = await requireAuth();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabaseAdmin
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

export async function getMonthlyUsageCount() {
  const userId = await requireAuth();

  const today = new Date();
  const firstDay = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
  firstDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabaseAdmin
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

export async function getUserUsageSummary() {
  const userId = await requireAuth();

  try {
    const { data, error } = await supabaseAdmin
      .from('user_usage_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting user usage summary:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Unexpected error getting usage summary:', error);
    return null;
  }
}

// ──────────────────────────────────────────────
// Classification operations
// ──────────────────────────────────────────────

export interface ClassificationInput {
  product_description: string;
  hs_code: string;
  user_email?: string;
  confidence?: number;
  full_path?: string;
  tariff_data?: unknown;
  notes?: string;
  is_favorite?: boolean;
}

export async function saveClassification(classification: ClassificationInput) {
  const userId = await requireAuth();

  try {
    let tariffData = classification.tariff_data;
    if (!tariffData && classification.hs_code) {
      try {
        tariffData = await fetchTariffInfo(classification.hs_code);
      } catch (tariffError) {
        console.warn('Failed to fetch tariff data:', tariffError);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('product_classifications')
      .insert([
        {
          user_id: userId,
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
          status: 'current',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving classification:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Unexpected error saving classification:', error);
    return null;
  }
}

export async function getUserClassifications(limit: number = 50, offset: number = 0) {
  const userId = await requireAuth();

  try {
    const { data, error } = await supabaseAdmin
      .from('product_classifications')
      .select('*')
      .eq('user_id', userId)
      .order('classification_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error getting user classifications:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Unexpected error getting classifications:', error);
    return [];
  }
}

export async function updateClassification(id: string, updates: Record<string, unknown>) {
  await requireAuth();

  try {
    const { data, error } = await supabaseAdmin
      .from('product_classifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating classification:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Unexpected error updating classification:', error);
    return null;
  }
}

export async function deleteClassification(id: string) {
  await requireAuth();

  try {
    const { error } = await supabaseAdmin
      .from('product_classifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting classification:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Unexpected error deleting classification:', error);
    return false;
  }
}

export async function toggleClassificationFavorite(id: string, isFavorite: boolean) {
  return updateClassification(id, { is_favorite: isFavorite });
}

export async function searchClassifications(searchTerm: string, limit: number = 50) {
  const userId = await requireAuth();

  try {
    const { data, error } = await supabaseAdmin
      .from('product_classifications')
      .select('*')
      .eq('user_id', userId)
      .or(
        `product_description.ilike.%${searchTerm}%,hs_code.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`
      )
      .order('classification_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching classifications:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Unexpected error searching classifications:', error);
    return [];
  }
}

// ──────────────────────────────────────────────
// Tariff change detection
// ──────────────────────────────────────────────

async function fetchTariffInfo(hsCode: string): Promise<unknown> {
  const formattedHsCode = hsCode.replace(/[^a-zA-Z0-9]/g, '');

  const response = await fetch(`${TARIFF_API_BASE_URL}/tariff_details/${formattedHsCode}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Tariff API error: ${response.status}`);
  }

  return response.json();
}

function compareTariffData(oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null): boolean {
  if (!oldData || !newData) return oldData !== newData;

  const keyFields = [
    'mfn_text_rate', 'mfn_ad_val_rate', 'mfn_specific_rate', 'mfn_other_rate',
    'col2_text_rate', 'col2_ad_val_rate', 'col2_specific_rate', 'col2_other_rate',
    'begin_effect_date', 'end_effective_date', 'col1_special_text',
  ];

  const tradePrograms = [
    'gsp_indicator', 'cbi_indicator', 'agoa_indicator', 'nafta_canada_ind',
    'nafta_mexico_ind', 'usmca_indicator', 'israel_fta_indicator', 'jordan_indicator',
    'singapore_indicator', 'chile_indicator', 'australia_indicator', 'bahrain_indicator',
    'dr_cafta_indicator', 'oman_indicator', 'peru_indicator', 'korea_indicator',
    'colombia_indicator', 'panama_indicator', 'morocco_indicator',
  ];

  for (const field of [...keyFields, ...tradePrograms]) {
    const oldStr = oldData[field] == null ? '' : String(oldData[field]);
    const newStr = newData[field] == null ? '' : String(newData[field]);
    if (oldStr !== newStr) return true;
  }
  return false;
}

export async function getClassificationsNeedingTariffCheck(hoursThreshold: number = 12) {
  const userId = await requireAuth();

  try {
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - hoursThreshold);

    const { data, error } = await supabaseAdmin
      .from('product_classifications')
      .select('*')
      .eq('user_id', userId)
      .or(`last_tariff_check.is.null,last_tariff_check.lt.${thresholdTime.toISOString()}`)
      .order('classification_date', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error getting classifications needing tariff check:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Unexpected error getting classifications needing tariff check:', error);
    return [];
  }
}

export async function checkTariffChanges(): Promise<{
  checked: number;
  changed: number;
  discontinued: number;
  errors: number;
}> {
  await requireAuth();

  try {
    const classificationsToCheck = await getClassificationsNeedingTariffCheck(12);

    if (classificationsToCheck.length === 0) {
      return { checked: 0, changed: 0, discontinued: 0, errors: 0 };
    }

    let checkedCount = 0;
    let changedCount = 0;
    let discontinuedCount = 0;
    let errorCount = 0;

    for (const classification of classificationsToCheck) {
      try {
        const currentTariffData = await fetchTariffInfo(classification.hs_code);

        if (!currentTariffData || (typeof currentTariffData === 'object' && Object.keys(currentTariffData as object).length === 0)) {
          await updateClassification(classification.id!, {
            status: 'discontinued',
            needs_review: true,
            last_tariff_check: new Date().toISOString(),
            tariff_change_detected: new Date().toISOString(),
          });
          discontinuedCount++;
        } else {
          const hasChanged = compareTariffData(
            classification.tariff_data as Record<string, unknown>,
            currentTariffData as Record<string, unknown>
          );

          if (hasChanged) {
            await updateClassification(classification.id!, {
              previous_tariff_data: classification.tariff_data,
              tariff_data: currentTariffData,
              tariff_change_detected: new Date().toISOString(),
              status: 'changed',
              needs_review: true,
              last_tariff_check: new Date().toISOString(),
            });
            changedCount++;
          } else {
            await updateClassification(classification.id!, {
              last_tariff_check: new Date().toISOString(),
              status: 'current',
            });
          }
        }

        checkedCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error checking tariff for ${classification.hs_code}:`, error);
        errorCount++;
        try {
          await updateClassification(classification.id!, {
            last_tariff_check: new Date().toISOString(),
          });
        } catch {
          // ignore update failure
        }
      }
    }

    return { checked: checkedCount, changed: changedCount, discontinued: discontinuedCount, errors: errorCount };
  } catch (error) {
    console.error('Error in checkTariffChanges:', error);
    return { checked: 0, changed: 0, discontinued: 0, errors: 1 };
  }
}

export async function acceptTariffChanges(classificationId: string) {
  await requireAuth();

  try {
    const { data, error } = await supabaseAdmin
      .from('product_classifications')
      .update({
        status: 'current',
        needs_review: false,
        previous_tariff_data: null,
        tariff_change_detected: null,
        last_tariff_check: new Date().toISOString(),
      })
      .eq('id', classificationId)
      .select()
      .single();

    if (error) {
      console.error('Error accepting tariff changes:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Unexpected error accepting tariff changes:', error);
    return null;
  }
}

export async function getTariffChangeStats() {
  const userId = await requireAuth();

  try {
    const { data, error } = await supabaseAdmin
      .from('product_classifications')
      .select('status, tariff_change_detected, needs_review')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting tariff change stats:', error);
      return { total: 0, changed: 0, needsReview: 0, recentChanges: 0 };
    }

    const total = data.length;
    const changed = data.filter((c: { status: string }) => c.status === 'changed').length;
    const needsReview = data.filter((c: { needs_review: boolean }) => c.needs_review).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentChanges = data.filter(
      (c: { tariff_change_detected: string | null }) =>
        c.tariff_change_detected && new Date(c.tariff_change_detected) > sevenDaysAgo
    ).length;

    return { total, changed, needsReview, recentChanges };
  } catch (error) {
    console.error('Error getting tariff change stats:', error);
    return { total: 0, changed: 0, needsReview: 0, recentChanges: 0 };
  }
}
