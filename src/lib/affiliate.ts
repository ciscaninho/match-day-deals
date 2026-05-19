/**
 * Generic affiliate transformation layer.
 *
 * Register a new network/merchant by adding an entry to AFFILIATE_REGISTRY.
 * Call transformAffiliateUrl(destination, opts?) wherever an outbound ticket
 * link is rendered. Unsupported merchants pass through untouched.
 */

export type AffiliateNetwork = "partnerize" | "awin" | "impact" | "cj" | "direct";

export interface AffiliateProvider {
  /** Stable id, e.g. "ticombo" */
  id: string;
  /** Display merchant name */
  merchant: string;
  network: AffiliateNetwork;
  /** Hostnames that should be transformed (without protocol, lowercase). */
  hosts: string[];
  /** Whether transformation is active (kill-switch per merchant). */
  affiliateEnabled: boolean;
  /**
   * Build the final tracked URL from a clean destination URL.
   * Receives the original destination string and returns a transformed URL.
   */
  build: (destination: string) => string;
  /** Optional human label for the campaign / camref. */
  campaign?: string;
}

// --- Networks / providers ---------------------------------------------------

const TICOMBO_CAMREF = "1101l5JJNi";
const TICOMBO_BASE = `https://ticombo.prf.hn/click/camref:${TICOMBO_CAMREF}/destination:`;

const ticombo: AffiliateProvider = {
  id: "ticombo",
  merchant: "Ticombo",
  network: "partnerize",
  hosts: ["ticombo.com", "www.ticombo.com"],
  affiliateEnabled: true,
  campaign: `camref:${TICOMBO_CAMREF}`,
  build: (destination) => `${TICOMBO_BASE}${encodeURIComponent(destination)}`,
};

export const AFFILIATE_REGISTRY: AffiliateProvider[] = [ticombo];

// --- Core API ---------------------------------------------------------------

export interface AffiliateMatch {
  provider: AffiliateProvider;
}

const safeUrl = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

/** Look up the registered provider for a destination URL, if any. */
export const findAffiliateProvider = (destination: string): AffiliateProvider | null => {
  const u = safeUrl(destination);
  if (!u) return null;
  const host = u.hostname.toLowerCase();
  for (const p of AFFILIATE_REGISTRY) {
    if (!p.affiliateEnabled) continue;
    if (p.hosts.some((h) => host === h || host.endsWith(`.${h}`))) return p;
  }
  return null;
};

export interface AffiliateOptions {
  /** Force a specific provider id (skip host detection). */
  providerId?: string;
  /** Disable transformation (returns destination unchanged). */
  disable?: boolean;
}

/**
 * Transform a destination URL into a tracked affiliate URL when a matching
 * provider is registered and affiliate-enabled. Otherwise returns the
 * destination unchanged. Internal/relative URLs are always passed through.
 */
export const transformAffiliateUrl = (
  destination: string | null | undefined,
  opts: AffiliateOptions = {},
): string => {
  if (!destination) return "";
  if (opts.disable) return destination;
  // Pass through relative / internal links
  if (!/^https?:\/\//i.test(destination)) return destination;

  const provider = opts.providerId
    ? AFFILIATE_REGISTRY.find((p) => p.id === opts.providerId && p.affiliateEnabled) ?? null
    : findAffiliateProvider(destination);

  if (!provider) return destination;
  try {
    return provider.build(destination);
  } catch {
    return destination;
  }
};

export interface AffiliateDebugInfo {
  destination: string;
  transformed: string;
  isTracked: boolean;
  network: AffiliateNetwork | null;
  merchant: string | null;
  providerId: string | null;
  campaign: string | null;
}

/** Return debug metadata for an outbound URL. */
export const inspectAffiliateUrl = (destination: string | null | undefined): AffiliateDebugInfo => {
  const dest = destination ?? "";
  const provider = dest ? findAffiliateProvider(dest) : null;
  const transformed = transformAffiliateUrl(dest);
  return {
    destination: dest,
    transformed,
    isTracked: !!provider && transformed !== dest,
    network: provider?.network ?? null,
    merchant: provider?.merchant ?? null,
    providerId: provider?.id ?? null,
    campaign: provider?.campaign ?? null,
  };
};

/** True when the URL would be (or already is) a tracked affiliate link. */
export const isAffiliateUrl = (url: string | null | undefined): boolean =>
  !!url && !!findAffiliateProvider(url);
