import { useEffect, useRef, useState } from "react";

export const PALETTES = ["Neon Night", "Amber Tapri", "Magenta Haze", "Monsoon Green"];

export default function Header({ palette, onPalette, rain, onRain, rainVol, onRainVol }) {
  const [shared, setShared] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  async function share() {
    const data = { title: document.title, text: "Midnight tapri in your browser: Chai & Rain", url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(data); } catch { /* dismissed */ }
      return;
    }
    try { await navigator.clipboard.writeText(data.url); } catch { return; }
    setShared(true);
    timer.current = setTimeout(() => setShared(false), 2000);
  }

  return (
    <header className="header">
      <a className="pill brand" href="#top">
        <span className="font-hindi">चाय</span> &amp; Rain
      </a>

      <div className="header-actions">
        <span className="select-wrap">
          <select className="pill select" value={palette} onChange={(e) => onPalette(Number(e.target.value))} aria-label="Colour theme">
            {PALETTES.map((name, i) => <option key={name} value={i}>{name}</option>)}
          </select>
          <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>

        <button type="button" className={`pill rain-pill ${rain ? "active" : ""}`} onClick={onRain} aria-pressed={rain}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 16a4 4 0 010-8 5 5 0 019.6-1A4.5 4.5 0 0117 16" />
            <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
          </svg>
          Rain
        </button>

        {rain && (
          <label className="pill rain-volume">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9z" />
            </svg>
            <input type="range" min="0" max="100" value={rainVol} aria-label="Rain volume"
                   onChange={(e) => onRainVol(Number(e.target.value))} />
          </label>
        )}

        <button type="button" className="pill share-pill" onClick={share}>
          {shared ? "Link copied" : "Share"}
        </button>
      </div>
    </header>
  );
}
