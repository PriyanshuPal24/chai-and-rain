// Original illustrated midnight tapri: plastic tarp, tea stall, neon sign, wet street.
export default function Scene() {
  return (
    <div className="scene" id="top">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img"
           aria-label="Illustration of a roadside tea stall under a plastic tarp on a rainy neon-lit night">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--bg1)" />
            <stop offset="1" stopColor="var(--bg2)" />
          </linearGradient>
          <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#120c1d" />
            <stop offset="1" stopColor="#05030a" />
          </linearGradient>
          <linearGradient id="tarp" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2f5f8f" />
            <stop offset="1" stopColor="#173553" />
          </linearGradient>
          <radialGradient id="lampCone" cx="0.5" cy="0" r="1">
            <stop offset="0" stopColor="#ffd98a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="stoveGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ff9a3c" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ff9a3c" stopOpacity="0" />
          </radialGradient>
          <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
          <filter id="neonGlow" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="1600" height="900" fill="url(#sky)" />

        {/* City silhouette and lit windows */}
        <g fill="#05030c" opacity="0.9">
          <rect x="0" y="260" width="170" height="440" /><rect x="180" y="360" width="130" height="340" />
          <rect x="1130" y="300" width="150" height="400" /><rect x="1290" y="200" width="190" height="500" />
          <rect x="1490" y="330" width="110" height="370" />
        </g>
        <g opacity="0.55">
          <rect x="30" y="310" width="20" height="28" fill="var(--n1)" /><rect x="90" y="400" width="20" height="28" fill="var(--n2)" />
          <rect x="30" y="480" width="20" height="28" fill="#ffd98a" /><rect x="215" y="420" width="20" height="28" fill="var(--n1)" />
          <rect x="1330" y="260" width="20" height="28" fill="var(--n2)" /><rect x="1400" y="340" width="20" height="28" fill="#ffd98a" />
          <rect x="1330" y="440" width="20" height="28" fill="var(--n1)" /><rect x="1530" y="400" width="20" height="28" fill="var(--n2)" />
        </g>

        {/* Out-of-focus neon from the street */}
        <g filter="url(#blur)" opacity="0.55">
          <circle cx="120" cy="620" r="70" fill="var(--n1)" /><circle cx="330" cy="660" r="45" fill="var(--n2)" />
          <circle cx="1180" cy="640" r="85" fill="var(--n2)" /><circle cx="1450" cy="680" r="50" fill="var(--n1)" />
        </g>

        {/* Street lamp */}
        <polygon points="1240,170 1130,700 1350,700" fill="url(#lampCone)" />
        <rect x="1236" y="170" width="8" height="540" fill="#0b0715" />
        <rect x="1200" y="160" width="80" height="14" rx="6" fill="#0b0715" />
        <circle className="flicker" cx="1240" cy="178" r="12" fill="#ffe7a8" />

        {/* Wet road with neon reflections */}
        <rect y="700" width="1600" height="200" fill="url(#road)" />
        <g opacity="0.35" filter="url(#blur)">
          <ellipse cx="620" cy="800" rx="60" ry="90" fill="var(--n1)" />
          <ellipse cx="820" cy="810" rx="50" ry="80" fill="var(--n2)" />
          <ellipse cx="1240" cy="790" rx="40" ry="70" fill="#ffd98a" />
        </g>
        <g className="ripples" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5">
          <ellipse cx="300" cy="820" rx="26" ry="6" /><ellipse cx="520" cy="860" rx="30" ry="7" />
          <ellipse cx="1000" cy="835" rx="28" ry="6" /><ellipse cx="1360" cy="855" rx="32" ry="7" />
        </g>

        {/* Stall posts */}
        <rect x="430" y="270" width="12" height="440" fill="#2a1d14" />
        <rect x="1000" y="270" width="12" height="440" fill="#2a1d14" />

        {/* Tarp sagging with rainwater */}
        <path d="M360 190 L1080 190 L1110 300 Q720 350 330 300 Z" fill="url(#tarp)" />
        <path d="M360 190 L1080 190" stroke="#7fb0e0" strokeWidth="4" opacity="0.6" />
        <g stroke="rgba(255,255,255,.14)" strokeWidth="2">
          <path d="M520 192 Q500 260 480 318" /><path d="M720 192 Q720 270 720 336" /><path d="M920 192 Q940 262 960 322" />
        </g>
        <g stroke="rgba(190,215,255,.7)" strokeWidth="3" strokeLinecap="round">
          <line className="drip d1" x1="470" y1="318" x2="470" y2="332" />
          <line className="drip d2" x1="640" y1="338" x2="640" y2="352" />
          <line className="drip d3" x1="800" y1="342" x2="800" y2="356" />
          <line className="drip d4" x1="980" y1="322" x2="980" y2="336" />
        </g>

        {/* Neon sign */}
        <rect x="548" y="350" width="246" height="86" rx="12" fill="#0b0715" stroke="var(--n2)" strokeWidth="3" opacity="0.95" />
        <text className="neon-text" x="671" y="412" textAnchor="middle" fontSize="58" fill="var(--n1)"
              filter="url(#neonGlow)" fontFamily="'Yatra One','Rozha One',serif">चाय</text>

        {/* Counter, kettle and glasses */}
        <rect x="450" y="560" width="540" height="150" fill="#3a2616" />
        <rect x="450" y="560" width="540" height="14" fill="#5b3b20" />
        <ellipse cx="600" cy="552" rx="90" ry="40" fill="url(#stoveGlow)" />
        <rect x="560" y="508" width="76" height="46" rx="8" fill="#b9bcc2" />
        <path d="M636 520 Q668 508 676 484" stroke="#b9bcc2" strokeWidth="8" fill="none" strokeLinecap="round" />
        <rect x="578" y="494" width="40" height="16" rx="6" fill="#8b8e94" />
        <g className="kettle-steam" stroke="rgba(255,255,255,.5)" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M678 470 q10 -20 0 -40" /><path d="M692 474 q10 -20 0 -40" />
        </g>
        <g fill="rgba(255,255,255,.25)" stroke="rgba(255,255,255,.6)" strokeWidth="2">
          <rect x="760" y="520" width="26" height="40" rx="4" /><rect x="800" y="520" width="26" height="40" rx="4" />
          <rect x="840" y="520" width="26" height="40" rx="4" />
        </g>
        <g fill="#c4782a" opacity="0.9">
          <rect x="762" y="540" width="22" height="18" rx="3" /><rect x="802" y="536" width="22" height="22" rx="3" />
        </g>

        {/* Stools and two figures sheltering */}
        <g>
          <rect x="300" y="620" width="70" height="10" rx="4" fill="#5b3b20" />
          <rect x="316" y="630" width="6" height="80" fill="#3a2616" /><rect x="350" y="630" width="6" height="80" fill="#3a2616" />
          <circle cx="335" cy="548" r="22" fill="#2a1d2e" />
          <path d="M305 628 Q310 570 335 570 Q362 570 368 628 Z" fill="#3a2d52" />
          <rect x="1050" y="640" width="70" height="10" rx="4" fill="#5b3b20" />
          <rect x="1066" y="650" width="6" height="60" fill="#3a2616" /><rect x="1100" y="650" width="6" height="60" fill="#3a2616" />
          <circle cx="1085" cy="570" r="21" fill="#2a1d2e" />
          <path d="M1056 648 Q1060 592 1085 592 Q1112 592 1118 648 Z" fill="#5a2a3c" />
        </g>
      </svg>
      {/* Optional photo: drop banner.jpg (and mobile.png) into public/img to replace the illustration. */}
      <img
        className="scene-photo"
        alt=""
        src={window.matchMedia("(max-width: 640px)").matches ? "/img/mobile.png" : "/img/banner.jpg"}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    </div>
  );
}
