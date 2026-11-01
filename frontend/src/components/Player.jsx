import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BLOCKED_KEY = "chai-rain-blocked";
// YouTube error codes meaning the video can never play here (not found / embedding disabled).
const BLOCK_CODES = [100, 101, 150];

function loadBlocked() {
  try {
    return new Set(JSON.parse(localStorage.getItem(BLOCKED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

const fmt = (s) => {
  if (!Number.isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
);
const PLAY = "M8 5v14l11-7z";
const PAUSE = "M6 5h4v14H6zM14 5h4v14h-4z";
const PREV = "M6 5h2v14H6zM20 5v14L9 12z";
const NEXT = "M16 5h2v14h-2zM4 5l11 7L4 19z";

let ytPromise;

// One second of silence; looping it keeps a real audio session open so the OS shows lock-screen controls.
function makeSilentWavUrl() {
  const rate = 8000;
  const buf = new ArrayBuffer(44 + rate);
  const v = new DataView(buf);
  const tag = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  tag(0, "RIFF"); v.setUint32(4, 36 + rate, true); tag(8, "WAVE"); tag(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  tag(36, "data"); v.setUint32(40, rate, true);
  new Uint8Array(buf, 44).fill(128);
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}
function loadYouTubeApi() {
  if (ytPromise) return ytPromise;
  ytPromise = new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT); };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return ytPromise;
}

export default function Player({ tracks }) {
  const audioRef = useRef(null);
  const keepAliveRef = useRef(null);
  const playingRef = useRef(false);
  const lastResume = useRef(0);
  const controls = useRef({});
  const resume = useRef(() => {});
  const ytRef = useRef(null);
  const ytHost = useRef(null);
  const ytLoaded = useRef("");
  const quoteTimer = useRef();
  const advance = useRef(() => {});
  const [ytReady, setYtReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [quote, setQuote] = useState("");
  const [blocked, setBlocked] = useState(loadBlocked);
  const [notice, setNotice] = useState("");
  const failures = useRef(0);
  const codecFailed = useRef(false);
  const onError = useRef(() => {});

  const playlist = useMemo(() => tracks.filter((t) => !blocked.has(t.id)), [tracks, blocked]);
  const track = playlist.length ? playlist[index % playlist.length] : undefined;
  const isYT = track?.kind === "youtube";
  const hasYT = tracks.some((t) => t.kind === "youtube");
  playingRef.current = playing;

  const showQuote = useCallback(async () => {
    try {
      const { text } = await (await fetch("/api/quotes/random")).json();
      setQuote(text);
      clearTimeout(quoteTimer.current);
      quoteTimer.current = setTimeout(() => setQuote(""), 7000);
    } catch {
      // Chatter is optional.
    }
  }, []);

  useEffect(() => () => clearTimeout(quoteTimer.current), []);

  const step = (delta) => {
    if (!playlist.length) return;
    setIndex((i) => (((i % playlist.length) + delta + playlist.length) % playlist.length));
    setTime(0);
    setDuration(0);
  };
  advance.current = () => { step(1); showQuote(); };

  onError.current = (code) => {
    failures.current += 1;
    if (code === 5) codecFailed.current = true;
    if (failures.current >= 10) {
      failures.current = 0;
      setPlaying(false);
      setNotice(
        codecFailed.current
          ? "This browser can't decode YouTube video (an in-editor browser often can't). Open the site in Chrome or Edge."
          : "Several songs in a row can't be played here (their owners block embedding). Try again or pick other videos."
      );
      return;
    }
    const badId = ytLoaded.current;
    if (!BLOCK_CODES.includes(code) || !badId) { step(1); return; }
    fetch("/api/blocked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [badId] }),
    }).catch(() => {});
    setBlocked((prev) => {
      const next = new Set(prev).add(badId);
      localStorage.setItem(BLOCKED_KEY, JSON.stringify([...next]));
      return next;
    });
    // The blocked track leaves the list, so the next one slides into the same slot.
    if (track?.id === badId) setIndex((i) => i % Math.max(playlist.length - 1, 1));
    setTime(0);
    setDuration(0);
  };

  // Hidden YouTube player used purely as the audio source, like a radio bridge.
  useEffect(() => {
    if (!hasYT) return;
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || ytRef.current) return;
      ytRef.current = new YT.Player(ytHost.current, {
        width: 200,
        height: 200,
        playerVars: { playsinline: 1, controls: 0, disablekb: 1, rel: 0 },
        events: {
          onReady: () => setYtReady(true),
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) failures.current = 0;
            if (e.data === YT.PlayerState.ENDED) advance.current();
            // The browser may pause the video when the tab is hidden; ask it to carry on.
            if (e.data === YT.PlayerState.PAUSED && playingRef.current && document.hidden
                && Date.now() - lastResume.current > 1500) {
              lastResume.current = Date.now();
              e.target.playVideo();
            }
          },
          onError: (e) => onError.current(e.data),
        },
      });
    });
    return () => { cancelled = true; };
  }, [hasYT]);

  useEffect(() => {
    if (!track) return;
    const audio = audioRef.current;
    const yt = ytRef.current;
    if (isYT) {
      audio?.pause();
      if (!ytReady || !yt) return;
      if (!playing) { yt.pauseVideo(); return; }
      if (ytLoaded.current !== track.id) {
        ytLoaded.current = track.id;
        yt.loadVideoById(track.id);
      } else {
        yt.playVideo();
      }
    } else {
      if (ytReady && yt) yt.pauseVideo();
      if (playing) audio?.play().catch(() => setPlaying(false));
      else audio?.pause();
    }
  }, [playing, index, track, isYT, ytReady]);

  useEffect(() => {
    if (!isYT || !ytReady) return;
    const id = setInterval(() => {
      const yt = ytRef.current;
      setTime(yt.getCurrentTime?.() || 0);
      setDuration(yt.getDuration?.() || 0);
    }, 500);
    return () => clearInterval(id);
  }, [isYT, ytReady]);

  // Barber chatter every so often while the station is on.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(showQuote, 45000);
    return () => clearInterval(id);
  }, [playing, showQuote]);

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    if (!duration) return;
    if (isYT) ytRef.current?.seekTo(ratio * duration, true);
    else if (audioRef.current) audioRef.current.currentTime = ratio * duration;
  };

  const toggle = () => {
    if (!track) return;
    setNotice("");
    if (!playing) showQuote();
    setPlaying((p) => !p);
  };

  controls.current = {
    play: () => { setNotice(""); setPlaying(true); },
    pause: () => setPlaying(false),
    step,
  };
  resume.current = () => {
    const yt = ytRef.current;
    if (playingRef.current && isYT && yt?.getPlayerState?.() === 2) yt.playVideo();
  };

  // Silent looping audio holds the audio session open while a YouTube song plays.
  useEffect(() => {
    const el = keepAliveRef.current;
    if (!el) return;
    if (!el.src) el.src = makeSilentWavUrl();
    if (playing && isYT) el.play().catch(() => {});
    else el.pause();
  }, [playing, isYT]);

  // Lock-screen and notification controls.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = track
      ? new MediaMetadata({
          title: track.title,
          artist: track.station,
          album: "Chai & Rain",
          artwork: track.thumb ? [{ src: track.thumb, sizes: "320x180", type: "image/jpeg" }] : [],
        })
      : null;
  }, [track]);

  useEffect(() => {
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const set = (action, fn) => {
      try { navigator.mediaSession.setActionHandler(action, fn); } catch { /* unsupported action */ }
    };
    set("play", () => controls.current.play());
    set("pause", () => controls.current.pause());
    set("previoustrack", () => controls.current.step(-1));
    set("nexttrack", () => controls.current.step(1));
    return () => ["play", "pause", "previoustrack", "nexttrack"].forEach((a) => set(a, null));
  }, []);

  // Coming back to the tab or unlocking the phone: resume if the browser paused us.
  useEffect(() => {
    const onBack = () => { if (!document.hidden) resume.current(); };
    document.addEventListener("visibilitychange", onBack);
    window.addEventListener("pageshow", onBack);
    window.addEventListener("focus", onBack);
    return () => {
      document.removeEventListener("visibilitychange", onBack);
      window.removeEventListener("pageshow", onBack);
      window.removeEventListener("focus", onBack);
    };
  }, []);

  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div className="player-wrap">
      <p className={`chatter ${quote ? "show" : ""}`} aria-live="polite">{quote}</p>

      <div className="music-player">
        <button
          type="button"
          className={`cover ${playing ? "spinning" : ""} ${track?.thumb ? "has-art" : ""}`}
          style={track?.thumb ? { backgroundImage: `url(${track.thumb})` } : undefined}
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
        >
          {!track?.thumb && <span className="cover-label font-hindi">चाय</span>}
          <span className="cover-hole" />
        </button>

        <div className="track-block">
          <p className="track-name">{track ? track.title : tracks.length ? "No playable songs left" : "Warming up the station..."}</p>
          <p className="station">{track ? track.station : "Chai & Rain Radio"}</p>
          <div className="progress-row">
            <span>{fmt(time)}</span>
            <div className="progress" onClick={seek} role="progressbar"
                 aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <div className="player-actions">
          <button type="button" className="icon-button" onClick={() => step(-1)} aria-label="Previous track"><Icon d={PREV} /></button>
          <button type="button" className="icon-button play-button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            <Icon d={playing ? PAUSE : PLAY} />
          </button>
          <button type="button" className="icon-button" onClick={() => step(1)} aria-label="Next track"><Icon d={NEXT} /></button>
        </div>
      </div>

      {notice && <p className="player-note">{notice}</p>}

      <audio
        ref={audioRef}
        src={isYT ? undefined : track?.url}
        preload="metadata"
        onTimeUpdate={(e) => !isYT && setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => !isYT && setDuration(e.currentTarget.duration)}
        onEnded={() => advance.current()}
      />

      <audio ref={keepAliveRef} loop playsInline aria-hidden="true" />

      {hasYT && <div className="yt-bridge" aria-hidden="true"><div ref={ytHost} /></div>}
    </div>
  );
}
