/**
 * Client-side utilities and shared types for the Supabase integration.
 *
 * All database operations have been moved to server actions in
 * @/app/actions/db.ts which use the service role key and validate
 * Clerk authentication server-side.
 */

// Re-export all server actions so existing imports keep working
export {
  getUserPlan,
  createUserPlan,
  updateUserPlan,
  logUsage,
  logAnonymousUsage,
  getDailyUsageCount,
  getMonthlyUsageCount,
  getUserUsageSummary,
  saveClassification,
  getUserClassifications,
  updateClassification,
  deleteClassification,
  toggleClassificationFavorite,
  searchClassifications,
  getClassificationsNeedingTariffCheck,
  checkTariffChanges,
  acceptTariffChanges,
  getTariffChangeStats,
} from '@/app/actions/db';

export type { ClassificationInput } from '@/app/actions/db';

// Shared type used by both client components and server actions
export interface ClassificationRecord {
  id?: string;
  user_id: string;
  user_email?: string;
  product_description: string;
  hs_code: string;
  confidence?: number;
  classification_date?: string;
  full_path?: string;
  tariff_data?: unknown;
  notes?: string;
  is_favorite?: boolean;
  tariff_version?: string;
  last_tariff_check?: string;
  needs_review?: boolean;
  tariff_change_detected?: string;
  previous_tariff_data?: unknown;
  status?: 'current' | 'outdated' | 'needs_review' | 'changed' | 'discontinued';
  origin_country?: string;
  typical_value?: number;
  typical_quantity?: number;
  quantity_unit?: string;
  weight_kg?: number;
  incoterms?: string;
  import_frequency?: string;
  annual_import_value?: number;
  supplier_info?: unknown;
  product_tags?: string[];
  fta_certificates?: unknown;
  is_manual_entry?: boolean;
}

// ──────────────────────────────────────────────
// Client-side only: localStorage-based device/anonymous tracking
// ──────────────────────────────────────────────

const DEVICE_ID_KEY = 'hscode_genie_device_id';
const ANONYMOUS_USAGE_KEY = 'hscode_genie_anonymous_usage';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getAnonymousDailyUsageCount(): number {
  try {
    const usageData = localStorage.getItem(ANONYMOUS_USAGE_KEY);
    if (!usageData) return 0;

    const { date, count } = JSON.parse(usageData);
    const today = new Date().toISOString().split('T')[0];

    if (date !== today) {
      localStorage.setItem(ANONYMOUS_USAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      return 0;
    }
    return count || 0;
  } catch {
    return 0;
  }
}

export function incrementAnonymousUsage(): number {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentCount = getAnonymousDailyUsageCount();
    const newCount = currentCount + 1;
    localStorage.setItem(ANONYMOUS_USAGE_KEY, JSON.stringify({ date: today, count: newCount }));
    return newCount;
  } catch {
    return 0;
  }
}
