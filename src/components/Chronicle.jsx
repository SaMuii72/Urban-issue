// src/components/Chronicle.jsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import { History, Clock, MapPin, Loader2, AlertTriangle, Sparkles, ChevronLeft, Menu, X } from 'lucide-react'
import L from 'leaflet'

function MapController({ coords, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (coords && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      map.flyTo(coords, zoom, { duration: 2, easeLinearity: 0.25 })
    }
  }, [coords, zoom, map])
  return null
}

const Chronicle = ({ lastUpdated }) => {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  const isInitialMount = useRef(true)

  // Effect สำหรับจัดการขนาดหน้าจอ (ทำแค่ครั้งเดียวตอนโหลด)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile) setIsSidebarOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Effect สำหรับดึงข้อมูล (ทำใหม่ทุกครั้งที่ lastUpdated เปลี่ยน)
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        // เช็คว่าเป็น Refresh หรือครั้งแรก
        const isRefresh = !isInitialMount.current
        isInitialMount.current = false // ปิดธงครั้งแรกทิ้ง

        const baseUrl = import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}/api/chronicles`
          : 'http://localhost:8000/api/chronicles'

        // ถ้าไม่ใช่เปิดหน้าครั้งแรก ให้ส่ง ?refresh=true ไปที่ Backend
        const url = isRefresh ? `${baseUrl}?refresh=true` : baseUrl

        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        const data = await res.json()

        if (data.events && data.events.length > 0) {
          setEvents(data.events)
          setSelectedEvent(data.events[0])
          setCurrentStep(0)
        } else {
          setError("ไม่พบข้อมูลภัยพิบัติที่ตรงตามเงื่อนไขในขณะนี้")
        }
      } catch (err) {
        console.error("Error fetching historical data:", err)
        setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หรือดึงข้อมูลได้")
      } finally {
        setLoading(false)
      }
    }

    // ทำงานทุกครั้งที่ lastUpdated (จากการกดปุ่มบน Header) เปลี่ยนไป
    fetchHistory()
  }, [lastUpdated])

  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
    setCurrentStep(0)
    if (window.innerWidth <= 768) setIsSidebarOpen(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: '#94a3b8' }}>
        <Loader2 className="spin" size={32} color="#f59e0b" style={{ animation: 'spin 2s linear infinite' }} />
        <div>กำลังให้ AI วิเคราะห์ข้อมูลดาวเทียมและร้อยเรียงเรื่องราว...</div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error || events.length === 0 || !selectedEvent) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: '#ef4444' }}>
        <AlertTriangle size={24} />
        <div>{error || "ไม่พบข้อมูล"}</div>
      </div>
    )
  }

  const activeStep = selectedEvent.steps[currentStep]

  // ดึงกล่อง Narrative แยกออกมาเป็นฟังก์ชัน เพื่อให้สลับที่วางได้ง่ายๆ
  const renderNarrative = (isOverlay = true) => (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={isOverlay ? { x: 20, opacity: 0 } : { y: 20, opacity: 0 }}
        animate={isOverlay ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
        exit={isOverlay ? { x: -20, opacity: 0 } : { y: -20, opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          ...(isOverlay ? {
            position: 'absolute', top: 20, right: 20, width: 340, zIndex: 1000,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          } : {
            width: '100%', flexShrink: 0, marginTop: '0.2rem'
          }),
          padding: '1.5rem', background: 'rgba(13, 17, 23, 0.85)', backdropFilter: 'blur(10px)',
          borderRadius: 20, border: `1px solid ${activeStep.color}50`, color: '#f1f5f9',
        }}
      >
        <div style={{ color: activeStep.color, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
          {activeStep.phase === 'before' ? '● เริ่มก่อตัว / สัญญาณเตือน' : activeStep.phase === 'during' ? '● วิกฤตการณ์' : '● คลี่คลาย / การฟื้นฟู'}
        </div>
        <h2 style={{ fontSize: '1.2rem', margin: '0 0 10px 0', lineHeight: 1.4 }}>{activeStep.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
          <Clock size={14} /> {activeStep.time}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94a3b8', marginBottom: 12 }}>
          <MapPin size={14} /> Lat: {activeStep.lat.toFixed(2)}°, Lng: {activeStep.lng.toFixed(2)}°
        </div>
        <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: 12 }} />
        <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#cbd5e1', margin: 0 }}>{activeStep.desc}</p>
      </motion.div>
    </AnimatePresence>
  )

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1rem', overflow: 'hidden', position: 'relative' }}>

      {/* ── ซ้าย: Sidebar เมนูเลือกเหตุการณ์ ── */}
      <div className="glass" style={{
        width: isSidebarOpen ? '300px' : '0px',
        minWidth: isSidebarOpen ? '300px' : '0px',
        padding: isSidebarOpen ? '1.25rem' : '0px',
        overflowY: 'auto',
        borderRadius: 20,
        transition: 'all 0.3s ease',
        opacity: isSidebarOpen ? 1 : 0,
        visibility: isSidebarOpen ? 'visible' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'absolute' : 'relative', // บนมือถือให้ Sidebar ลอยทับ
        zIndex: isMobile ? 2000 : 1,
        height: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History color="#f59e0b" size={20} />
            <div>
              <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '1rem', fontWeight: 700 }}>AI Narrative</h3>
              <div style={{ fontSize: '0.65rem', color: '#7a8a9e', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={10} color="#a855f7" /> Powered by Gemini & NASA
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a8a9e', padding: 4 }}
            className="d-md-none"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', overflowX: 'hidden' }}>
          {events.map(event => (
            <button
              key={event.id}
              onClick={() => handleSelectEvent(event)}
              style={{
                padding: '1rem', borderRadius: 16, border: '1px solid',
                borderColor: selectedEvent.id === event.id ? '#f59e0b50' : 'rgba(255,255,255,0.05)',
                background: selectedEvent.id === event.id ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)',
                color: selectedEvent.id === event.id ? '#fcd34d' : '#94a3b8',
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                width: '100%', display: 'block'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, width: '100%' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                  {event.category}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.7 }}>{event.year}</span>
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.85rem' }}>{event.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── ขวา: พื้นที่แสดงผล ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0,
        overflowY: isMobile ? 'auto' : 'hidden', // ✨ บนมือถือให้ไถจอลงมาดูด้านล่างได้
        paddingRight: isMobile ? '0.5rem' : '0',
        paddingBottom: isMobile ? '1rem' : '0'
      }} className="modal-body-scroll">

        {/* แผนที่กว้างด้านบน */}
        <div className="map-section glass" style={{
          flex: isMobile ? 'none' : 2,
          height: isMobile ? '350px' : 'auto', // ✨ ล็อคความสูงแผนที่บนมือถือ
          minHeight: isMobile ? '350px' : 'auto',
          borderRadius: 20, overflow: 'hidden', position: 'relative'
        }}>
          <button
            className="toggle-gallery-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>

          <MapContainer key={selectedEvent.id} center={[activeStep.lat, activeStep.lng]} zoom={activeStep.zoom} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" />
            <MapController coords={[activeStep.lat, activeStep.lng]} zoom={activeStep.zoom} />

            <Circle
              center={[activeStep.lat, activeStep.lng]}
              radius={30000}
              pathOptions={{ color: activeStep.color, fillColor: activeStep.color, fillOpacity: 0.4 }}
            />

            <Marker
              position={[activeStep.lat, activeStep.lng]}
              icon={L.divIcon({
                className: 'pulse-marker',
                html: `<div style="background: ${activeStep.color}; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 20px ${activeStep.color}"></div>`
              })}
            />
          </MapContainer>

          {/* Desktop: แสดงกล่องข้อความทับลงไปบนแผนที่ตามปกติ */}
          {!isMobile && renderNarrative(true)}
        </div>

        {/* แถบควบคุม Timeline ด้านล่าง */}
        <div className="glass" style={{ height: '140px', borderRadius: 20, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ position: 'absolute', top: '25px', left: '5%', right: '5%', height: '3px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: '25px', left: '5%', width: `${(currentStep / 2) * 90}%`, height: '3px', background: activeStep.color, zIndex: 0, transition: 'all 0.5s ease' }} />

            {selectedEvent.steps.map((step, idx) => (
              <div key={idx} onClick={() => setCurrentStep(idx)} style={{ zIndex: 1, textAlign: 'center', cursor: 'pointer', width: '100px' }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: currentStep >= idx ? step.color : '#1e293b',
                  border: `4px solid ${currentStep === idx ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  color: currentStep >= idx ? '#0d1117' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                  transition: 'all 0.3s', fontWeight: 800, fontSize: '1.1rem',
                  boxShadow: currentStep === idx ? `0 0 20px ${step.color}60` : 'none'
                }}>
                  {idx + 1}
                </div>
                <div style={{ marginTop: 10, fontSize: '0.75rem', fontWeight: 700, color: currentStep === idx ? step.color : '#64748b' }}>
                  {step.phase.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: เอากล่องเนื้อเรื่องมาวางเรียงต่อจาก Timeline แทน */}
        {isMobile && renderNarrative(false)}

      </div>

      <style>{`
        .pulse-marker { display: flex; align-items: center; justify-content: center; }
        .pulse-marker div { animation: pulse 2s infinite; }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.6; }
          100% { transform: scale(0.95); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default Chronicle