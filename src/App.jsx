import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, ChevronLeft, Menu, X } from 'lucide-react'
import MapView from './components/MapView'
import Gallery from './components/Gallery'
import Stats from './components/Stats'
import Header from './components/Header'
import DataStory from './components/DataStory'
import { useEvents } from './hook/useEvents'
import Analytics from './components/Analytics'
import Chronicle from './components/Chronicle'

function App() {
  const { events, lastUpdated, loading, error, refresh } = useEvents()
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [filter, setFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [isGalleryOpen, setIsGalleryOpen] = useState(true)
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
  if (window.innerWidth <= 768) {
    setIsGalleryOpen(false)
  }
}, [])

  const filteredEvents = events.filter(e => {
    // Category & Severity
    const categoryMatch = filter === 'all' || e.category === filter
    const severityMatch = severityFilter === 'all' || e.severity === severityFilter

    // Search (Title, City, Country)
    const searchLower = searchQuery.toLowerCase()
    const searchMatch = !searchQuery ||
      (e.title || '').toLowerCase().includes(searchLower) ||
      (e.city || '').toLowerCase().includes(searchLower) ||
      (e.country || '').toLowerCase().includes(searchLower)

    // Date Filter
    let dateMatch = true
    if (dateFilter !== 'all' && e.date) {
      const eventDate = new Date(e.date)
      const now = new Date()
      const diffDays = (now - eventDate) / (1000 * 60 * 60 * 24)

      if (dateFilter === 'today') dateMatch = diffDays <= 1
      else if (dateFilter === '3days') dateMatch = diffDays <= 3
      else if (dateFilter === 'week') dateMatch = diffDays <= 7
    }

    return categoryMatch && severityMatch && searchMatch && dateMatch
  })

  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
    if (window.innerWidth <= 768) setIsGalleryOpen(false)
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg-color)' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 14, color: '#94a3b8' }}>กำลังโหลดข้อมูล...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg-color)' }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>ไม่สามารถเชื่อมต่อ server ได้</p>
      <p style={{ fontSize: 13, color: '#94a3b8' }}>{error}</p>
      <button onClick={refresh} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#0d1117', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
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
        StatsComponent={<Stats events={events} />}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        filter={filter}
        setFilter={setFilter}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
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
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Incident Gallery
                </span>
              </div>
              <button onClick={() => setIsGalleryOpen(false)}
                style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a8a9e' }}
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
      ) : page === 'chronicle' ? (
        // 🌟 เพิ่มเงื่อนไขนี้ เพื่อแสดงหน้า Historical Narrative เมื่อกดแท็บ History
        <div className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
          <Chronicle lastUpdated={lastUpdated} />
        </div>
      ) : (
        <div className="glass page-content" style={{ flex: 1, overflowY: 'auto', borderRadius: '20px' }}>
          <Analytics events={events} />
        </div>
      )}

      <AnimatePresence />
    </div>
  )
}

export default App