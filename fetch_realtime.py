import requests
import json
from datetime import datetime

def fetch_earthquakes():
    print("=== เริ่มการดึงข้อมูลแผ่นดินไหว Real-time (USGS) ===")
    
    # ดึงข้อมูลแผ่นดินไหวทั่วโลกในรอบ 24 ชั่วโมงที่ผ่านมา
    url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
    
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        new_events = []
        for feature in data['features']:
            prop = feature['properties']
            coords = feature['geometry']['coordinates']
            
            # กรองเอาเฉพาะที่มีขนาด 2.5 ขึ้นไปเพื่อให้ไม่รกแผนที่เกินไป
            mag = prop['mag']
            if mag < 2.5:
                continue
                
            event = {
                "source": "USGS Real-time",
                "title": f"แผ่นดินไหวขนาด {mag} - {prop['place']}",
                "description": f"รายงานแผ่นดินไหวตรวจพบโดย USGS ความแรงระดับ {mag} ริกเตอร์",
                "category": "earthquake",
                "severity": "high" if mag >= 5.0 else "medium" if mag >= 3.5 else "low",
                "country": "",
                "city": prop['place'],
                "lat": coords[1],
                "lng": coords[0],
                "date": datetime.fromtimestamp(prop['time']/1000).isoformat() + "Z",
                "image_url": "",
                "source_url": prop['url']
            }
            new_events.append(event)
            
        print(f"✅ ดึงข้อมูลสำเร็จ! พบเหตุการณ์แผ่นดินไหวใหม่ {len(new_events)} แห่ง")

        # โหลดข้อมูลเดิมในไฟล์
        try:
            with open('events.json', 'r', encoding='utf-8') as f:
                current_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            current_data = {"events": [], "total": 0}

        # รวมข้อมูล (เอาของใหม่ขึ้นก่อน)
        # กรองข้อมูลเก่าที่เป็น USGS ออกก่อนเพื่อไม่ให้ซ้ำซ้อน
        current_data['events'] = [e for e in current_data['events'] if e.get('source') != 'USGS Real-time']
        current_data['events'] = new_events + current_data['events']
        current_data['total'] = len(current_data['events'])
        current_data['fetched_at'] = datetime.now().isoformat() + "Z"

        # บันทึกไฟล์
        with open('events.json', 'w', encoding='utf-8') as f:
            json.dump(current_data, f, ensure_ascii=False, indent=2)
            
        print(f"📊 อัปเดตไฟล์ events.json เรียบร้อย (รวมทั้งหมด {current_data['total']} เหตุการณ์)")

    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการดึงข้อมูล: {e}")

if __name__ == "__main__":
    fetch_earthquakes()
