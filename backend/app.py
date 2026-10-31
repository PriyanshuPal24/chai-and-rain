import json
import os
import random
import re
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote

from flask import Flask, jsonify, request, send_from_directory

from content import FAQ, FEATURES, QUOTES
from synth_tracks import TITLES, ensure_demo_tracks

BASE_DIR = Path(__file__).resolve().parent
MUSIC_DIR = BASE_DIR / "music"
DIST_DIR = BASE_DIR.parent / "frontend" / "dist"
AUDIO_EXTENSIONS = {".mp3", ".ogg", ".wav", ".m4a", ".flac"}
SONGS_FILE = BASE_DIR / "playlist.json"
BLOCKED_FILE = BASE_DIR / "blocked.json"  # Videos whose owners disabled embedding.
# Visitors may report unplayable videos locally; switch off (0) on a public site.
ALLOW_BLOCK_REPORTS = os.environ.get("ALLOW_BLOCK_REPORTS", "0" if os.environ.get("VERCEL") else "1") == "1"

ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
URL_ID_RE = re.compile(r"(?:youtu\.be/|[?&]v=|/shorts/|/embed/)([A-Za-z0-9_-]{11})")
_meta_cache: dict[str, dict] = {}

app = Flask(__name__, static_folder=None)


def parse_video_id(line: str) -> str | None:
    line = line.strip()
    if ID_RE.match(line):
        return line
    match = URL_ID_RE.search(line)
    return match.group(1) if match else None


def video_meta(video_id: str) -> dict | None:
    """Title/channel via YouTube oEmbed. Returns None for videos that cannot be embedded."""
    if video_id in _meta_cache:
        return _meta_cache[video_id]
    query = urllib.parse.urlencode(
        {"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"}
    )
    try:
        with urllib.request.urlopen(f"https://www.youtube.com/oembed?{query}", timeout=5) as resp:
            data = json.load(resp)
    except urllib.error.HTTPError as err:
        if err.code in (401, 403, 404):
            _meta_cache[video_id] = None  # Embedding disabled, private or removed.
            return None
        data = {}
    except (urllib.error.URLError, TimeoutError, ValueError):
        data = {}  # Offline: still play it, just without a nice title.
    meta = {"title": data.get("title", f"YouTube {video_id}"), "station": data.get("author_name", "YouTube")}
    if data:
        _meta_cache[video_id] = meta
    return meta


def load_blocked() -> set[str]:
    try:
        return {i for i in json.loads(BLOCKED_FILE.read_text(encoding="utf-8")) if ID_RE.match(str(i))}
    except (OSError, ValueError, TypeError):
        return set()


def youtube_tracks() -> list[dict]:
    """Read playlist.json: a list of YouTube links/IDs or {"url", "title", "artist"} objects."""
    if not SONGS_FILE.exists():
        return []
    try:
        entries = json.loads(SONGS_FILE.read_text(encoding="utf-8"))
    except ValueError:
        return []
    if not isinstance(entries, list):
        return []
    result, seen = [], set(load_blocked())
    pending = []
    for entry in entries:
        item = {"url": entry} if isinstance(entry, str) else entry
        if not isinstance(item, dict):
            continue
        source = item.get("url") or item.get("youtube") or item.get("id") or ""
        video_id = parse_video_id(str(source))
        if not video_id or video_id in seen:
            continue
        seen.add(video_id)
        pending.append((video_id, item))

    # Only entries without a title need a (parallel, cached) YouTube lookup.
    missing = [vid for vid, item in pending if not item.get("title")]
    with ThreadPoolExecutor(max_workers=8) as pool:
        metas = dict(zip(missing, pool.map(video_meta, missing)))

    for video_id, item in pending:
        if item.get("title"):
            meta = {"title": item["title"], "station": "Chai & Rain Radio"}
        else:
            meta = metas.get(video_id)
            if meta is None:
                continue
        result.append(
            {
                "id": video_id,
                "kind": "youtube",
                "thumb": f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg",
                "title": meta["title"],
                "station": item.get("artist") or meta["station"],
            }
        )
    return result


@app.get("/api/tracks")
def tracks():
    songs = youtube_tracks()
    if songs:
        return jsonify(songs)
    ensure_demo_tracks()
    files = sorted(p for p in MUSIC_DIR.iterdir() if p.suffix.lower() in AUDIO_EXTENSIONS)
    return jsonify(
        [
            {
                "id": p.stem,
                "kind": "file",
                "title": TITLES.get(p.stem, p.stem.replace("-", " ").replace("_", " ").title()),
                "station": "Chai & Rain Radio",
                "url": f"/music/{quote(p.name)}",
            }
            for p in files
        ]
    )


@app.post("/api/blocked")
def report_blocked():
    """The player reports videos YouTube refuses to play here; they are hidden from then on."""
    if not ALLOW_BLOCK_REPORTS:
        return jsonify({"error": "disabled"}), 403
    body = request.get_json(silent=True) or {}
    new = {str(i) for i in body.get("ids", []) if ID_RE.match(str(i))}
    if new:
        blocked = load_blocked() | new
        BLOCKED_FILE.write_text(json.dumps(sorted(blocked), indent=2), encoding="utf-8")
    return jsonify({"blocked": len(load_blocked())})


@app.get("/api/quotes/random")
def random_quote():
    return jsonify({"text": random.choice(QUOTES)})


@app.get("/api/faq")
def faq():
    return jsonify(FAQ)


@app.get("/api/features")
def features():
    return jsonify(FEATURES)


@app.get("/music/<path:name>")
def music(name: str):
    return send_from_directory(MUSIC_DIR, name)


# Serve the production React build when it exists.
@app.get("/", defaults={"path": ""})
@app.get("/<path:path>")
def spa(path: str):
    if not DIST_DIR.exists():
        return "Frontend not built. Run `npm run build` in frontend, or use `npm run dev`.", 404
    target = DIST_DIR / path
    if path and target.is_file():
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, "index.html")


if __name__ == "__main__":
    ensure_demo_tracks()
    app.run(host="127.0.0.1", port=5000)
