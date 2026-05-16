import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Tooltip as LeafletTooltip } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { useEffect, useRef, useMemo } from 'react'
import { registerHeatLayer } from '../leaflet-heat-esm'

// Register the heat plugin onto the ESM Leaflet instance (runs once)
registerHeatLayer(L)

// ── MAPBOX CONFIGURATION ────────────────────────────────────────
// ถ้าต้องการใช้ Style ของคุณเอง ให้เอาข้อมูลจากหน้า Mapbox มาใส่ใน 3 ตัวแปรนี้ครับ
// หากไม่ใส่ หรือเป็นค่าเริ่มต้น ระบบจะใช้แผนที่ดาวเทียมของ Google แทน
const MAPBOX_USERNAME = 'mapbox'
const MAPBOX_STYLE_ID = 'satellite-streets-v12'
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
// ────────────────────────────────────────────────────────────────

// ── Risk Zone layer ─────────────────────────────────────────────
function RiskZoneLayer({ events }) {
  const zones = useMemo(() => {
    const grid = {}
    events.forEach(e => {
      if (typeof e.lat !== 'number' || typeof e.lng !== 'number') return
      const key = `${Math.floor(e.lat / 5) * 5},${Math.floor(e.lng / 5) * 5}`
      if (!grid[key]) grid[key] = { lat: 0, lng: 0, count: 0, label: '' }
      grid[key].lat += e.lat
      grid[key].lng += e.lng
      grid[key].count++
      if (!grid[key].label && e.country) grid[key].label = e.country
    })
    return Object.values(grid)
      .map(z => ({ lat: z.lat / z.count, lng: z.lng / z.count, count: z.count, label: z.label }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [events])

  return zones.map((z, i) => (
    <Circle
      key={i}
      center={[z.lat, z.lng]}
      radius={Math.min(z.count * 8000, 600000)}
      pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 1.5, dashArray: '6 4' }}
    >
      <LeafletTooltip permanent direction="center" className="risk-zone-tooltip">
        ⚠️ {z.label || 'Risk Zone'} ({z.count})
      </LeafletTooltip>
    </Circle>
  ))
}

// ── Heatmap layer component ─────────────────────────────────────
function HeatmapLayer({ points }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    if (!map || !points || points.length === 0) return

    const heatPoints = points
      .filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
      .map(p => [p.lat, p.lng, p.severity === 'high' ? 1.0 : 0.6])

    function initHeat() {
      try {
        if (layerRef.current) {
          map.removeLayer(layerRef.current)
        }
        layerRef.current = L.heatLayer(heatPoints, {
          radius: 20,
          blur: 15,
          minOpacity: 0.5,
          maxZoom: 18,
        }).addTo(map)
      } catch (e) {
        console.error('Heatmap error:', e)
      }
    }

    // whenReady guarantees the canvas has real dimensions
    map.whenReady(initHeat)

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, points])

  return null
}

// ── Cluster icon (green → yellow → orange based on count) ───────
const createClusterIcon = (cluster) => {
  const count = cluster.getChildCount()
  const size = count < 10 ? 40 : count < 50 ? 50 : 60
  let colorClass = 'cluster-low'
  if (count > 30) colorClass = 'cluster-high'
  else if (count > 10) colorClass = 'cluster-medium'

  return L.divIcon({
    html: `<span>${count}</span>`,
    className: `custom-marker-cluster ${colorClass}`,
    iconSize: L.point(size, size, true),
  })
}

// ── Per-marker icon (solid coloured dot) ────────────────────────
const getMarkerIcon = (severity) =>
  L.divIcon({
    className: `marker-severity-${severity || 'medium'}`,
    iconSize: L.point(14, 14),
  })

// ── Smooth fly-to and Open Popup when user selects an event ─────
function SelectionController({ selectedEvent }) {
  const map = useMap()
  
  useEffect(() => {
    if (!selectedEvent || !map) return
    
    // 1. Fly to location
    map.flyTo([selectedEvent.lat, selectedEvent.lng], 8, { duration: 1.4, easeLinearity: 0.3 })
    
    // 2. Try to open popup (Wait a bit for flyTo and clustering)
    const timer = setTimeout(() => {
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          const { lat, lng } = layer.getLatLng()
          if (lat === selectedEvent.lat && lng === selectedEvent.lng) {
            layer.openPopup()
          }
        }
      })
    }, 1500)

    return () => clearTimeout(timer)
  }, [selectedEvent, map])
  
  return null
}

// ── Main component ──────────────────────────────────────────────
export default function MapView({ events, selectedEvent, onMarkerClick }) {
  const formatTitle = (title) => {
    if (!title) return ''
    if (title.includes('แผ่นดินไหวขนาด')) {
      const parts = title.split(' - ')
      if (parts.length > 1) {
        const cleanLocation = parts[1].replace(/.* of /, '')
        return `${parts[0]} - ${cleanLocation}`
      }
    }
    return title
  }

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      {MAPBOX_ACCESS_TOKEN ? (
        <TileLayer
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
          url={`https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${MAPBOX_STYLE_ID}/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`}
        />
      ) : (
        <TileLayer
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        />
      )}

      <RiskZoneLayer events={events} />
      <HeatmapLayer points={events} />

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        showCoverageOnHover={false}
        iconCreateFunction={createClusterIcon}
      >
        {events.map((event, idx) => (
          <Marker
            key={idx}
            position={[event.lat, event.lng]}
            icon={getMarkerIcon(event.severity)}
            eventHandlers={{ click: () => onMarkerClick(event) }}
          >
            <Popup className="modern-popup">
              <div style={{ padding: '0.2rem', minWidth: '220px' }}>
                <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '0.4rem', color: '#f1f5f9', fontWeight: 800, lineHeight: 1.2 }}>
                  {formatTitle(event.title)}
                </strong>
                <div style={{ fontSize: '0.75rem', color: '#b4bcc8', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  {event.city ? `${event.city}, ` : ''}{event.country || 'Global Location'}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.7rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  padding: '0.3rem 0.75rem', borderRadius: '9999px',
                  background: event.severity === 'high' ? '#fee2e2' : '#fef3c7',
                  color: event.severity === 'high' ? '#991b1b' : '#92400e',
                  border: `1px solid ${event.severity === 'high' ? '#fca5a5' : '#fcd34d'}`
                }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: event.severity === 'high' ? '#ef4444' : '#f59e0b', display: 'inline-block',
                    boxShadow: `0 0 8px ${event.severity === 'high' ? '#ef4444' : '#f59e0b'}`
                  }} />
                  {event.severity} · {event.category}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      <SelectionController selectedEvent={selectedEvent} />
    </MapContainer>
  )
}
