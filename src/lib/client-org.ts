/**
 * Client-side org id: read from the `invoicecraft_org` cookie.
 * The middleware + sign-in flow guarantee this cookie exists for signed-in users.
 */
export function getClientOrgId(): string {
  if (typeof window === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )invoicecraft_org=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}