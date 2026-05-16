import requests
from datetime import datetime


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
            "country": "",
            "city": prop["place"],
            "lat": coords[1],
            "lng": coords[0],
            "date": datetime.utcfromtimestamp(prop["time"] / 1000).isoformat() + "Z",
            "image_url": "",
            "source_url": prop["url"],
        })
    return events
