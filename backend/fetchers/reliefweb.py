import requests
from datetime import datetime

CATEGORY_MAP = {
    "Earthquake": "earthquake",
    "Flood": "flood",
    "Tropical Cyclone": "storm",
    "Volcano": "volcano",
    "Drought": "drought",
    "Landslide": "landslide",
    "Wild Fire": "fire",
}


def fetch():
    url = "https://api.reliefweb.int/v1/disasters?appname=urbanwatch&limit=50&fields[include][]=name&fields[include][]=date&fields[include][]=country&fields[include][]=type&fields[include][]=status&filter[field]=status&filter[value]=ongoing"
    try:
        resp = requests.get(url, timeout=15)
        data = resp.json()
    except Exception:
        return []

    events = []
    for item in data.get("data", []):
        fields = item.get("fields", {})
        types = fields.get("type", [])
        type_name = types[0].get("name", "") if types else ""
        category = CATEGORY_MAP.get(type_name, "other")

        countries = fields.get("country", [])
        country = countries[0].get("name", "") if countries else ""

        date_str = fields.get("date", {}).get("created", "")
        try:
            date = datetime.strptime(date_str[:19], "%Y-%m-%dT%H:%M:%S").isoformat() + "Z"
        except Exception:
            date = ""

        # ReliefWeb ไม่มี coordinates — ใช้ country centroid แบบ rough
        # ข้ามถ้าไม่มีประเทศ
        if not country:
            continue

        events.append({
            "source": "ReliefWeb",
            "title": fields.get("name", ""),
            "description": f"ongoing disaster reported via ReliefWeb: {fields.get('name', '')} in {country}",
            "category": category,
            "severity": "high",
            "country": country,
            "city": country,
            "lat": None,
            "lng": None,
            "date": date,
            "image_url": "",
            "source_url": f"https://reliefweb.int/disaster/{item.get('id')}",
        })
    # กรองออกถ้าไม่มี coordinates
    return [e for e in events if e["lat"] is not None]
