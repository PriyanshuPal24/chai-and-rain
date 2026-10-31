// Glass fills from the bottom; level is 0 (empty) to 100 (full).
export default function ChaiGlass({ level, pouring }) {
  return (
    <div className={`glass-stage ${pouring ? "pouring" : ""}`}>
      <div className="steam" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <svg className="glass" viewBox="0 0 200 260" role="img" aria-label="A steaming glass of cutting chai">
        <defs>
          <clipPath id="glassClip">
            <path d="M40 40 L160 40 L148 228 Q147 240 136 240 L64 240 Q53 240 52 228 Z" />
          </clipPath>
          <linearGradient id="tea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e0944a" />
            <stop offset="1" stopColor="#8a3f12" />
          </linearGradient>
          <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity=".35" />
            <stop offset=".35" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity=".12" />
          </linearGradient>
        </defs>
        <g clipPath="url(#glassClip)">
          <g className="tea-level" style={{ transform: `translateY(${(1 - level / 100) * 170}px)` }}>
            <rect x="30" y="60" width="140" height="200" fill="url(#tea)" />
            <ellipse cx="100" cy="60" rx="64" ry="7" fill="#f0c48a" />
            <path className="foam" d="M40 60 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="#f6dcae" opacity=".8" />
          </g>
        </g>
        <path d="M40 40 L160 40 L148 228 Q147 240 136 240 L64 240 Q53 240 52 228 Z"
              fill="url(#shine)" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
        <path d="M60 58 L68 220" stroke="rgba(255,255,255,.35)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="saucer" aria-hidden="true" />
    </div>
  );
}
