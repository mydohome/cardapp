/** Misura l'estensione orizzontale reale del disegno (barre + testo) su un
 * canvas a sfondo bianco, ignorando i pixel quasi bianchi/trasparenti. */
function measureHorizontalInk(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let maxX = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 10) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r < 245 || g < 245 || b < 245) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  return { minX, maxX };
}

/** bwip-js non sempre riserva lo stesso quiet space su entrambi i lati (per
 * EAN-13/EAN-8 la cifra iniziale, stampata fuori dalle barre solo a
 * sinistra, lascia il canvas visibilmente sbilanciato verso destra).
 * L'opzione "guardwhitespace" di bwip-js corregge lo squilibrio ma aggiunge
 * gli indicatori "<"/">" ben visibili accanto al codice, che sulla carta
 * risultano fuori posto. Qui otteniamo lo stesso riequilibrio misurando i
 * pixel realmente disegnati e aggiungendo margine bianco puro dal lato più
 * corto, senza alcun carattere aggiuntivo. */
export function centerBarcodeCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const { width, height } = source;
  const ctx = source.getContext("2d");
  if (!ctx) return source;

  const { minX, maxX } = measureHorizontalInk(ctx, width, height);
  if (maxX < minX) return source; // canvas vuoto: niente da bilanciare

  const leftMargin = minX;
  const rightMargin = width - 1 - maxX;
  const extra = Math.abs(leftMargin - rightMargin);
  if (extra < 2) return source; // gia' equilibrato, non serve ridisegnare

  const balanced = document.createElement("canvas");
  balanced.width = width + extra;
  balanced.height = height;
  const balancedCtx = balanced.getContext("2d")!;
  balancedCtx.fillStyle = "#ffffff";
  balancedCtx.fillRect(0, 0, balanced.width, balanced.height);
  const xOffset = leftMargin > rightMargin ? 0 : extra;
  balancedCtx.drawImage(source, xOffset, 0);
  return balanced;
}
