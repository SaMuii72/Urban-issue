import React, { useState, useEffect } from 'react'
import { Flame, CloudLightning, Waves, Activity, Zap, MapPin, TreePine, Mountain, Info, SlidersHorizontal, X, LayoutGrid, Radar, Search } from 'lucide-react'

export const getCategoryStyles = (category) => {
  const cat = (category || '').toLowerCase()
  if (cat.includes('fire') || cat === 'ไฟไหม้') return { color: '#fca5a5', bg: 'rgba(239,68,68,0.15)', icon: <Flame size={14} /> }
  if (cat.includes('storm') || cat === 'พายุ') return { color: '#93c5fd', bg: 'rgba(59,130,246,0.15)', icon: <CloudLightning size={14} /> }
  if (cat.includes('flood') || cat.includes('water') || cat === 'น้ำท่วม') return { color: '#7dd3fc', bg: 'rgba(14,165,233,0.15)', icon: <Waves size={14} /> }
  if (cat.includes('earthquake') || cat.includes('แผ่นดินไหว')) return { color: '#c4b5fd', bg: 'rgba(139,92,246,0.15)', icon: <Activity size={14} /> }
  if (cat.includes('landslide') || cat.includes('ดินโคลนถล่ม') || cat.includes('ดินถล่ม')) return { color: '#fcd34d', bg: 'rgba(180,83,9,0.2)', icon: <Mountain size={14} /> }
  if (cat.includes('electricity') || cat.includes('ไฟฟ้า')) return { color: '#fde68a', bg: 'rgba(245,158,11,0.15)', icon: <Zap size={14} /> }
  if (cat.includes('road') || cat.includes('ถนน') || cat.includes('ทางเท้า')) return { color: '#cbd5e1', bg: 'rgba(100,116,139,0.2)', icon: <MapPin size={14} /> }
  if (cat.includes('tree') || cat.includes('ต้นไม้')) return { color: '#6ee7b7', bg: 'rgba(16,185,129,0.15)', icon: <TreePine size={14} /> }
  const colors = [
    { color: '#c4b5fd', bg: 'rgba(139,92,246,0.15)' },
    { color: '#f9a8d4', bg: 'rgba(236,72,153,0.15)' },
    { color: '#5eead4', bg: 'rgba(20,184,166,0.15)' },
    { color: '#fdba74', bg: 'rgba(249,115,22,0.15)' },
  ]
  let hash = 0
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash)
  return { ...colors[Math.abs(hash) % colors.length], icon: <Info size={14} /> }
}

// ── Sub-components ──────────────────────────────────────────────────────────

