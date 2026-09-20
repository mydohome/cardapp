/** Tavolozza colori per il badge carta: ogni coppia verificata a mano (vedi
 * commit) per un contrasto di almeno 4.5:1 con testo bianco su ENTRAMBI gli
 * stop del gradiente (non solo il più scuro: il testo può cadere ovunque
 * lungo la diagonale). Niente giallo/tonalità chiare che con il bianco
 * sopra risulterebbero illeggibili. */
const PALETTE: { from: string; to: string }[] = [
  { from: "#2563eb", to: "#0764f6" }, // blu
  { from: "#b91c1c", to: "#dc2626" }, // rosso
  { from: "#15803d", to: "#15803d" }, // verde
  { from: "#6d28d9", to: "#7c3aed" }, // viola
  { from: "#115e59", to: "#0f766e" }, // acquamarina
  { from: "#c2410c", to: "#c2410c" }, // arancio
  { from: "#a21caf", to: "#c026d3" }, // magenta
  { from: "#3730a3", to: "#4f46e5" }, // indaco
  { from: "#334155", to: "#475569" }, // ardesia
  { from: "#0e7490", to: "#0e7490" }, // ciano
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Colore del badge per una carta: stabile nel tempo (mai "sfarfalla" tra un
 * caricamento e l'altro), scelto in base al negozio quando c'è (stesso
 * negozio -> sempre stesso colore, coerente tra le carte), altrimenti in
 * base alla carta stessa (l'effetto è "casuale" ma resta fisso, non cambia
 * ad ogni apertura dell'app come farebbe un vero Math.random()). */
export function cardTileColor(storeId: string | null | undefined, cardId: string): { from: string; to: string } {
  const key = storeId || cardId;
  const index = hashString(key) % PALETTE.length;
  return PALETTE[index];
}
