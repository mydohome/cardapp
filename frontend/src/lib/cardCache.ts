import Fuse from "fuse.js";
import { api } from "./api";
import type { Card } from "../types";

const CACHE_KEY = "cards_cache_v1";
const RECENTS_KEY = "recent_card_ids_v1";
const MAX_RECENTS = 8;

let fuse: Fuse<Card> | null = null;
let cardsById = new Map<string, Card>();

function buildFuse(cards: Card[]) {
  cardsById = new Map(cards.map((c) => [c.id, c]));
  fuse = new Fuse(cards, {
    keys: ["label", "store.name", "notes"],
    threshold: 0.35,
  });
}

export function getCachedCards(): Card[] {
  const raw = localStorage.getItem(CACHE_KEY);
  const cards: Card[] = raw ? JSON.parse(raw) : [];
  if (!fuse) buildFuse(cards);
  return cards;
}

/** Da chiamare all'avvio e dopo ogni modifica: aggiorna la cache locale usata dalla ricerca istantanea. */
export async function refreshCards(): Promise<Card[]> {
  const cards = await api.listCards();
  localStorage.setItem(CACHE_KEY, JSON.stringify(cards));
  buildFuse(cards);
  return cards;
}

export function searchCards(query: string): Card[] {
  if (!fuse) getCachedCards();
  if (!query.trim()) return getCachedCards();
  return fuse!.search(query).map((r) => r.item);
}

export function getCard(id: string): Card | undefined {
  if (cardsById.size === 0) getCachedCards();
  return cardsById.get(id);
}

export function markRecent(cardId: string) {
  const recents: string[] = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
  const updated = [cardId, ...recents.filter((id) => id !== cardId)].slice(0, MAX_RECENTS);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
}

export function getRecentCards(): Card[] {
  const ids: string[] = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
  return ids.map((id) => getCard(id)).filter((c): c is Card => !!c);
}

export function getFavoriteCards(): Card[] {
  return getCachedCards().filter((c) => c.is_favorite);
}
