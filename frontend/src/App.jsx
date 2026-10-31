import { useEffect, useRef, useState } from "react";
import Header, { PALETTES } from "./components/Header.jsx";
import Scene from "./components/Scene.jsx";
import ChaiGlass from "./components/ChaiGlass.jsx";
import Player from "./components/Player.jsx";
import RainOverlay from "./components/RainOverlay.jsx";
import About from "./components/About.jsx";
import Faq from "./components/Faq.jsx";
import Footer from "./components/Footer.jsx";
import { ambience } from "./ambience.js";

const QUIPS = [
  "Ek aur cutting, bhaiya!",
  "Adrak thoda zyada daalna.",
  "Dil ka dard, chai ke saath.",
  "Aaj raat kahin mat jao.",
];

export default function App() {
  const [palette, setPalette] = useState(() => Number(localStorage.getItem("palette")) % PALETTES.length || 0);
  const [rain, setRain] = useState(false);
  const [rainVol, setRainVol] = useState(() => {
    const saved = Number(localStorage.getItem("rainVol"));
    return localStorage.getItem("rainVol") !== null && saved >= 0 && saved <= 100 ? saved : 70;
  });
  const [tracks, setTracks] = useState([]);
  const [cups, setCups] = useState(1);
  const [level, setLevel] = useState(70);
  const [busy, setBusy] = useState(false);
  const [pouring, setPouring] = useState(false);
  const [quip, setQuip] = useState("Barish ho rahi hai. Chai pee lo.");
  const timers = useRef([]);

  useEffect(() => {
    document.documentElement.dataset.palette = String(palette);
    localStorage.setItem("palette", String(palette));
  }, [palette]);

  useEffect(() => {
    fetch("/api/tracks")
      .then((r) => r.json())
      .then(setTracks)
      .catch(() => setTracks([]));
  }, []);

  // Browsers need a gesture before any sound; the first interaction wakes the rain.
  useEffect(() => {
    const unlock = () => ambience.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => { ambience.setRain(rain); }, [rain]);

  useEffect(() => {
    ambience.setVolume(rainVol / 100);
    localStorage.setItem("rainVol", String(rainVol));
  }, [rainVol]);

  // The tea cools and gets sipped over time.
  useEffect(() => {
    const id = setInterval(() => setLevel((l) => (l > 30 && !busy ? l - 2 : l)), 4000);
    return () => clearInterval(id);
  }, [busy]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const order = () => {
    if (busy) return;
    setBusy(true);
    ambience.order();
    setLevel(0);
    setQuip("Ubal raha hai...");
    // The pour starts when the boil finishes.
    later(() => {
      setPouring(true);
      setLevel(100);
      setCups((c) => c + 1);
      setPalette((p) => (p + 1) % PALETTES.length);
      setQuip(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
    }, 2300);
    later(() => { setPouring(false); setBusy(false); }, 5500);
  };

  return (
    <>
      <a className="skip" href="#about">Skip to content</a>

      <section className="hero">
        <Scene />
        <div className="hero-shade" />
        <Header palette={palette} onPalette={setPalette} rain={rain} onRain={() => setRain((r) => !r)}
                rainVol={rainVol} onRainVol={setRainVol} />
        <ChaiGlass level={level} pouring={pouring} />

        <div className="hero-body">
          <p className="eyebrow">THE MIDNIGHT TAPRI</p>
          <h1 className="hero-title">Chai <span>&amp;</span> Rain</h1>
          <p className="hero-hindi">चाय और बारिश</p>
          <p className="hero-sub">Cutting chai, neon lights, soulful tunes</p>

          <button type="button" className="order" onClick={order} disabled={busy}>
            Order another cutting chai
            <span>{cups} so far</span>
          </button>
          <p className="quip" aria-live="polite">{quip}</p>

          <Player tracks={tracks} />
        </div>

        <a className="scroll-cue" href="#about" aria-label="Scroll to learn more">
          <span>Scroll</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </section>

      <RainOverlay active={rain} />

      <main>
        <About />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
