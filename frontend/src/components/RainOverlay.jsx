import { useEffect, useRef } from "react";
import { startRainCanvas } from "../rainCanvas.js";
import { ambience } from "../ambience.js";

export default function RainOverlay({ active }) {
  const canvasRef = useRef(null);
  const flashRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    return startRainCanvas(canvasRef.current);
  }, [active]);

  // Lightning: two quick flashes, then thunder a moment later.
  useEffect(() => {
    if (!active) return;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const strike = () => {
      const el = flashRef.current;
      if (el) {
        el.style.opacity = "0.85";
        later(() => (el.style.opacity = "0"), 70);
        later(() => (el.style.opacity = "0.55"), 160);
        later(() => (el.style.opacity = "0"), 240);
      }
      later(() => ambience.thunder(), 700 + Math.random() * 1200);
      later(strike, 8000 + Math.random() * 12000);
    };
    later(strike, 4000);
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <>
      <canvas ref={canvasRef} className={`rain-canvas ${active ? "active" : ""}`} aria-hidden="true" />
      <div ref={flashRef} className="lightning" aria-hidden="true" />
    </>
  );
}