const UpdateControls = ({ lastUpdated, onRefresh, compact = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '0.4rem' : '0.75rem', flexShrink: 0 }}>
    {!compact && (
      <div style={{ fontSize: 11, color: '#7a8a9e', textAlign: 'right', lineHeight: 1.5 }}>
        <div style={{ letterSpacing: '0.03em', textTransform: 'uppercase', fontSize: 10 }}>Last updated</div>
        <div style={{ fontWeight: 600, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
          {lastUpdated ? lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </div>
      </div>
    )}
    <button
      onClick={onRefresh}
      title={compact && lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}` : undefined}
      style={{
        fontSize: 11, padding: compact ? '5px 8px' : '5px 12px', borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
        color: '#94a3b8', cursor: 'pointer', fontWeight: 600,
        letterSpacing: '0.02em', transition: 'all 0.2s', flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.12)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)'; e.currentTarget.style.color = '#fcd34d' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8' }}
    >
      ↻{!compact && ' Refresh'}
    </button>
  </div>
)

const SearchBar = ({ style, searchQuery, setSearchQuery }) => (
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', ...style }}>
    <Search size={14} color="#64748b" style={{ position: 'absolute', left: '0.85rem', pointerEvents: 'none' }} />
    <input
      type="text"
      placeholder="Search incidents, cities..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      style={{
        width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', color: '#f1f5f9', fontSize: '0.8rem',
        outline: 'none', transition: 'all 0.2s',
      }}
      onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.3)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
    />
  </div>
)

const FilterToggleButton = ({ showFilters, setShowFilters }) => (
  <button onClick={() => setShowFilters(v => !v)} style={{
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.35rem 0.75rem', borderRadius: '999px', border: '1px solid',
    borderColor: showFilters ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)',
    background: showFilters ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
    color: showFilters ? '#fcd34d' : '#94a3b8',
    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, flexShrink: 0,
    letterSpacing: '0.02em', transition: 'all 0.2s',
  }}>
    {showFilters ? <X size={13} /> : <SlidersHorizontal size={13} />}
    {showFilters ? 'Close' : 'Filter'}
  </button>
)

const Btn = ({ isActive, color, bg, onClick, children }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.3rem 0.75rem', borderRadius: '999px', border: '1px solid',
    borderColor: isActive ? (color || '#f59e0b') : 'rgba(255,255,255,0.09)',
    background: isActive ? (bg || 'rgba(245,158,11,0.15)') : 'rgba(255,255,255,0.04)',
    color: isActive ? (color || '#fcd34d') : '#64748b',
    cursor: 'pointer', fontSize: '0.73rem', fontWeight: isActive ? 600 : 400,
    transition: 'all 0.15s ease', whiteSpace: 'nowrap', flexShrink: 0,
    letterSpacing: '0.01em',
  }}>{children}</button>
)

const Nav = ({ page, setPage, full = false }) => (
  <div style={{
    display: 'flex', background: 'rgba(255,255,255,0.05)',
    borderRadius: '999px', padding: '3px', gap: '2px',
    border: '1px solid rgba(255,255,255,0.07)',
    flexShrink: full ? 1 : 0,
    ...(full ? { width: '100%' } : {}),
  }}>
    {[{ id: 'dashboard', label: 'Map' }, { id: 'story', label: 'Story' }, { id: 'analytics', label: 'Analytics' }].map(({ id, label }) => (
      <button key={id} onClick={() => setPage(id)} style={{
        ...(full ? { flex: 1 } : { padding: '0.3rem 0.9rem' }),
        ...(!full ? {} : { padding: '0.3rem 0.5rem' }),
        borderRadius: '999px', border: 'none',
        background: page === id ? 'rgba(245,158,11,0.2)' : 'transparent',
        color: page === id ? '#fcd34d' : '#b4bcc8',
        cursor: 'pointer', fontSize: '0.85rem',
        fontWeight: page === id ? 600 : 500,
        boxShadow: page === id ? '0 0 12px rgba(245,158,11,0.15)' : 'none',
        transition: 'all 0.2s ease', whiteSpace: 'nowrap',
        letterSpacing: '0.01em', minWidth: 0,
      }}>{label}</button>
    ))}
  </div>
)

const Logo = ({ compact = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
    <div style={{
      background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
      padding: compact ? '0.35rem' : '0.45rem', borderRadius: '10px',
      boxShadow: '0 4px 16px rgba(245,158,11,0.35)', display: 'flex',
    }}>
      <Radar color="#fff" size={compact ? 15 : 18} />
    </div>
    <div>
      <h1 style={{ fontSize: compact ? '1rem' : '1.25rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.1, letterSpacing: '-0.02em' }}>UrbanWatch</h1>
      {!compact && <p style={{ fontSize: '0.65rem', color: '#7a8a9e', fontWeight: 500, marginTop: '2px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Monitoring Dashboard</p>}
    </div>
  </div>
)

// Compact stats used on mobile/tablet row 1
const StatsInline = ({ events }) => {
  const total = events.length
  const high = events.filter(e => e.severity === 'high').length
  return (
    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
      {[
        { val: total, label: 'Total', color: '#fcd34d', border: 'rgba(245,158,11,0.6)', bg: 'rgba(245,158,11,0.06)' },
        { val: high, label: 'High', color: '#fca5a5', border: 'rgba(239,68,68,0.6)', bg: 'rgba(239,68,68,0.06)' },
      ].map(({ val, label, color, border, bg }) => (
        <div key={label} style={{ padding: '0.3rem 0.55rem', borderLeft: `2px solid ${border}`, background: bg, borderRadius: '0 7px 7px 0' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{val}</div>
          <div style={{ fontSize: '0.5rem', color: '#7a8a9e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main Header ─────────────────────────────────────────────────────────────

const Header = ({ events = [], StatsComponent, lastUpdated, onRefresh, filter, setFilter, severityFilter, setSeverityFilter, searchQuery, setSearchQuery, dateFilter, setDateFilter, page, setPage }) => {
  const [showFilters, setShowFilters] = useState(false)
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const isDesktop = width > 1024
  const isMap = page === 'dashboard'

  const uniqueCategories = [...new Set(events.map(e => e.category))].filter(Boolean)
  const categories = [
    { id: 'all', label: 'All', icon: <LayoutGrid size={14} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    ...uniqueCategories.map(cat => ({ id: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1), ...getCategoryStyles(cat) }))
  ]
  const severities = [
    { id: 'all', label: 'All', color: null },
    { id: 'high', label: 'High', color: '#ef4444' },
    { id: 'medium', label: 'Medium', color: '#f59e0b' },
    { id: 'low', label: 'Low', color: '#10b981' },
  ]
  const dateRanges = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: '3days', label: '3 Days' },
    { id: 'week', label: 'Week' },
  ]

  const labelStyle = {
    fontSize: '0.72rem', fontWeight: 700, color: '#7a8a9e',
    textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0,
  }

  // ── Desktop ────────────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <header className="glass" style={{
        padding: '0.875rem 1.5rem', borderRadius: '20px',
        display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: 0,
      }}>
        {/* Left: stacked rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', flex: 1, minWidth: 0 }}>
          {/* Row 1: Logo + Nav + Search (Map only) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0 }}>
            <Logo />
            <Nav page={page} setPage={setPage} />
            {isMap && <SearchBar style={{ flex: 1, minWidth: 0, maxWidth: 360 }} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
          </div>
          {/* Filter rows — Map only */}
          {isMap && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span style={labelStyle}>Category</span>
                <div className="filter-scroll" style={{ display: 'flex', gap: '5px', overflowX: 'auto', flex: 1 }}>
                  {categories.map(cat => (
                    <Btn key={cat.id} isActive={filter === cat.id} color={cat.color} bg={cat.bg} onClick={() => setFilter(cat.id)}>
                      {cat.icon} {cat.label}
                    </Btn>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={labelStyle}>Severity</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {severities.map(sev => (
                      <Btn key={sev.id} isActive={severityFilter === sev.id} color={sev.color} bg={sev.color ? `${sev.color}22` : null} onClick={() => setSeverityFilter(sev.id)}>
                        {sev.color && <span style={{ width: 6, height: 6, borderRadius: '50%', background: sev.color, display: 'inline-block', flexShrink: 0, boxShadow: `0 0 6px ${sev.color}` }} />}
                        {sev.label}
                      </Btn>
                    ))}
                  </div>
                </div>
                <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={labelStyle}>Period</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {dateRanges.map(range => (
                      <Btn key={range.id} isActive={dateFilter === range.id} onClick={() => setDateFilter(range.id)}>
                        {range.label}
                      </Btn>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Stats + controls */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          gap: '0.75rem', flexShrink: 0,
          borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '1.5rem',
        }}>
          {StatsComponent}
          <UpdateControls lastUpdated={lastUpdated} onRefresh={onRefresh} />
        </div>
      </header>
    )
  }

  // ── Mobile / Tablet ────────────────────────────────────────────────────────
  return (
    <header className="glass" style={{
      padding: '0.75rem 1rem', borderRadius: '20px',
      display: 'flex', flexDirection: 'column', gap: '0.55rem',
    }}>
      {/* Row 1: Logo | Stats + Refresh (compact) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', overflow: 'hidden' }}>
        <Logo compact />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <StatsInline events={events} />
          <UpdateControls lastUpdated={lastUpdated} onRefresh={onRefresh} compact />
        </div>
      </div>

      {/* Row 2: Nav */}
      <Nav page={page} setPage={setPage} full />

      {/* Row 3: Search + Filter toggle — Map only */}
      {isMap && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SearchBar style={{ flex: 1, minWidth: 0 }} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <FilterToggleButton showFilters={showFilters} setShowFilters={setShowFilters} />
        </div>
      )}

      {/* Filter panel — Map only, toggled */}
      {isMap && showFilters && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.7rem',
          borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.7rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ ...labelStyle, paddingTop: '0.25rem', minWidth: 54 }}>Category</span>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1 }}>
              {categories.map(cat => (
                <Btn key={cat.id} isActive={filter === cat.id} color={cat.color} bg={cat.bg} onClick={() => setFilter(cat.id)}>
                  {cat.icon} {cat.label}
                </Btn>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ ...labelStyle, minWidth: 54 }}>Severity</span>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1 }}>
              {severities.map(sev => (
                <Btn key={sev.id} isActive={severityFilter === sev.id} color={sev.color} bg={sev.color ? `${sev.color}22` : null} onClick={() => setSeverityFilter(sev.id)}>
                  {sev.color && <span style={{ width: 6, height: 6, borderRadius: '50%', background: sev.color, display: 'inline-block', boxShadow: `0 0 6px ${sev.color}` }} />}
                  {sev.label}
                </Btn>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ ...labelStyle, minWidth: 54 }}>Period</span>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1 }}>
              {dateRanges.map(range => (
                <Btn key={range.id} isActive={dateFilter === range.id} onClick={() => setDateFilter(range.id)}>
                  {range.label}
                </Btn>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
