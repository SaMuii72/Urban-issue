// src/components/Chronicle.jsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import { History, Clock, MapPin, Loader2, AlertTriangle, Sparkles, ChevronLeft, Menu, X, RefreshCw, Search } from 'lucide-react'
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

  const [selectedYear, setSelectedYear] = useState('All')
  const [selectedMonth, setSelectedMonth] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Helper to parse dates from storm steps (e.g. "09 Apr 2026 18:00")
  const parseStormDate = (e) => {
    if (e.steps && e.steps[0] && e.steps[0].time) {
      try {
        return new Date(e.steps[0].time)
      } catch (err) {
        return new Date(0)
      }
    }
    if (e.year) {
      return new Date(`${e.year}-01-01`)
    }
    return new Date(0)
  }

  // Sort events chronologically descending (newest storms at the top!)
  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => parseStormDate(b) - parseStormDate(a))
  }, [events])

  // Extract unique years from sorted events, sorted numerically descending (newest first)
  const uniqueYears = React.useMemo(() => {
    return ['All', ...new Set(sortedEvents.map(e => e.year))].sort((a, b) => b - a)
  }, [sortedEvents])

  // Filter events based on selected year, month, and search query
  const filteredEvents = React.useMemo(() => {
    return sortedEvents.filter(e => {
      // 1. Year Filter
      const yearMatch = selectedYear === 'All' || e.year === selectedYear;
      
      // 2. Month Filter
      const date = parseStormDate(e);
      const monthStr = date.getTime() > 0 ? (date.getMonth() + 1).toString().padStart(2, '0') : '01';
      const monthMatch = selectedMonth === 'All' || monthStr === selectedMonth;
      
      // 3. Search Filter (Storm Name & Descriptions)
      let searchMatch = true;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const nameMatch = (e.name || '').toLowerCase().includes(query);
        const descMatch = (e.steps || []).some(step => (step.desc || '').toLowerCase().includes(query));
        searchMatch = nameMatch || descMatch;
      }
      
      return yearMatch && monthMatch && searchMatch;
    });
  }, [selectedYear, selectedMonth, searchQuery, sortedEvents])

  // Auto-select first event of the year/month if the currently selected one is filtered out!
  useEffect(() => {
    if (sortedEvents.length > 0) {
      if (filteredEvents.length > 0) {
        const isStillVisible = filteredEvents.some(e => e.id === selectedEvent?.id)
        if (!isStillVisible) {
          setSelectedEvent(filteredEvents[0])
          setCurrentStep(0)
        }
      }
    }
  }, [selectedYear, selectedMonth, searchQuery, sortedEvents, selectedEvent, filteredEvents])

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

  const fetchHistory = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      const baseUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/chronicles`
        : 'http://localhost:8000/api/chronicles'

      // ถ้าเป็น forceRefresh หรือไม่ใช่เปิดหน้าครั้งแรก ให้ส่ง ?refresh=true ไปที่ Backend
      const isRefresh = forceRefresh || !isInitialMount.current
      isInitialMount.current = false // ปิดธงครั้งแรกทิ้ง

      const url = isRefresh ? `${baseUrl}?refresh=true` : baseUrl

      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()

      if (data.events && data.events.length > 0) {
        setEvents(data.events)
        // Sort to find the newest event to set as initially selected
        const sorted = [...data.events].sort((a, b) => {
          const getVal = (e) => {
            if (e.steps && e.steps[0] && e.steps[0].time) return new Date(e.steps[0].time)
            if (e.year) return new Date(`${e.year}-01-01`)
            return new Date(0)
          }
          return getVal(b) - getVal(a)
        })
        setSelectedEvent(sorted[0])
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

  // Effect สำหรับดึงข้อมูล (ทำใหม่ทุกครั้งที่ lastUpdated เปลี่ยน)
  useEffect(() => {
    fetchHistory()
  }, [lastUpdated])

  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
    setCurrentStep(0)
    if (window.innerWidth <= 768) setIsSidebarOpen(false)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        flex: 1,
        flexDirection: 'column',
        gap: '1.25rem',
        color: '#94a3b8',
        textAlign: 'center',
        padding: '2rem',
        minHeight: '60vh'
      }}>
        <Loader2 className="spin" size={40} color="#f59e0b" style={{ animation: 'spin 2s linear infinite' }} />
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.5rem' }}>
            กำลังให้ AI วิเคราะห์ข้อมูลดาวเทียมและร้อยเรียงเรื่องราว...
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '400px', margin: '0 auto', lineHeight: 1.5 }}>
            กำลังสกัดเส้นทางพายุจากดาวเทียม NASA EONET และเรียบเรียงผลกระทบภูมิศาสตร์ด้วย Gemini LLM
          </div>
        </div>
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
          padding: '1.5rem', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(24px)',
          borderRadius: 20, border: `1px solid rgba(255, 255, 255, 0.08)`, color: '#f1f5f9',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
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

  // ดึงแถบ Timeline แยกออกมาเป็นฟังก์ชัน เพื่อใช้ทำ Floating บน Desktop หรือ Stack บน Mobile
  const renderTimeline = (isFloating = true) => (
    <div className="glass" style={{
      borderRadius: 20,
      padding: isFloating ? '1rem 2rem' : '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      flexShrink: 0,
      ...(isFloating ? {
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        height: '110px',
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
      } : {
        height: '140px',
        marginTop: '0.5rem'
      })
    }}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'absolute', top: '25px', left: '5%', right: '5%', height: '3px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '25px', left: '5%', width: `${(currentStep / 2) * 90}%`, height: '3px', background: activeStep.color, zIndex: 0, transition: 'all 0.5s ease' }} />

        {selectedEvent.steps.map((step, idx) => (
          <div key={idx} onClick={() => setCurrentStep(idx)} style={{ zIndex: 1, textAlign: 'center', cursor: 'pointer', width: '100px' }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: currentStep >= idx ? step.color : 'rgba(255, 255, 255, 0.04)',
              border: `4px solid ${currentStep === idx ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)'}`,
              color: currentStep >= idx ? '#0d1117' : '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
              transition: 'all 0.3s', fontWeight: 800, fontSize: '1.1rem',
              boxShadow: currentStep === idx ? `0 0 20px ${step.color}80` : 'none',
              backdropFilter: 'blur(8px)'
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
  )

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1rem', overflow: 'hidden', position: 'relative', width: '100%' }}>

      {/* ── ซ้าย: Sidebar เมนูเลือกเหตุการณ์ ── */}
      <div className="glass" style={{
        width: isSidebarOpen ? '380px' : '0px',
        minWidth: isSidebarOpen ? '380px' : '0px',
        padding: isSidebarOpen ? '1.25rem' : '0px',
        overflowY: 'auto',
        borderRadius: 20,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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

        {/* Smart Search Bar */}
        <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7a8a9e', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ค้นหาชื่อพายุ หรือ ประเทศ (Search)
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="เช่น ฟิลิปปินส์, ญี่ปุ่น, Sinlaku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#f1f5f9',
                fontSize: '0.85rem',
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.05)',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#f59e0b50'; e.target.style.boxShadow = '0 0 10px rgba(245,158,11,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Sleek Filters (Year & Month) */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7a8a9e', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ปี (Year)
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 1rem', background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#f1f5f9',
                fontSize: '0.8rem', outline: 'none', cursor: 'pointer', appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2218%22%20height%3D%2218%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")',
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.05)', transition: 'all 0.2s ease'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#f59e0b50'; e.target.style.boxShadow = '0 0 10px rgba(245,158,11,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }}
            >
              {uniqueYears.map(yr => (
                <option key={yr} value={yr} style={{ background: '#0d1117', color: '#f1f5f9' }}>
                  {yr === 'All' ? 'ทุกปี (All)' : `ปี ${yr}`}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7a8a9e', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              เดือน (Month)
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 1rem', background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#f1f5f9',
                fontSize: '0.8rem', outline: 'none', cursor: 'pointer', appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2218%22%20height%3D%2218%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")',
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.05)', transition: 'all 0.2s ease'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#f59e0b50'; e.target.style.boxShadow = '0 0 10px rgba(245,158,11,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }}
            >
              <option value="All" style={{ background: '#0d1117', color: '#f1f5f9' }}>ทุกเดือน</option>
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => {
                const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
                return (
                  <option key={m} value={m} style={{ background: '#0d1117', color: '#f1f5f9' }}>
                    {monthNames[parseInt(m)-1]}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Dedicated Refresh Button */}
        <button
          onClick={() => {
            fetchHistory(true);
          }}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.2) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fcd34d',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '1.25rem',
            transition: 'all 0.2s ease-in-out',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.05)',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.3) 100%)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(245, 158, 11, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.2) 100%)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.05)';
          }}
        >
          {loading ? (
            <>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>กำลังดึงข้อมูล...</span>
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              <span>ดึงข้อมูลพายุล่าสุด (NASA + AI)</span>
            </>
          )}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', overflowY: 'auto', flex: 1, paddingRight: 4 }} className="modal-body-scroll">
          {filteredEvents.map(event => (
            <button
              key={event.id}
              onClick={() => handleSelectEvent(event)}
              className={`issue-card ${selectedEvent.id === event.id ? 'active' : ''}`}
              style={{
                textAlign: 'left',
                display: 'block',
                flexShrink: 0,
                width: '100%',
                margin: 0,
                padding: '1.25rem',
                background: selectedEvent.id === event.id ? 'rgba(245, 158, 11, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                borderColor: selectedEvent.id === event.id ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.07)',
                color: selectedEvent.id === event.id ? '#fcd34d' : '#94a3b8',
                boxShadow: selectedEvent.id === event.id ? '0 4px 16px rgba(245,158,11,0.1)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, width: '100%' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.8, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                  {event.category}
                </span>
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.85rem', color: selectedEvent.id === event.id ? '#fcd34d' : '#f1f5f9', marginBottom: 8 }}>
                {event.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: selectedEvent.id === event.id ? '#f59e0b80' : '#64748b' }}>
                <Clock size={12} />
                <span>{event.steps && event.steps[0] ? event.steps[0].time : event.year}</span>
              </div>
            </button>
          ))}
          {filteredEvents.length === 0 && (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', padding: '2rem 0' }}>
              ไม่พบข้อมูลพายุในปีนี้
            </div>
          )}
        </div>
      </div>

      {/* ── ขวา: พื้นที่แสดงผล ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
        height: '100%',
        overflowY: isMobile ? 'auto' : 'hidden', // ✨ บนมือถือให้ไถจอลงมาดูด้านล่างได้
        paddingRight: isMobile ? '0.5rem' : '0',
        paddingBottom: isMobile ? '1rem' : '0'
      }} className={isMobile ? 'modal-body-scroll' : ''}>

        {/* แผนที่กว้างเต็มจอ */}
        <div className="map-section glass" style={{
          flex: 1,
          height: '100%',
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

          {/* Desktop: แสดงกล่องข้อความ และ Timeline ลอยทับลงไปบนแผนที่ตามปกติ */}
          {!isMobile && renderNarrative(true)}
          {!isMobile && renderTimeline(true)}
        </div>

        {/* Mobile: แสดงแถบควบคุมแบบ Stack ด้านล่าง */}
        {isMobile && renderTimeline(false)}
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