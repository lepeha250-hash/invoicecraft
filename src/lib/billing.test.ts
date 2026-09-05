import { describe, it, expect } from "vitest";
import {
  DEFAULT_SETTINGS,
  computeTotals,
  generateDocumentNumber,
  getPrefixForType,
} from "./billing";

describe("generateDocumentNumber", () => {
  it("uses defaults for prefix, padding and current year", () => {
    const year = String(new Date().getFullYear());
    expect(generateDocumentNumber("invoice", 0, DEFAULT_SETTINGS)).toBe(`INV-${year}-001`);
    expect(generateDocumentNumber("proposal", 4, DEFAULT_SETTINGS)).toBe(`PRO-${year}-005`);
    expect(generateDocumentNumber("act", 12, DEFAULT_SETTINGS)).toBe(`ACT-${year}-013`);
  });

  it("respects custom padding, start_at and year toggle", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      numbering: { invoice_prefix: "IV", padding: 5, start_at: 100, include_year: false },
    };
    expect(generateDocumentNumber("invoice", 1, settings)).toBe("IV-00101");
  });
});

describe("getPrefixForType", () => {
  it("maps each document type to its prefix", () => {
    expect(getPrefixForType("invoice", DEFAULT_SETTINGS)).toBe("INV");
    expect(getPrefixForType("proposal", DEFAULT_SETTINGS)).toBe("PRO");
    expect(getPrefixForType("act", DEFAULT_SETTINGS)).toBe("ACT");
  });
});

describe("computeTotals", () => {
  it("returns zero tax when tax is disabled", () => {
    const totals = computeTotals(100, DEFAULT_SETTINGS);
    expect(totals.subtotal).toBe(100);
    expect(totals.taxAmount).toBe(0);
    expect(totals.total).toBe(100);
  });

  it("adds VAT to the total when tax is not included", () => {
    const totals = computeTotals(200, {
      ...DEFAULT_SETTINGS,
      tax: { mode: "vat", rate: 20, label: "VAT" },
    });
    expect(totals.taxAmount).toBe(40);
    expect(totals.total).toBe(240);
    expect(totals.taxLabel).toBe("VAT");
  });

  it("keeps the total unchanged when tax is included in line items", () => {
    const totals = computeTotals(120, {
      ...DEFAULT_SETTINGS,
      tax: { mode: "vat", rate: 20, label: "VAT", tax_included: true },
    });
    expect(totals.total).toBe(120);
    expect(totals.taxAmount).toBe(24);
  });
});