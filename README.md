# 🌍 DisasterWatch: Real-Time Incident Mapping and Analysis

**DisasterWatch** is a real-time natural disaster mapping and spatial analytics platform built on the principles of **Digital Humanities**. By integrating real-time GIS data with generative AI, the platform visualizes and narrates the socioeconomic and human impacts of severe environmental crises, fostering critical spatial thinking and disaster awareness.

---

## ✨ Key Features

- 🗺️ **Interactive Global Map** — A dynamic, real-time map displaying current global disasters with support for Density Heatmaps and Risk Buffer Zones (wildfires, earthquakes, floods, and severe storms).
- 📖 **Disaster Chronicles (AI-Powered Archive)** — A rich historical archive documenting over 1,000 extreme tropical storm tracks, enhanced by **Google Gemini 3.1 Pro** to generate critical human-centric impact narratives.
- 🔍 **Dynamic Semantic Search** — Advanced text-search capabilities that scan both storm metadata and AI-generated narratives, allowing users to search storms by name or by "affected countries" even if the coordinates are in the ocean.
- 📊 **Temporal Analytics Dashboard** — Deep analytical visualizations analyzing incident trends, frequency, country breakdowns, and seasonal patterns (monthly and daily distributions).
- 💾 **Intelligent Hybrid Caching** — A local JSON cache design (`chronicles_cache.json`) that stores processed storm chronicles, avoiding duplicate Gemini API costs and serving historical archives to clients instantly.

---

## 📡 API Data Sources

| Source | API Endpoint | Update Interval | Purpose |
|:---|:---|:---|:---|
| **USGS** | `earthquake.usgs.gov/fdsnws/...` | Every 5 minutes | Fetching real-time global earthquake events |
| **GDACS** | `www.gdacs.org/xml/geojson.aspx` | Every 5 minutes | Fetching international flood, tropical cyclone, and volcanic alerts |
| **NASA EONET** | `eonet.gsfc.nasa.gov/api/v3/events` | Every 5 minutes | Fetching active wildfires and severe meteorological events |
| **Gemini API** | `google.generativeai / gemini-1.5-pro` | On-Demand | Analyzing storm metrics and generating human-impact chronicles |

---

## 🏗️ Project Architecture

```
urban-issues/
├── backend/                  # FastAPI Backend Application
│   ├── main.py               # Main API application and cron jobs scheduler
│   ├── chronicles_cache.json # 💾 Master Cache (1,000+ storm narratives)
│   ├── requirements.txt      # Backend Python dependencies
│   ├── Dockerfile            # Container definition for backend service
│   └── fetchers/             # API Connectors and fetchers
│       ├── usgs.py
│       ├── gdacs.py
│       ├── eonet.py
│       └── chronicles.py     # NASA EONET processing and Gemini AI Orchestration
├── src/                      # React Frontend (Vite)
│   ├── components/           # UI Components
│   │   ├── MapView.jsx       # Satellite map view with real-time incident layer
│   │   ├── Chronicle.jsx     # AI story chronicler sidebar, Search, & Map controller
│   │   ├── Analytics.jsx     # Visual data charts using Recharts
│   │   └── Header.jsx        # Navigation bar and global filters
│   └── main.jsx
├── .github/workflows/        # Continuous Integration Workflows
│   └── keep_alive.yml        # Cron workflow to prevent Render Free Tier from sleeping
├── docker-compose.yml        # Local development multi-container setup
└── README.md
```

---

## 💻 Local Development Setup

Before running the application, make sure to create a `.env` file in the root directory (alongside `docker-compose.yml`) containing:
```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_MAPBOX_TOKEN=your_mapbox_token_here (Optional: Fallback map layers are provided)
```

### Option A: Running with Docker Compose (Recommended)
This spins up the complete multi-container stack (Frontend, Backend, and Nginx proxy) in a single command:

```bash
# 1. Build and start the environment
docker compose up --build

# 2. Access the services in your browser:
# - Frontend Application: http://localhost:3000
# - Backend API Server:  http://localhost:8000

# 3. Shutdown the stack
docker compose down
```

### Option B: Running Manually (For Active Code Development)
Open two terminal windows to run both services simultaneously:

**Terminal 1: FastAPI Backend**
```bash
cd backend
# 1. Initialize Python Virtual Environment (Recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the dev server
uvicorn main:app --reload --port 8000
```

**Terminal 2: Vite Frontend**
```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```
Open your browser and navigate to **`http://localhost:5173`**.

---

## 🌐 Production Deployment (Zero-Cost Strategy)

The architecture is explicitly decoupled, allowing both frontend and backend to run 100% free of charge on Vercel and Render.

### Step 1: Deploy FastAPI Backend to Render.com (Free)
1. Sign up on [Render](https://render.com/) and create a new **Web Service** linked to your Git repository.
2. Configure the deployment parameters as follows:
   - **Root Directory:** `backend`
   - **Runtime:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Select the `Free` tier.
3. In the **Environment Variables** tab, add:
   - `GEMINI_API_KEY` = `your_actual_gemini_api_key`
4. Deploy the service and copy the provided API URL (e.g., `https://your-app-api.onrender.com`).

### Step 2: Set Up Backend Keep-Alive (Prevent Sleep Mode)
Since Render Free Tier Web Services go to sleep after 15 minutes of inactivity, we use GitHub Actions to keep it active:
1. Open `.github/workflows/keep_alive.yml`.
2. Replace the URL on the last line with your live Render API URL:
   ```yaml
   curl -f "https://your-app-api.onrender.com/api/events"
   ```
3. Commit and push. GitHub will now ping your backend every 14 minutes to keep it active 24/7.

### Step 3: Deploy Frontend to Vercel.com (Free)
1. Sign up on [Vercel](https://vercel.com/) and **Import Project** using your GitHub Repository.
2. Vercel automatically detects Vite configurations and configures the build scripts.
3. In the **Environment Variables** settings, add:
   - `VITE_API_URL` = (Your Render API URL from Step 1, e.g. `https://your-app-api.onrender.com`)
4. Click **Deploy**. Your application is now live globally! 🚀

---

## 📊 API Endpoints Reference

Test, mock, or fetch raw data directly from these exposed API endpoints:

- 🟢 **`GET /health`** — Checks server status and tracks last cron job fetch times.
- 🟢 **`GET /api/events`** — Fetches real-time filtered incidents (earthquakes, floods, wildfires).
- 🟢 **`GET /api/chronicles`** — Fetches the historical AI-processed tropical storm archive.
  - **Query Params:** Append `?refresh=true` to force EONET to check for new active storm coordinates and generate fresh AI narratives to write back into the master cache.

---
