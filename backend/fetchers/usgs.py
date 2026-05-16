import requests
from datetime import datetime


def parse_country(place: str) -> str:
    """Extract country from USGS place string e.g. '15 km SW of Tokyo, Japan' -> 'Japan'"""
    if not place:
        return ""
    # รูปแบบ: "... of City, Country" หรือ "Region, Country"
    parts = place.split(",")
    if len(parts) >= 2:
        return parts[-1].strip()
    # รูปแบบ: "off the coast of Japan"
    if " of " in place:
        return place.split(" of ")[-1].strip()
    return place.strip()


def fetch():
    url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
    resp = requests.get(url, timeout=10)
    data = resp.json()
    events = []
    for f in data["features"]:
        prop = f["properties"]
        coords = f["geometry"]["coordinates"]
        mag = prop.get("mag") or 0
        if mag < 2.5:
            continue
        events.append({
            "source": "USGS",
            "title": f"แผ่นดินไหวขนาด {mag} - {prop['place']}",
            "description": f"ตรวจพบแผ่นดินไหวความแรง {mag} ริกเตอร์ บริเวณ {prop['place']}",
            "category": "earthquake",
            "severity": "high" if mag >= 5.0 else "medium" if mag >= 3.5 else "low",
            "country": parse_country(prop["place"]),
            "city": prop["place"],
            "lat": coords[1],
            "lng": coords[0],
            "date": datetime.utcfromtimestamp(prop["time"] / 1000).isoformat() + "Z",
            "image_url": "",
            "source_url": prop["url"],
        })
    return events
