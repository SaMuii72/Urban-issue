import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, ChevronLeft, Menu, X, BookOpen, Map } from 'lucide-react'
import MapView from './components/MapView'
import Gallery from './components/Gallery'
import Stats from './components/Stats'
import Header from './components/Header'
import EventModal from './components/EventModal'
import DataStory from './components/DataStory'  // เพิ่มบรรทัดนี้
import { useEvents } from './hook/useEvents'
import Analytics from './components/Analytics'
function App() {
  const { events, lastUpdated, loading, error, refresh } = useEvents()
const [selectedEvent, setSelectedEvent] = useState(null)
  const [filter, setFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [isGalleryOpen, setIsGalleryOpen] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [page, setPage] = useState('dashboard')  // เพิ่มบรรทัดนี้

  useEffect(() => {
  if (window.innerWidth <= 768) {
    setIsGalleryOpen(false)
  }
}, [])

  const filteredEvents = events.filter(e => {
    const categoryMatch = filter === 'all' || e.category === filter
    const severityMatch = severityFilter === 'all' || e.severity === severityFilter
    return categoryMatch && severityMatch
  })

  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
    if (window.innerWidth <= 768) setIsGalleryOpen(false)
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg-color)' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: '3px solid #0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 14, color: '#64748b' }}>กำลังโหลดข้อมูล...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg-color)' }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>ไม่สามารถเชื่อมต่อ server ได้</p>
      <p style={{ fontSize: 13, color: '#94a3b8' }}>{error}</p>
      <button onClick={refresh} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#0ea5e9', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
        ลองใหม่
      </button>
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      padding: '1rem',
      gap: '1rem',
      background: 'var(--bg-color)',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <Header
        events={events}
        stats={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Stats events={events} />
            <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', lineHeight: 1.4 }}>
              <div>Last updated</div>
              <div style={{ fontWeight: 600, color: '#64748b' }}>
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                  : 'Loading...'}
              </div>
            </div>
            <button
              onClick={refresh}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 6,
                border: '1px solid #e2e8f0', background: 'white',
                color: '#64748b', cursor: 'pointer', fontWeight: 600,
              }}
            >
              ↻ Refresh
            </button>
          </div>
        }
        filter={filter}
        setFilter={setFilter}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
        // เพิ่ม page navigation ใน Header
        page={page}
        setPage={setPage}
      />

      {/* สลับระหว่าง Dashboard กับ Data Story */}
      {page === 'dashboard' ? (
        <div className="main-grid">
          <div className={`gallery-sidebar ${isGalleryOpen ? '' : 'collapsed'}`}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '0.75rem', padding: '0 0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LayoutGrid size={16} color="var(--accent-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Incident Gallery
                </span>
              </div>
              <button onClick={() => setIsGalleryOpen(false)}
                style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                className="d-md-none">
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <Gallery events={filteredEvents} selectedId={selectedEvent?.title} onSelect={handleSelectEvent} />
            </div>
          </div>

          <div className="map-section glass">
            <button className="toggle-gallery-btn" onClick={() => setIsGalleryOpen(!isGalleryOpen)}>
              {isGalleryOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>
            <MapView events={filteredEvents} selectedEvent={selectedEvent} onMarkerClick={handleSelectEvent} />
          </div>
        </div>
      ) : page === 'story' ? (
        <div className="glass page-content" style={{ flex: 1, overflowY: 'auto', borderRadius: '20px' }}>
          <DataStory events={events} />
        </div>
      ) : (
        <div className="glass page-content" style={{ flex: 1, overflowY: 'auto', borderRadius: '20px' }}>
          <Analytics events={events} />
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <EventModal event={selectedEvent} onClose={() => setIsModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App