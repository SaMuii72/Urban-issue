import requests
from datetime import datetime

CATEGORY_MAP = {
    "FL": "flood",
    "TC": "storm",
    "EQ": "earthquake",
    "VO": "volcano",
    "DR": "drought",
    "WF": "fire",
}

SEVERITY_MAP = {
    "Green": "low",
    "Orange": "medium",
    "Red": "high",
}


def fetch():
    url = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtypes=FL,TC,VO,WF&pagesize=50"
    try:
        resp = requests.get(url, timeout=15)
        data = resp.json()
    except Exception:
        return []

    events = []
    for item in data.get("features", []):
        prop = item.get("properties", {})
        coords = item.get("geometry", {}).get("coordinates", [None, None])
        if not coords or coords[0] is None:
            continue

        event_type = prop.get("eventtype", "")
        alert = prop.get("alertlevel", "Green")
        date_str = prop.get("fromdate", "")
        try:
            date = datetime.strptime(date_str[:19], "%Y-%m-%dT%H:%M:%S").isoformat() + "Z"
        except Exception:
            date = ""

        events.append({
            "source": "GDACS",
            "title": prop.get("eventname") or prop.get("htmldescription", "")[:80],
            "description": prop.get("htmldescription", "").replace("<br/>", " ").strip()[:300],
            "category": CATEGORY_MAP.get(event_type, "other"),
            "severity": SEVERITY_MAP.get(alert, "low"),
            "country": prop.get("country", ""),
            "city": prop.get("country", ""),
            "lat": coords[1],
            "lng": coords[0],
            "date": date,
            "image_url": "",
            "source_url": f"https://www.gdacs.org/report.aspx?eventid={prop.get('eventid')}&eventtype={event_type}",
        })
    return events
