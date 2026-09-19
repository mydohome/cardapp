import bwipjs from "bwip-js/browser";
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCard, markRecent } from "../lib/cardCache";

const BWIP_TYPE_BY_FORMAT: Record<string, string> = {
  EAN13: "ean13",
  EAN8: "ean8",
  CODE128: "code128",
  CODE39: "code39",
  QRCODE: "qrcode",
  PDF417: "pdf417",
  AZTEC: "azteccode",
  CODABAR: "rationalizedCodabar",
};

export default function CardFullscreenPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeLockRef = useRef<any>(null);

  const card = id ? getCard(id) : undefined;

  useEffect(() => {
    if (id) markRecent(id);
  }, [id]);

  useEffect(() => {
    if (!card || !canvasRef.current) return;
    try {
      bwipjs.toCanvas(canvasRef.current, {
        bcid: BWIP_TYPE_BY_FORMAT[card.barcode_format] || "code128",
        text: card.barcode_value,
        scale: 4,
        height: card.barcode_format === "QRCODE" ? 40 : 15,
        includetext: true,
      });
    } catch (err) {
      console.error("Errore rendering barcode", err);
    }
  }, [card]);

  useEffect(() => {
    // Evita lo spegnimento dello schermo mentre si mostra il barcode alla cassa.
    (navigator as any).wakeLock
      ?.request("screen")
      .then((lock: any) => {
        wakeLockRef.current = lock;
      })
      .catch(() => {
        /* non supportato su questo browser: nessun problema, degrada silenziosamente */
      });
    return () => {
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  if (!card) {
    return (
      <div className="centered-page">
        <p>Carta non trovata (prova a tornare indietro e ricaricare la lista).</p>
        <button onClick={() => navigate("/")}>Torna alla lista</button>
      </div>
    );
  }

  return (
    <div className="fullscreen-barcode" onClick={() => navigate(-1)}>
      <span className="card-title">{card.label}</span>
      <canvas ref={canvasRef} />
      <span className="hint">Tocca per tornare indietro</span>
    </div>
  );
}
