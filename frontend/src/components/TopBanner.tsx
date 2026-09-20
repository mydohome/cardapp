export default function TopBanner() {
  return (
    <header className="top-banner">
      <img src="/logo-badge.png" alt="" className="top-banner-logo" />
      <div className="top-banner-text">
        <span className="top-banner-title">
          <span className="top-banner-title-card">Card</span>
          <span className="top-banner-title-app">App</span>
        </span>
        <span className="top-banner-tagline">Le tue carte fedeltà, sempre con te</span>
      </div>
    </header>
  );
}
