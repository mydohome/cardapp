export type BarcodeFormat =
  | "EAN13"
  | "EAN8"
  | "CODE128"
  | "CODE39"
  | "QRCODE"
  | "PDF417"
  | "AZTEC"
  | "CODABAR";

export interface Store {
  id: string;
  name: string;
  logo_url?: string | null;
  category?: string | null;
}

export interface Card {
  id: string;
  label: string;
  barcode_value: string;
  barcode_format: BarcodeFormat;
  store?: Store | null;
  notes?: string | null;
  updated_at: string;
  shared_by?: string | null;
}

export type SharePermission = "view" | "edit";

export interface Share {
  user_id: string;
  username: string;
  display_name?: string | null;
  permission: SharePermission;
}

export interface Invite {
  token: string;
  expires_at?: string | null;
}
