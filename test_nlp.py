import sys
import json

try:
    from pythainlp.tag import NER
except ImportError:
    print("กรุณาติดตั้งไลบรารีที่จำเป็นก่อนรันสคริปต์นี้")
    print("เปิด Terminal แล้วพิมพ์คำสั่ง: pip install pythainlp python-crfsuite")
    sys.exit(1)

def extract_urban_issue(text):
    print(f"\n[{text}]")
    
    # 1. การดึงสถานที่ (Named Entity Recognition - NER)
    # ใช้โมเดล 'thainer' ซึ่งเป็นโมเดล NER มาตรฐานของ PyThaiNLP
    ner = NER("thainer") 
    ner_result = ner.tag(text)
    
    locations = []
    current_loc = ""
    
    # รวมคำที่ถูก Tag เป็น LOCATION เข้าด้วยกัน (B-LOCATION, I-LOCATION)
    for word, tag in ner_result:
        if tag.startswith("B-LOCATION"):
            if current_loc:
                locations.append(current_loc)
            current_loc = word
        elif tag.startswith("I-LOCATION"):
            current_loc += word
        else:
            if current_loc:
                locations.append(current_loc)
                current_loc = ""
                
    if current_loc:
        locations.append(current_loc)
        
    print(f"📍 สถานที่ (NER): {locations if locations else 'ไม่พบข้อมูลสถานที่'}")
    
    # 2. การแยกประเภทปัญหา (Text Classification)
    # ตัวอย่างนี้ใช้ Keyword-based สำหรับทำ PoC (ระบบจริงควรเทรนด้วย ML)
    categories = {
        "น้ำท่วม": ["น้ำท่วม", "น้ำรอการระบาย", "น้ำขัง", "ท่วม"],
        "อุบัติเหตุ": ["รถชน", "อุบัติเหตุ", "คว่ำ", "ชน", "ตาย"],
        "ไฟไหม้": ["ไฟไหม้", "เพลิงไหม้", "ควัน"],
        "จราจร/ถนน": ["หลุม", "บ่อ", "ถนนทรุด", "ถนนพัง", "รถติด"]
    }
    
    detected_category = "อื่นๆ"
    for cat, keywords in categories.items():
        if any(kw in text for kw in keywords):
            detected_category = cat
            break
            
    print(f"🏷️ หมวดหมู่ (Classification): {detected_category}")
    
    # 3. วิเคราะห์ความรุนแรง (Severity Scoring)
    severe_keywords = ["หนัก", "มาก", "รุนแรง", "วิกฤต", "ตาย", "เจ็บ", "โขมง"]
    severity = "high" if any(kw in text for kw in severe_keywords) else "medium"
    
    print(f"⚠️ ความรุนแรง (Severity): {severity}")
    
    return {
        "text": text,
        "locations": locations,
        "category": detected_category,
        "severity": severity
    }

if __name__ == "__main__":
    print("=== ทดสอบระบบ Thai NLP สำหรับ Urban Issues ===")
    
    sample_texts = [
        "มีน้ำท่วมขังหนักมากที่แยกลาดพร้าว รถติดยาวถึงอนุสาวรีย์ชัย",
        "เกิดไฟไหม้โรงงานกิ่งแก้วแถวบางพลี ควันดำโขมงเลย",
        "มีหลุมบ่อขนาดใหญ่บนถนนสุขุมวิท ขับรถต้องระวัง",
        "รถชนกัน 3 คันหน้าเดอะมอลล์บางกะปิ"
    ]
    
    results = []
    for text in sample_texts:
        results.append(extract_urban_issue(text))
        
    print("\n\n=== จำลอง Data JSON ที่จะส่งเข้า Dashboard ===")
    print(json.dumps(results, ensure_ascii=False, indent=2))
