import { Capacitor } from "@capacitor/core";

// RevenueCat Google Play API key
const RC_GOOGLE_API_KEY = "goog_SmaPATYPVHOCAFUlTcnpUXtiZXE";

// Entitlement identifiers (configured in RevenueCat dashboard)
// Adjust these strings if your dashboard uses different identifiers.
export const ENTITLEMENT_PRO = "DECKR APP Pro";
export const ENTITLEMENT_CREATOR = "creator_access";

// Package identifier mapping (RC package id -> our plan)
export const PACKAGE_TO_PLAN: Record<string, "CREATOR" | "PRO"> = {
  $rc_monthly: "CREATOR",
  $rc_annual: "CREATOR",
  "pro-monthly": "PRO",
  "pro-yearly": "PRO",
};

export const isNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
};

let initialized = false;
let initializing: Promise<void> | null = null;

/**
 * Lazy-load the plugin only on native Android. On web this is a no-op
 * so the bundle never tries to call native code in the browser.
 */
export const initRevenueCat = async (appUserId?: string): Promise<void> => {
  if (!isNative()) return;
  if (initialized) {
    if (appUserId) {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      await Purchases.logIn({ appUserID: appUserId });
    }
    return;
  }
  if (initializing) return initializing;

  initializing = (async () => {
    const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({
      apiKey: RC_GOOGLE_API_KEY,
      appUserID: appUserId,
    });
    initialized = true;
  })();

  return initializing;
};

export const setRevenueCatUser = async (appUserId: string): Promise<void> => {
  if (!isNative()) return;
  await initRevenueCat(appUserId);
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  await Purchases.logIn({ appUserID: appUserId });
};

export const logoutRevenueCat = async (): Promise<void> => {
  if (!isNative() || !initialized) return;
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    await Purchases.logOut();
  } catch (e) {
    console.warn("[RC] logout error", e);
  }
};

export interface RCPackageInfo {
  identifier: string;
  plan: "CREATOR" | "PRO";
  priceString: string;
  period: "monthly" | "yearly";
  raw: any;
}

export const getOfferingPackages = async (): Promise<RCPackageInfo[]> => {
  if (!isNative()) return [];
  await initRevenueCat();
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return [];

  const result: RCPackageInfo[] = [];
  for (const pkg of current.availablePackages) {
    const plan = PACKAGE_TO_PLAN[pkg.identifier];
    if (!plan) continue;
    const period = pkg.identifier.includes("annual") || pkg.identifier.includes("yearly") ? "yearly" : "monthly";
    result.push({
      identifier: pkg.identifier,
      plan,
      priceString: pkg.product?.priceString || "",
      period,
      raw: pkg,
    });
  }
  return result;
};

export interface PurchaseResult {
  success: boolean;
  plan?: "CREATOR" | "PRO" | "FREE";
  cancelled?: boolean;
  error?: string;
}

const planFromCustomerInfo = (customerInfo: any): "CREATOR" | "PRO" | "FREE" => {
  const active = customerInfo?.entitlements?.active || {};
  if (active[ENTITLEMENT_PRO]) return "PRO";
  if (active[ENTITLEMENT_CREATOR]) return "CREATOR";
  return "FREE";
};

export const purchasePackage = async (rcPackage: any): Promise<PurchaseResult> => {
  if (!isNative()) {
    return { success: false, error: "In-app purchases are only available on the Android app." };
  }
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const result = await Purchases.purchasePackage({ aPackage: rcPackage });
    const plan = planFromCustomerInfo(result.customerInfo);
    return { success: true, plan };
  } catch (e: any) {
    if (e?.userCancelled || e?.code === "PURCHASE_CANCELLED") {
      return { success: false, cancelled: true };
    }
    return { success: false, error: e?.message || "Purchase failed" };
  }
};

export const restorePurchases = async (): Promise<PurchaseResult> => {
  if (!isNative()) {
    return { success: false, error: "In-app purchases are only available on the Android app." };
  }
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const result = await Purchases.restorePurchases();
    const plan = planFromCustomerInfo(result.customerInfo);
    return { success: true, plan };
  } catch (e: any) {
    return { success: false, error: e?.message || "Restore failed" };
  }
};

export const getCurrentPlanFromRC = async (): Promise<"CREATOR" | "PRO" | "FREE" | null> => {
  if (!isNative()) return null;
  try {
    await initRevenueCat();
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const info = await Purchases.getCustomerInfo();
    return planFromCustomerInfo(info.customerInfo);
  } catch (e) {
    console.warn("[RC] getCustomerInfo failed", e);
    return null;
  }
};
