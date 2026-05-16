from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import logging

from fetchers import usgs, gdacs, eonet

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# In-memory cache
_cache = {"events": [], "fetched_at": None}


def fetch_all():
    logger.info("Fetching all sources...")
    events = []

    for name, module in [("USGS", usgs), ("GDACS", gdacs), ("EONET", eonet)]:
        try:
            result = module.fetch()
            events.extend(result)
            logger.info(f"✅ {name}: {len(result)} events")
        except Exception as e:
            logger.error(f"❌ {name} failed: {e}")

    _cache["events"] = events
    _cache["fetched_at"] = datetime.utcnow().isoformat() + "Z"
    logger.info(f"Total: {len(events)} events cached")


@app.on_event("startup")
def startup():
    fetch_all()
    scheduler = BackgroundScheduler()
    scheduler.add_job(fetch_all, "interval", minutes=5)
    scheduler.start()


@app.get("/api/events")
def get_events():
    return {
        "events": _cache["events"],
        "total": len(_cache["events"]),
        "fetched_at": _cache["fetched_at"],
    }


@app.get("/health")
def health():
    return {"status": "ok", "fetched_at": _cache["fetched_at"]}
