import sys
from pathlib import Path

# Vercel entry point: reuse the Flask app that lives in backend/.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app import app  # noqa: E402,F401
