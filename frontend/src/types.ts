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
  photo_key?: string | null;
  notes?: string | null;
  updated_at: string;
  shared_by?: string | null;
}
