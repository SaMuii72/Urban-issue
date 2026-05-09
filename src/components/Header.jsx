import { ShieldAlert, Globe, Flame, CloudLightning, Waves, Activity, Zap, MapPin, TreePine, Mountain, Info } from 'lucide-react'

// Helper to get color/icon for category dynamically
export const getCategoryStyles = (category) => {
  const cat = (category || '').toLowerCase()
  if (cat.includes('fire') || cat === 'ไฟไหม้') return { color: '#ef4444', bg: '#fee2e2', icon: <Flame size={14} /> }
  if (cat.includes('storm') || cat === 'พายุ') return { color: '#0ea5e9', bg: '#e0f2fe', icon: <CloudLightning size={14} /> }
  if (cat.includes('flood') || cat.includes('water') || cat === 'น้ำท่วม') return { color: '#3b82f6', bg: '#dbeafe', icon: <Waves size={14} /> }
  if (cat.includes('earthquake') || cat.includes('แผ่นดินไหว')) return { color: '#8b5cf6', bg: '#f3e8ff', icon: <Activity size={14} /> }
  if (cat.includes('landslide') || cat.includes('ดินโคลนถล่ม') || cat.includes('ดินถล่ม')) return { color: '#92400e', bg: '#fef3c7', icon: <Mountain size={14} /> }
  if (cat.includes('electricity') || cat.includes('ไฟฟ้า')) return { color: '#f59e0b', bg: '#fef3c7', icon: <Zap size={14} /> }
  if (cat.includes('road') || cat.includes('ถนน') || cat.includes('ทางเท้า')) return { color: '#64748b', bg: '#f1f5f9', icon: <MapPin size={14} /> }
  if (cat.includes('tree') || cat.includes('ต้นไม้')) return { color: '#22c55e', bg: '#dcfce7', icon: <TreePine size={14} /> }

  // Default hash-based color for unknown categories
  const colors = [
    { color: '#8b5cf6', bg: '#ede9fe' },
    { color: '#ec4899', bg: '#fce7f3' },
    { color: '#14b8a6', bg: '#ccfbf1' },
    { color: '#f97316', bg: '#ffedd5' }
  ]
  let hash = 0
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash)
  const idx = Math.abs(hash) % colors.length

  return { ...colors[idx], icon: <Info size={14} /> }
}

const Header = ({ events = [], stats, filter, setFilter, severityFilter, setSeverityFilter, page, setPage }) => {  // Dynamically extract unique categories from events
  const uniqueCategories = [...new Set(events.map(e => e.category))].filter(Boolean)

  const categories = [
    { id: 'all', label: 'All', icon: <Globe size={14} /> },
    ...uniqueCategories.map(cat => ({
      id: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      ...getCategoryStyles(cat)
    }))
  ]

  const severities = [
    { id: 'all', label: 'All', color: null },
    { id: 'high', label: 'High', color: '#ef4444' },
    { id: 'medium', label: 'Medium', color: '#f59e0b' },
    { id: 'low', label: 'Low', color: '#22c55e' },
  ]

  return (
    <header className="glass app-header" style={{
      padding: '0.75rem 1.25rem',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
    }}>
      {/* Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{
          background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
          padding: '0.4rem',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(14,165,233,0.3)',
          display: 'flex',
        }}>
          <ShieldAlert color="#fff" size={18} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>UrbanWatch</h1>
          <p style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 500, marginTop: '1px' }}>Monitoring Dashboard</p>
        </div>

        {/* Page Navigation — segmented control */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: '999px',
          padding: '3px',
          gap: '2px',
          marginLeft: '0.5rem',
        }}>
          {[{ id: 'dashboard', label: 'Map' }, { id: 'story', label: 'Story' }, { id: 'analytics', label: 'Analytics' }].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              style={{
                padding: '0.3rem 0.85rem',
                borderRadius: '999px',
                border: 'none',
                background: page === id ? 'white' : 'transparent',
                color: page === id ? '#0f172a' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: page === id ? 600 : 400,
                boxShadow: page === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters row */}
      <div className="header-filters-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>

        {/* Category filters */}
        <div className="header-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
            Category
          </span>
          <div className="filter-scroll" style={{
            display: 'flex',
            gap: '4px',
            overflowX: 'auto',
            flexWrap: 'nowrap',
          }}>
            {categories.map((cat) => {
              const isActive = filter === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: isActive ? (cat.color || '#0ea5e9') : '#e2e8f0',
                    background: isActive ? (cat.bg || '#e0f2fe') : 'white',
                    color: isActive ? (cat.color || '#0ea5e9') : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="header-divider" style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 0.25rem' }} />

        {/* Severity filters */}
        <div className="header-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Severity
          </span>
          <div style={{
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap'
          }}>
            {severities.map((sev) => {
              const isActive = severityFilter === sev.id
              return (
                <button
                  key={sev.id}
                  onClick={() => setSeverityFilter(sev.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: isActive ? (sev.color || '#0ea5e9') : '#e2e8f0',
                    background: isActive ? (sev.color ? `${sev.color}15` : '#e0f2fe') : 'white',
                    color: isActive ? (sev.color || '#0ea5e9') : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {sev.color && (
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: sev.color, display: 'inline-block',
                    }} />
                  )}
                  {sev.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {stats}
      </div>
    </header>
  )
}

export default Header
