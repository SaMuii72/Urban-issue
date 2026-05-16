import requests
import os
import json
import logging
import re
import google.generativeai as genai
from datetime import datetime

logger = logging.getLogger(__name__)

# ✅ fallback historical events with real timelines
FALLBACK_EVENTS = [
    {
        "id": "fallback-tohoku",
        "title": "Tohoku Earthquake and Tsunami",
        "categories": [{"title": "Earthquakes"}],
        "geometry": [
            {
                "date": "2011-03-11T05:46:00Z",
                "type": "Point",
                "coordinates": [142.369, 38.322]
            },
            {
                "date": "2011-03-11T06:30:00Z",
                "type": "Point",
                "coordinates": [141.032, 37.421]
            },
            {
                "date": "2011-03-11T12:00:00Z",
                "type": "Point",
                "coordinates": [140.856, 38.268]
            }
        ]
    },
    {
        "id": "fallback-katrina",
        "title": "Hurricane Katrina",
        "categories": [{"title": "Severe Storms"}],
        "geometry": [
            {
                "date": "2005-08-25T18:00:00Z",
                "type": "Point",
                "coordinates": [-79.0, 23.1]
            },
            {
                "date": "2005-08-28T18:00:00Z",
                "type": "Point",
                "coordinates": [-88.6, 27.2]
            },
            {
                "date": "2005-08-29T12:00:00Z",
                "type": "Point",
                "coordinates": [-89.6, 30.0]
            }
        ]
    }
]


def fetch_and_generate_stories():

    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        logger.error("❌ GEMINI_API_KEY is not set!")
        return []

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel("gemma-4-31b-it")

    url = "https://eonet.gsfc.nasa.gov/api/v3/events?status=all&days=365"

    valid_events = []

    try:

        resp = requests.get(url, timeout=15)

        data = resp.json()

        # ✅ only events with real multiple timestamps
        valid_events = [
            e for e in data.get("events", [])
            if len(e.get("geometry", [])) >= 3
        ][:3]

        logger.info(
            f"✅ Found {len(valid_events)} valid multi-geometry events"
        )

    except Exception as e:

        logger.error(f"❌ NASA fetch error: {e}")

    # fallback
    if not valid_events:

        logger.warning(
            "⚠️ No valid events found. Using fallback events."
        )

        valid_events = FALLBACK_EVENTS

    results = []

    for event in valid_events:

        try:

            geos = sorted(
                event.get("geometry", []),
                key=lambda x: x["date"]
            )

            if len(geos) < 3:
                logger.warning(
                    f"⚠️ Skipping {event['title']} (less than 3 geometries)"
                )
                continue

            # ✅ real timeline progression
            start_geo = geos[0]
            mid_geo = geos[len(geos) // 2]
            end_geo = geos[-1]

            selected_geos = [
                start_geo,
                mid_geo,
                end_geo
            ]

            def get_coords(geo):

                if geo["type"] == "Point":
                    return geo["coordinates"]

                return geo["coordinates"][0][0]

            prompt = f"""
คุณคือ Data API

ห้ามพิมพ์ข้อความอื่น
ห้าม Markdown
ห้าม ```json
ตอบ JSON Array เท่านั้น

ข้อมูลภัยพิบัติ:
ชื่อ: {event['title']}
ประเภท: {event['categories'][0]['title']}

Timeline จริง:
1. {start_geo['date']}
2. {mid_geo['date']}
3. {end_geo['date']}

สร้างเรื่องราว 3 ช่วง:
1. ก่อนเกิดเหตุ
2. ขณะเกิดเหตุ
3. หลังเกิดเหตุ

ตอบ format นี้เท่านั้น:

[
  {{
    "title": "ชื่อช่วง",
    "desc": "รายละเอียด"
  }},
  {{
    "title": "ชื่อช่วง",
    "desc": "รายละเอียด"
  }},
  {{
    "title": "ชื่อช่วง",
    "desc": "รายละเอียด"
  }}
]
"""

            logger.info(
                f"🧠 Generating story for {event['title']}"
            )

            response = model.generate_content(prompt)

            raw_text = (
                response.text
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )

            logger.info(f"RAW AI OUTPUT: {raw_text}")

            # ✅ extract first JSON array only
            match = re.search(
                r"\[\s*\{.*?\}\s*\]",
                raw_text,
                re.DOTALL
            )

            if not match:

                logger.error(
                    f"❌ No valid JSON array found for {event['title']}"
                )

                continue

            json_string = match.group(0)

            story_steps = json.loads(json_string)

            # validation
            if (
                not isinstance(story_steps, list)
                or len(story_steps) < 3
            ):

                logger.error(
                    f"❌ Invalid story format for {event['title']}"
                )

                continue

            phases = ["before", "during", "after"]

            colors = [
                "#fcd34d",
                "#ef4444",
                "#10b981"
            ]

            zooms = [5, 7, 6]

            steps = []

            for i in range(3):

                geo = selected_geos[i]

                coords = get_coords(geo)

                dt = datetime.strptime(
                    geo["date"][:19],
                    "%Y-%m-%dT%H:%M:%S"
                )

                step_data = story_steps[i]

                steps.append({
                    "phase": phases[i],
                    "title": step_data.get(
                        "title",
                        f"Phase {i+1}"
                    ),
                    "desc": step_data.get(
                        "desc",
                        "No description"
                    ),
                    "time": dt.strftime(
                        "%d %b %Y %H:%M"
                    ),
                    "lat": float(coords[1]),
                    "lng": float(coords[0]),
                    "color": colors[i],
                    "zoom": zooms[i]
                })

            results.append({
                "id": event["id"],
                "name": event["title"],
                "category": event["categories"][0]["title"],
                "year": start_geo["date"][:4],
                "steps": steps
            })

            logger.info(
                f"✅ Successfully processed {event['title']}"
            )

        except Exception as e:

            logger.error(
                f"❌ Failed processing {event['title']}: {e}"
            )

            continue

    return results