import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Tooltip as LeafletTooltip } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { useEffect, useRef, useMemo } from 'react'
import { registerHeatLayer } from '../leaflet-heat-esm'
import { getCategoryStyles } from './Header'
import { MapPin, Calendar, Navigation, ExternalLink, Satellite } from 'lucide-react'

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
    html: '<div class="marker-core"></div>',
    className: `marker-severity-${severity || 'medium'}`,
    iconSize: L.point(14, 14),
    iconAnchor: L.point(7, 7),
  })

// ── Smooth fly-to and Open Popup when user selects an event ─────
function SelectionController({ selectedEvent }) {
  const map = useMap()
  
  useEffect(() => {
    if (!selectedEvent || !map) return
    
    const currentZoom = map.getZoom()
    const targetZoom = selectedEvent.country === 'Thailand' ? 15 : (currentZoom > 8 ? currentZoom : 8)
    
    // Calculate an offset so the marker is below the center (leaving room for the popup)
    const targetPoint = map.project([selectedEvent.lat, selectedEvent.lng], targetZoom)
    targetPoint.y -= 150 // Offset by 150 pixels up (moves map center up, marker down)
    const offsetTarget = map.unproject(targetPoint, targetZoom)

    // 1. Fly to location with offset
    if (currentZoom < targetZoom) {
      map.flyTo(offsetTarget, targetZoom, { duration: 1.4, easeLinearity: 0.3 })
    } else {
      map.panTo(offsetTarget, { animate: true, duration: 1.0 })
    }
    
    // 2. Try to open popup
    const timer = setTimeout(() => {
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          const { lat, lng } = layer.getLatLng()
          // Use a small epsilon for coordinate matching
          if (Math.abs(lat - selectedEvent.lat) < 0.0001 && Math.abs(lng - selectedEvent.lng) < 0.0001) {
            layer.openPopup()
          }
        }
      })
    }, 1200)

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
        {events.map((event, idx) => {
          const catStyle = getCategoryStyles(event.category)
          const isHigh = event.severity === 'high' || event.severity === 'critical'
          return (
            <Marker
              key={idx}
              position={[event.lat, event.lng]}
              icon={getMarkerIcon(event.severity)}
              eventHandlers={{ click: () => onMarkerClick && onMarkerClick(event) }}
            >
              <Popup className="modern-popup" maxWidth={400}>
                <div style={{ minWidth: 'min(360px, 92vw)', fontFamily: 'inherit', borderRadius: 16, overflow: 'hidden' }}>

                  {/* Header */}
                  <div style={{
                    borderLeft: `4px solid ${catStyle.color}`,
                    padding: '1rem 1.25rem 0.875rem',
                    background: `linear-gradient(135deg, ${catStyle.color}20 0%, transparent 100%)`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{
                        background: `${catStyle.color}25`,
                        color: catStyle.color,
                        borderRadius: 8, padding: '5px 7px',
                        display: 'flex', flexShrink: 0
                      }}>
                        {catStyle.icon}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: catStyle.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {event.category}
                      </span>
                      <div className="popup-severity-badge" style={{
                        marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                        padding: '2px 7px', borderRadius: 999,
                        background: isHigh ? 'rgba(239,68,68,0.2)' : event.severity === 'low' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
                        color: isHigh ? '#fca5a5' : event.severity === 'low' ? '#86efac' : '#fcd34d',
                        border: `1px solid ${isHigh ? 'rgba(239,68,68,0.4)' : event.severity === 'low' ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)'}`,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isHigh ? '#ef4444' : event.severity === 'low' ? '#22c55e' : '#f59e0b', display: 'inline-block', flexShrink: 0 }} />
                        {event.severity}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.4 }}>
                      {formatTitle(event.title)}
                    </div>
                  </div>

                  {/* Meta rows */}
                  <div style={{ padding: '0.875rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    {[
                      { Icon: MapPin, text: [event.city, event.country].filter(Boolean).join(', ') || 'Global Location', color: '#60a5fa' },
                      { Icon: Calendar, text: event.date ? new Date(event.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : null, color: '#a78bfa' },
                      { Icon: Satellite, text: event.source, color: '#34d399' },
                      { Icon: Navigation, text: event.lat != null ? `${event.lat.toFixed(2)}°, ${event.lng.toFixed(2)}°` : null, color: '#94a3b8' },
                    ].filter(r => r.text).map(({ Icon, text, color }, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: '0.88rem', color: '#cbd5e1' }}>
                        <Icon size={15} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ lineHeight: 1.45 }}>{text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Description + link */}
                  {(event.description || event.source_url) && (
                    <div style={{ padding: '0.75rem 1.25rem 1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      {event.description && (
                        <p style={{ margin: '0 0 10px', fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.7 }}>
                          {event.description.slice(0, 160)}{event.description.length > 160 ? '…' : ''}
                        </p>
                      )}
                      {event.source_url && (
                        <a href={event.source_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', textDecoration: 'none',
                            background: 'rgba(255,255,255,0.08)', padding: '5px 12px', borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.12)', transition: 'all 0.2s' }}
                        >
                          <ExternalLink size={13} /> View Full Data
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MarkerClusterGroup>

      <SelectionController selectedEvent={selectedEvent} />
    </MapContainer>
  )
}
