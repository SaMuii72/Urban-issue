import requests
from datetime import datetime

CATEGORY_MAP = {
    "wildfires": "fire",
    "severeStorms": "storm",
    "volcanoes": "volcano",
    "floods": "flood",
    "landslides": "landslide",
    "drought": "drought",
}


def fetch():
    url = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50&days=7"
    try:
        resp = requests.get(url, timeout=15)
        data = resp.json()
    except Exception:
        return []

    events = []
    for item in data.get("events", []):
        categories = item.get("categories", [])
        cat_id = categories[0].get("id", "other") if categories else "other"
        category = CATEGORY_MAP.get(cat_id, "other")

        geometries = item.get("geometry", [])
        if not geometries:
            continue
        latest = geometries[-1]
        coords = latest.get("coordinates", [None, None])
        if not coords or coords[0] is None:
            continue

        date_str = latest.get("date", "")
        try:
            date = datetime.strptime(date_str[:19], "%Y-%m-%dT%H:%M:%S").isoformat() + "Z"
        except Exception:
            date = ""

        events.append({
            "source": "NASA EONET",
            "title": item.get("title", ""),
            "description": f"{item.get('title', '')} — detected via NASA Earth Observatory Natural Event Tracker",
            "category": category,
            "severity": "medium",
            "country": "",
            "city": "",
            "lat": coords[1] if len(coords) > 1 else coords[0],
            "lng": coords[0],
            "date": date,
            "image_url": "",
            "source_url": item.get("sources", [{}])[0].get("url", "https://eonet.gsfc.nasa.gov"),
        })
    return events
