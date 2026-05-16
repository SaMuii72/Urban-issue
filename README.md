# 🌍 UrbanWatch — Real-time Disaster Dashboard

Dashboard แสดงภัยพิบัติแบบ real-time จากหลายแหล่งข้อมูลทั่วโลก พัฒนาสำหรับวิชา CPE 494 Humanities Computing

---

## ✨ Features

- 🗺 **Map** — แผนที่แบบ interactive แสดง marker, heatmap และ risk zone ของภัยพิบัติ
- 📖 **Data Story** — เล่าเรื่องเชิง Humanities จากข้อมูล เช่น ความเหลื่อมล้ำ, narrative timeline
- 📊 **Analytics** — กราฟวิเคราะห์ตามประเภท, ความรุนแรง, ประเทศ, รายเดือน และรายวัน
- 🔄 **Real-time** — ดึงข้อมูลอัตโนมัติทุก 5 นาที ไม่ต้อง refresh

---

## 📡 แหล่งข้อมูล

| Source | ข้อมูล | อัปเดต |
|--------|--------|--------|
| [USGS](https://earthquake.usgs.gov) | แผ่นดินไหวทั่วโลก | real-time |
| [GDACS](https://www.gdacs.org) | น้ำท่วม, พายุ, ภูเขาไฟ | real-time |
| [NASA EONET](https://eonet.gsfc.nasa.gov) | ไฟป่า, พายุ | real-time |

---

## 🏗 Tech Stack

**Frontend**
- React 18 + Vite
- Leaflet.js — แผนที่
- Recharts — กราฟ
- Framer Motion — animation

**Backend**
- FastAPI (Python)
- APScheduler — ดึงข้อมูลทุก 5 นาที

**Infrastructure**
- Docker + Docker Compose
- Nginx — serve frontend + proxy API

---

## 🚀 วิธีรัน (Docker)

### สิ่งที่ต้องมี
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — ติดตั้งแล้วเปิดทิ้งไว้
- [Mapbox Access Token](https://account.mapbox.com/access-tokens) — สร้างฟรี

### ตั้งค่า Environment

```bash
cp .env.example .env
```

แก้ไฟล์ `.env` ใส่ค่าของตัวเอง:

```
VITE_MAPBOX_TOKEN=pk.ey...token ที่ได้รับ...
```

### รันโปรเจค

```bash
# 1. clone repo
git clone https://github.com/SaMuii72/Urban-issue.git
cd urban-issues

# 2. ตั้งค่า .env (ดูขั้นตอนด้านบน)

# 3. build และรัน
docker compose up --build
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:3000**

> ครั้งแรกจะใช้เวลา build ประมาณ 2-3 นาที ครั้งต่อไปเร็วขึ้น

### หยุดการทำงาน

```bash
docker compose down
```

---

## 💻 วิธีรัน (Local Dev โดยไม่ใช้ Docker)

ต้องมี Node.js 18+ และ Python 3.11+

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
npm install
cp .env.example .env  # แล้วแก้ VITE_MAPBOX_TOKEN ใน .env
npm run dev
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:5173**

---

## 📁 โครงสร้างโปรเจค

```
urban-issues/
├── backend/
│   ├── main.py              # FastAPI server + scheduler
│   ├── requirements.txt
│   └── fetchers/
│       ├── usgs.py          # USGS Earthquake API
│       ├── gdacs.py         # GDACS flood/storm/volcano
│       └── eonet.py         # NASA EONET wildfire/storm
├── src/
│   ├── components/
│   │   ├── MapView.jsx      # แผนที่ + heatmap + risk zone
│   │   ├── Analytics.jsx    # กราฟวิเคราะห์
│   │   ├── DataStory.jsx    # Data story + narrative
│   │   ├── Gallery.jsx      # รายการเหตุการณ์
│   │   ├── EventModal.jsx   # popup รายละเอียด
│   │   ├── Header.jsx       # navigation + filter
│   │   └── Stats.jsx        # สถิติสรุป
│   └── hook/
│       └── useEvents.js     # fetch + auto-refresh
├── docker-compose.yml
├── Dockerfile.frontend
├── nginx.conf
└── .env.example
```

---

## 🌐 Plan to Deploy บน Render 

1. Push โค้ดขึ้น GitHub
2. ไปที่ [render.com](https://render.com) → New → **Web Service**
3. สร้าง service 2 อัน:

**Backend**
- Root Directory: `backend`
- Runtime: `Python`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port 8000`

**Frontend**
- Root Directory: `.`
- Runtime: `Node`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Environment Variables:
  - `VITE_API_URL` = URL ของ backend ที่ได้จาก Render
  - `VITE_MAPBOX_TOKEN` = Mapbox access token ของคุณ

---


