const DEMO_ORG_ID = "ecb399e5-bf2f-487a-b2e0-f3104cfd2b30";

export function getClientOrgId(): string {
  if (typeof window === "undefined") return DEMO_ORG_ID;
  const match = document.cookie.match(/(?:^|; )invoicecraft_org=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : DEMO_ORG_ID;
}
