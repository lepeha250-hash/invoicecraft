import { describe, it, expect, vi, beforeEach } from "vitest";
import { API_KEY_PREFIX } from "./api-keys";

vi.mock("@/lib/supabase/server", () => {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const update = vi.fn().mockResolvedValue({});
  const admin = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle,
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }),
    }),
    __mocks: { maybeSingle, update },
  };
  return { supabaseAdmin: admin };
});

import { generateApiKey, resolveApiKey, extractBearerToken } from "./api-keys";
import { supabaseAdmin } from "@/lib/supabase/server";

const mockMaybeSingle = (supabaseAdmin as unknown as { __mocks: { maybeSingle: ReturnType<typeof vi.fn> } }).__mocks.maybeSingle;

describe("generateApiKey", () => {
  it("starts with ic_ and has 4+48 chars", () => {
    const key = generateApiKey();
    expect(key).toMatch(/^ic_[0-9a-f]{48}$/);
  });

  it("produces unique keys", () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateApiKey()));
    expect(keys.size).toBe(50);
  });
});

describe("extractBearerToken", () => {
  it("extracts token after Bearer", () => {
    expect(extractBearerToken("Bearer ic_123abc")).toBe("ic_123abc");
  });
  it("returns null for missing header", () => {
    expect(extractBearerToken(null)).toBeNull();
  });
  it("returns null for non-bearer", () => {
    expect(extractBearerToken("Basic abc")).toBeNull();
  });
  it("returns null for empty token", () => {
    expect(extractBearerToken("Bearer ")).toBeNull();
  });
});

describe("resolveApiKey", () => {
  beforeEach(() => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it("returns null for empty key", async () => {
    expect(await resolveApiKey("")).toBeNull();
  });

  it("returns null for wrong prefix", async () => {
    expect(await resolveApiKey("sk_test123")).toBeNull();
  });

  it("returns null when db finds nothing", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await resolveApiKey(`${API_KEY_PREFIX}abcdef1234567890abcdef1234567890abcdef1234567890`)).toBeNull();
  });

  it("returns org_id when found", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { org_id: "org-1", id: "key-1" }, error: null });
    const orgId = await resolveApiKey(`${API_KEY_PREFIX}abcdef1234567890abcdef1234567890abcdef1234567890`);
    expect(orgId).toBe("org-1");
  });
});