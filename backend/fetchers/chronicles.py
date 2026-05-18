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

    # Load existing cache to avoid calling LLM for events we already have stories for!
    existing_cache = {}
    cache_file = "chronicles_cache.json"
    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
                existing_cache = {e["id"]: e for e in cached_data.get("events", []) if "id" in e}
                logger.info(f"⚡ Loaded {len(existing_cache)} existing stories from local file cache in fetcher.")
        except Exception as e:
            logger.error(f"❌ Error reading local cache in fetcher: {e}")

    # Dynamic self-healing time window:
    # If the cache is empty, query the full 8000 days (~22 years) to seed the database.
    # If the cache has data, calculate the exact gap (in days) between the newest storm in your cache and today!
    # This prevents missing any storms if the project is opened 5 months later, while maintaining 100% speed!
    if not existing_cache:
        days = 8000
    else:
        latest_date = None
        for event in existing_cache.values():
            for step in event.get("steps", []):
                try:
                    # Parse steps like "14 Apr 2026 18:00"
                    step_date = datetime.strptime(step["time"], "%d %b %Y %H:%M")
                    if latest_date is None or step_date > latest_date:
                        latest_date = step_date
                except Exception:
                    pass
        
        if latest_date:
            delta_days = (datetime.utcnow() - latest_date).days
            # Add 30 days of safety buffer, and enforce a minimum of 60 days
            days = max(60, delta_days + 30)
            logger.info(f"🔄 Cache self-healing: Newest cached storm was on {latest_date.strftime('%Y-%m-%d')}. Fetching last {days} days to heal the gap.")
        else:
            days = 60
            
    url = f"https://eonet.gsfc.nasa.gov/api/v3/events?category=severeStorms&status=all&days={days}"

    valid_events = []
    try:
        resp = requests.get(url, timeout=25)
        data = resp.json()
        
        # Intelligent Named-Storm Filter:
        # Excludes unnamed / generic placeholders like "Tropical Storm #10" or "Tropical Cyclone 28P"
        # while beautifully including famous, severe named tropical storms like "Tropical Storm Hagupit"!
        number_words = {"one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", 
                        "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", 
                        "eighteen", "nineteen", "twenty"}
        
        raw_events = []
        
        for e in data.get("events", []):
            geos = e.get("geometry", [])
            # Must have at least 6 tracking points to be a real active storm track
            if len(geos) < 6:
                continue
                
            title = e.get("title", "")
            title_lower = title.lower()
            
            # 1. Exclude generic unnamed storms containing placeholder characters
            if "#" in title or "unnamed" in title_lower:
                continue
                
            # 2. Must belong to major storm classifications (including severe storms)
            if not any(kw in title_lower for kw in ["hurricane", "typhoon", "cyclone", "storm"]):
                continue
                
            # 3. Exclude placeholder tracks ending in numbers or number words (e.g. 28P, Ten)
            words = title_lower.split()
            last_word = words[-1] if words else ""
            has_digit = any(c.isdigit() for c in last_word)
            is_word_number = last_word in number_words
            
            if has_digit or is_word_number:
                continue
                
            raw_events.append(e)
            
        # Sort all selected events chronologically from newest to oldest
        raw_events = sorted(
            raw_events,
            key=lambda e: sorted(e.get("geometry", []), key=lambda x: x["date"])[0]["date"] if e.get("geometry") else "",
            reverse=True
        )
        valid_events = raw_events
        logger.info(f"✅ Selected {len(valid_events)} historically diverse events across years: {sorted([geos[0]['date'][:4] for e in valid_events for geos in [sorted(e.get('geometry', []), key=lambda x: x['date'])]])}")
    except Exception as e:
        logger.error(f"❌ NASA fetch error: {e}")

    results = []

    # Load fallback if NASA completely fails
    if not valid_events:
        logger.warning("⚠️ No valid events found. Using fallback events.")
        valid_events = FALLBACK_EVENTS

    for event in valid_events:
        event_id = event.get("id")
        # If this event already exists in our cache, reuse it completely!
        if event_id and event_id in existing_cache:
            logger.info(f"⚡ Reusing cached story for {event['title']} (Skipped Gemini LLM Generation)")
            results.append(existing_cache[event_id])
            continue
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

                Timeline และ พิกัดภูมิศาสตร์จริง (ลองจิจูด, ละติจูด):
                1. เริ่มต้นตรวจพบ: {start_geo['date']} ที่พิกัด [ลองจิจูด: {get_coords(start_geo)[0]}, ละติจูด: {get_coords(start_geo)[1]}]
                2. ความรุนแรงสูงสุด: {mid_geo['date']} ที่พิกัด [ลองจิจูด: {get_coords(mid_geo)[0]}, ละติจูด: {get_coords(mid_geo)[1]}]
                3. อ่อนกำลัง/สิ้นสุด: {end_geo['date']} ที่พิกัด [ลองจิจูด: {get_coords(end_geo)[0]}, ละติจูด: {get_coords(end_geo)[1]}]

                คำสั่งพิเศษเพื่อความถูกต้องทางภูมิศาสตร์และผลกระทบระหว่างประเทศ:
                - ใช้พิกัดลองจิจูดและละติจูดด้านบนร่วมกับความรู้ทางภูมิศาสตร์ของคุณ เพื่อค้นหาและระบุให้ชัดเจนว่าเหตุการณ์นี้เกิดขึ้นใกล้ประเทศใด ชายฝั่งเกาะใด หรือภูมิภาคใดมากที่สุด
                - ต้องระบุถึงประเทศหรือดินแดนใกล้เคียงที่ได้รับผลกระทบทางอ้อมหรือการประกาศเตือนภัย เช่น แรงลมอิทธิพลขอบนอก, คลื่นพายุซัดฝั่ง (Storm Surge) ที่ซัดเข้าหาชายฝั่งประเทศใด, การปิดท่าเรือหรือปรับเส้นทางบิน/เดินเรือของดินแดนใด, หรือฝนตกหนักสะสมในพื้นที่ชายทะเลของประเทศใด
                - หากจุดพิกัดอยู่กลางทะเลลึก/มหาสมุทรที่ไม่มีแผ่นดิน ให้บรรยายถึงการเตือนภัยและผลกระทบต่อเรือเดินสมุทร เรือประมง และมาตรการเฝ้าระวังภัยพิบัติของประเทศ/เกาะที่ใกล้ที่สุดในรัศมีเส้นทางการเคลื่อนตัวของพายุนั้น

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
        raw_text = ""

        try:
            logger.info(f"🧠 Generating story for {event['title']}")
            
            # 3-attempt retry loop with exponential backoff to handle transient Gemini 500 / 429 errors
            max_retries = 3
            retry_delay = 2.0
            
            for attempt in range(max_retries):
                try:
                    response = model.generate_content(prompt)
                    # Accessing response.text forces chunk resolution inside the retry block so we catch any errors here!
                    raw_text = (
                        response.text
                        .replace("```json", "")
                        .replace("```", "")
                        .strip()
                    )
                    break
                except Exception as ex:
                    if attempt < max_retries - 1:
                        logger.warning(f"⚠️ Gemini API threw error on '{event['title']}' (Attempt {attempt+1}/{max_retries}). Retrying in {retry_delay}s... Error: {ex}")
                        import time
                        time.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        raise ex

            # Clean curly quotes first
            cleaned_text = raw_text.replace("“", '"').replace("”", '"')
            
            # Find the very last "[" in the text (targets the actual JSON array and completely bypasses all prompt format examples at the top!)
            last_bracket_idx = cleaned_text.rfind("[")
            if last_bracket_idx == -1:
                raise ValueError("No opening bracket '[' found in AI response")
                
            potential_json = cleaned_text[last_bracket_idx:].strip()
            
            # Auto-heal typical LLM truncation cuts (like in Tropical Cyclone Alvaro where it ended mid-text without a closing bracket)
            if not potential_json.endswith("]"):
                logger.warning("⚠️ Detected truncated AI response. Attempting to auto-heal...")
                if not potential_json.endswith("}"):
                    if potential_json.endswith('"'):
                        potential_json += "}"
                    else:
                        potential_json += '"}'
                potential_json += "]"
                
            try:
                story_steps = json.loads(potential_json)
                logger.info("⚡ Successfully extracted and auto-healed storm stories JSON array!")
            except Exception as parse_ex:
                # If the last-bracket parser failed, fall back to extracting any valid JSON array in the text
                logger.warning(f"⚠️ Last-bracket parse failed: {parse_ex}. Falling back to regex scanners...")
                matches = re.findall(r"\[\s*\{.*?\}\s*\]", cleaned_text, re.DOTALL)
                story_steps = None
                for json_str in reversed(matches):
                    try:
                        parsed = json.loads(json_str)
                        if isinstance(parsed, list) and len(parsed) >= 3:
                            story_steps = parsed
                            break
                    except Exception:
                        pass
                
            if not story_steps or not isinstance(story_steps, list) or len(story_steps) < 3:
                raise ValueError("No valid JSON array with 3 story steps could be parsed or auto-healed.")
                
        except Exception as e:
            # ชั้นที่ 2: ถ้า AI พัง (Error หรือ JSON ผิด) ให้ใช้ข้อมูลสำรองทันที
            logger.error(f"❌ AI/JSON Failed for {event['title']}: {e}")
            if 'raw_text' in locals() and raw_text:
                logger.error(f"🔍 Raw AI response was:\n{raw_text}")
            
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

        event_story = {
            "id": event["id"],
            "name": event["title"],
            "category": event["categories"][0]["title"],
            "year": start_geo["date"][:4],
            "steps": steps
        }
        results.append(event_story)
        
        # Incremental Save: Immediately write to local cache file so that Ctrl+C doesn't lose progress!
        if event["id"]:
            existing_cache[event["id"]] = event_story
            try:
                cache_data = {"events": list(existing_cache.values())}
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(cache_data, f, ensure_ascii=False, indent=2)
            except Exception as cache_ex:
                logger.error(f"❌ Failed to write incremental local cache: {cache_ex}")

        logger.info(f"✅ Successfully processed {event['title']}")

    logger.info(f"💾 Completed batch processing. Total cached historical stories: {len(existing_cache)}")
    return list(existing_cache.values())