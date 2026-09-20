import type { BarcodeFormat, Card, Invite, Share, SharePermission, Store, User } from "../types";

const API_BASE = "/api";

export interface PhotoRecognitionResult {
  detected_text?: string | null;
  matched_store?: Store | null;
  decoded_barcode_value?: string | null;
  decoded_barcode_format?: string | null;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...authHeaders(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Errore ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  async login(usernameOrEmail: string, password: string) {
    const form = new URLSearchParams();
    form.set("username", usernameOrEmail);
    form.set("password", password);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    if (!res.ok) throw new Error("Utente o password errati");
    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);
    return data;
  },

  register(username: string, password: string, email?: string, display_name?: string) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, email, display_name }),
    });
  },

  logout() {
    localStorage.removeItem("access_token");
  },

  me() {
    return request<User>("/auth/me");
  },

  listCards() {
    return request<Card[]>("/cards");
  },

  createCard(payload: { label: string; barcode_value: string; barcode_format: BarcodeFormat; store_id?: string }) {
    return request<Card>("/cards", { method: "POST", body: JSON.stringify(payload) });
  },

  updateCard(
    id: string,
    payload: Partial<{
      label: string;
      barcode_value: string;
      barcode_format: BarcodeFormat;
      store_id: string | null;
      notes: string | null;
    }>
  ) {
    return request<Card>(`/cards/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  },

  deleteCard(id: string) {
    return request<void>(`/cards/${id}`, { method: "DELETE" });
  },

  setFavorite(cardId: string, favorite: boolean) {
    return request<Card>(`/cards/${cardId}/favorite`, { method: favorite ? "POST" : "DELETE" });
  },

  searchStores(q: string) {
    return request<Store[]>(`/stores?q=${encodeURIComponent(q)}`);
  },

  recognizePhoto(file: File) {
    const form = new FormData();
    form.append("file", file);
    return request<PhotoRecognitionResult>("/cards/recognize-photo", { method: "POST", body: form });
  },

  shareCard(cardId: string, username: string, permission: SharePermission = "view") {
    return request<void>(`/cards/${cardId}/shares`, {
      method: "POST",
      body: JSON.stringify({ username, permission }),
    });
  },

  listShares(cardId: string) {
    return request<Share[]>(`/cards/${cardId}/shares`);
  },

  revokeShare(cardId: string, userId: string) {
    return request<void>(`/cards/${cardId}/shares/${userId}`, { method: "DELETE" });
  },

  createInvite(cardId: string, permission: SharePermission = "view", expiresInHours = 72) {
    return request<Invite>(`/cards/${cardId}/shares/invite`, {
      method: "POST",
      body: JSON.stringify({ permission, expires_in_hours: expiresInHours }),
    });
  },

  acceptInvite(token: string) {
    return request<{ status: string; card_id: string }>(`/invites/${token}/accept`, { method: "POST" });
  },
};
