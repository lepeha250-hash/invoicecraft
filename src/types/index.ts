export type DocumentType = "proposal" | "invoice" | "act";
export type DocumentStatus = "draft" | "sent" | "paid" | "archived";

export interface Organization {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface Document {
  id: string;
  org_id: string;
  type: DocumentType;
  title: string;
  content: DocumentContent;
  status: DocumentStatus;
  total: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentContent {
  header: {
    company_name: string;
    company_address: string;
    client_name: string;
    client_address: string;
    number: string;
    date: string;
  };
  items: DocumentItem[];
  notes: string;
  terms: string;
}

export interface DocumentItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface Template {
  id: string;
  org_id: string | null;
  name: string;
  category: DocumentType;
  preview_url: string | null;
  content: DocumentContent;
  is_system: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan: "free" | "pro" | "business";
  status: "active" | "canceled" | "past_due";
  current_period_end: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  org_id: string | null;
}
