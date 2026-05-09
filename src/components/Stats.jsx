const Stats = ({ events }) => {
  const highSeverity = events.filter(e => e.severity === 'high').length
  const total = events.length

  return (
    <div className="header-stats" style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ 
        minWidth: '110px',
        padding: '0.5rem 0.75rem', 
        borderLeft: '3px solid var(--accent-primary)',
        background: 'rgba(14, 165, 233, 0.05)',
        borderRadius: '0 8px 8px 0'
      }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{total}</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Total Events</div>
      </div>
      <div style={{ 
        minWidth: '110px',
        padding: '0.5rem 0.75rem', 
        borderLeft: '3px solid var(--danger)',
        background: 'rgba(225, 29, 72, 0.05)',
        borderRadius: '0 8px 8px 0'
      }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{highSeverity}</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Critical</div>
      </div>
    </div>
  )
}

export default Stats
