// Placeholder in attesa della grafica definitiva (logo + naming) che verra'
// fornita separatamente: per ora solo un blocco testuale minimale, facile da
// sostituire senza toccare il resto del layout (AppShell/BottomNav).
export default function TopBanner() {
  return (
    <header className="top-banner">
      <div className="top-banner-logo" aria-hidden="true">
        📇
      </div>
      <span className="top-banner-title">CardApp</span>
    </header>
  );
}
