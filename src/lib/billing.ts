export interface BillingSettings {
  brand?: {
    name?: string;
    address?: string;
    email?: string;
    phone?: string;
    website?: string;
    logo_url?: string | null;
    accent_color?: string;
    footer_text?: string;
  };
  numbering?: {
    invoice_prefix?: string;
    proposal_prefix?: string;
    act_prefix?: string;
    padding?: number;
    include_year?: boolean;
    start_at?: number;
  };
  tax?: {
    mode?: "none" | "vat" | "nds" | "gst";
    rate?: number;
    label?: string;
    tax_included?: boolean;
  };
  whiteLabel?: {
    active?: boolean;
    portal_name?: string;
    hide_branding?: boolean;
    custom_domain?: string;
  };
  theme?: "light" | "dark" | "system";
}

export type DocType = "proposal" | "invoice" | "act";

export const DEFAULT_SETTINGS: BillingSettings = {
  brand: {
    name: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    logo_url: null,
    accent_color: "#2563eb",
    footer_text: "",
  },
  numbering: {
    invoice_prefix: "INV",
    proposal_prefix: "PRO",
    act_prefix: "ACT",
    padding: 3,
    include_year: true,
    start_at: 1,
  },
  tax: {
    mode: "none",
    rate: 0,
    label: "",
    tax_included: false,
  },
  whiteLabel: {
    active: false,
    portal_name: "",
    hide_branding: false,
    custom_domain: "",
  },
  theme: "system",
};

export function getPrefixForType(type: DocType, settings: BillingSettings): string {
  const n = settings.numbering || DEFAULT_SETTINGS.numbering!;
  switch (type) {
    case "invoice":
      return n.invoice_prefix || "INV";
    case "proposal":
      return n.proposal_prefix || "PRO";
    case "act":
      return n.act_prefix || "ACT";
  }
}

/**
 * Generate the next document number based on numbering rules.
 * Returns a number like "INV-2026-001".
 */
export function generateDocumentNumber(
  type: DocType,
  count: number,
  settings: BillingSettings
): string {
  const n = settings.numbering || DEFAULT_SETTINGS.numbering!;
  const prefix = getPrefixForType(type, settings);
  const padding = n.padding ?? 3;
  const startAt = n.start_at ?? 1;
  const seq = startAt + count;
  const seqStr = String(seq).padStart(padding, "0");
  const year = n.include_year ? `${new Date().getFullYear()}-` : "";
  return `${prefix}-${year}${seqStr}`;
}

export interface TaxTotals {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  taxLabel: string;
}

/**
 * Compute subtotal / tax / grand total.
 * If tax_included, the line items already include tax (tax shown but total unchanged).
 */
export function computeTotals(
  itemsTotal: number,
  settings: BillingSettings
): TaxTotals {
  const tax = settings.tax || DEFAULT_SETTINGS.tax!;
  const rate = tax.mode && tax.mode !== "none" ? tax.rate || 0 : 0;
  const taxLabel = tax.label || (tax.mode ? tax.mode.toUpperCase() : "");
  const taxAmount = rate > 0 ? (itemsTotal * rate) / 100 : 0;

  return {
    subtotal: itemsTotal,
    taxRate: rate,
    taxAmount: tax.mode === "none" ? 0 : tax.tax_included ? taxAmount : taxAmount,
    total: tax.tax_included ? itemsTotal : itemsTotal + Math.max(0, taxAmount),
    taxLabel,
  };
}