import requests
import os
import json
import logging
import re
import google.generativeai as genai
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# ชั้นที่ 1: ข้อมูลเหตุการณ์สำรอง (พร้อมเนื้อเรื่องสำรองในตัว เผื่อ AI พัง)
FALLBACK_EVENTS = [
    {
        "id": "fallback-tohoku",
        "title": "Tohoku Earthquake and Tsunami",
        "categories": [{"title": "Earthquakes"}],
        "geometry": [
            {"date": "2011-03-11T05:46:00Z", "type": "Point", "coordinates": [142.369, 38.322]},
            {"date": "2011-03-11T06:30:00Z", "type": "Point", "coordinates": [141.032, 37.421]},
            {"date": "2011-03-11T12:00:00Z", "type": "Point", "coordinates": [140.856, 38.268]}
        ],
        "fallback_story": [
            {"title": "แผ่นดินไหวรุนแรงระดับ 9.0", "desc": "เกิดแผ่นดินไหวขนาดใหญ่ที่สุดในประวัติศาสตร์ญี่ปุ่น ศูนย์กลางอยู่นอกชายฝั่งซันริกุ ทำให้ระบบเตือนภัยทั่วประเทศดังขึ้นทันที"},
            {"title": "คลื่นสึนามิพัดถล่มชายฝั่ง", "desc": "คลื่นยักษ์ความสูงกว่า 40 เมตร พัดถล่มทำลายเมืองชายฝั่งและเข้าปะทะโรงไฟฟ้านิวเคลียร์ฟุกุชิมะไดอิจิ จนเกิดความเสียหายระดับวิกฤต"},
            {"title": "การฟื้นฟูและผลกระทบระยะยาว", "desc": "รัฐบาลต้องอพยพผู้คนนับแสนออกจากพื้นที่กัมมันตภาพรังสีรั่วไหล นำไปสู่การทบทวนนโยบายพลังงานและการป้องกันภัยพิบัติใหม่ทั้งประเทศ"}
        ]
    },
    {
        "id": "fallback-katrina",
        "title": "Hurricane Katrina",
        "categories": [{"title": "Severe Storms"}],
        "geometry": [
            {"date": "2005-08-25T18:00:00Z", "type": "Point", "coordinates": [-79.0, 23.1]},
            {"date": "2005-08-28T18:00:00Z", "type": "Point", "coordinates": [-88.6, 27.2]},
            {"date": "2005-08-29T12:00:00Z", "type": "Point", "coordinates": [-89.6, 30.0]}
        ],
        "fallback_story": [
            {"title": "พายุก่อตัวเหนือหมู่เกาะบาฮามาส", "desc": "พายุดีเปรสชันเขตร้อนเริ่มก่อตัวและทวีกำลังแรงขึ้นเป็นเฮอริเคนระดับ 1 ก่อนจะเคลื่อนตัวพาดผ่านฟลอริดาตอนใต้"},
            {"title": "พัดถล่มนิวออร์ลีนส์", "desc": "พายุทวีกำลังสูงสุดเป็นระดับ 5 พัดเข้าอ่าวเม็กซิโก ทำให้คันกั้นน้ำของเมืองนิวออร์ลีนส์พังทลาย น้ำท่วมขังกว่า 80% ของพื้นที่เมือง"},
            {"title": "บทเรียนการรับมือภัยพิบัติ", "desc": "เกิดความสูญเสียมหาศาลและการอพยพครั้งใหญ่ที่สุดในประวัติศาสตร์สหรัฐฯ ทำให้รัฐบาลต้องยกเครื่องระบบจัดการเหตุฉุกเฉินระดับชาติใหม่หมด"}
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
        valid_events = [
            e for e in data.get("events", [])
            if len(e.get("geometry", [])) >= 3
        ][:3]
        logger.info(f"✅ Found {len(valid_events)} valid multi-geometry events from NASA")
    except Exception as e:
        logger.error(f"❌ NASA fetch error: {e}")

    # Fallback กรณี NASA พัง
    if not valid_events:
        logger.warning("⚠️ No valid events found. Using fallback events.")
        valid_events = FALLBACK_EVENTS

    results = []

    for event in valid_events:
        geos = sorted(event.get("geometry", []), key=lambda x: x["date"])
        
        if len(geos) < 3:
            continue

        start_geo = geos[0]
        mid_geo = geos[len(geos) // 2]
        end_geo = geos[-1]

        selected_geos = [start_geo, mid_geo, end_geo]

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
                {{ "title": "ชื่อช่วง", "desc": "รายละเอียด" }},
                {{ "title": "ชื่อช่วง", "desc": "รายละเอียด" }},
                {{ "title": "ชื่อช่วง", "desc": "รายละเอียด" }}
                ]
                """

        story_steps = None

        try:
            logger.info(f"🧠 Generating story for {event['title']}")
            response = model.generate_content(prompt)

            raw_text = (
                response.text
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )

            match = re.search(r"\[\s*\{.*?\}\s*\]", raw_text, re.DOTALL)
            if not match:
                raise ValueError("No valid JSON array found in response")

            json_string = match.group(0)
            story_steps = json.loads(json_string)

            if not isinstance(story_steps, list) or len(story_steps) < 3:
                raise ValueError("Invalid story format or missing steps")
                
        except Exception as e:
            # ชั้นที่ 2: ถ้า AI พัง (Error หรือ JSON ผิด) ให้ใช้ข้อมูลสำรองทันที
            logger.error(f"❌ AI/JSON Failed for {event['title']}: {e}")
            
            if "fallback_story" in event:
                logger.info(f"⚠️ Injecting predefined fallback story for {event['title']}")
                story_steps = event["fallback_story"]
            else:
                logger.info("⚠️ Injecting generic fallback story")
                story_steps = [
                    {"title": "เริ่มต้นตรวจพบเหตุการณ์", "desc": "ระบบดาวเทียมได้ตรวจพบความผิดปกติและบันทึกสัญญาณแรกของเหตุการณ์ในบริเวณนี้"},
                    {"title": "สถานการณ์ลุกลาม", "desc": "เหตุการณ์ได้ขยายตัวตามพิกัดที่มีการตรวจพบ มีการเปลี่ยนแปลงทางกายภาพอย่างต่อเนื่อง"},
                    {"title": "สถานการณ์คลี่คลาย", "desc": "พิกัดและสัญญาณความร้อน/ความรุนแรงลดลงจนเข้าสู่สภาวะทรงตัว ตรวจไม่พบการลุกลามเพิ่มเติม"}
                ]

        # ประกอบร่างส่งให้ Frontend (ทำงานเสมอไม่ว่า AI จะสำเร็จหรือพัง)
        phases = ["before", "during", "after"]
        colors = ["#fcd34d", "#ef4444", "#10b981"]
        zooms = [5, 7, 6]
        steps = []

        for i in range(3):
            geo = selected_geos[i]
            coords = get_coords(geo)
            dt = datetime.strptime(geo["date"][:19], "%Y-%m-%dT%H:%M:%S")
            step_data = story_steps[i]

            steps.append({
                "phase": phases[i],
                "title": step_data.get("title", f"Phase {i+1}"),
                "desc": step_data.get("desc", "No description"),
                "time": dt.strftime("%d %b %Y %H:%M"),
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

        logger.info(f"✅ Successfully processed {event['title']}")

    return results