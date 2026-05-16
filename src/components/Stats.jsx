const Stats = ({ events }) => {
  const highSeverity = events.filter(e => e.severity === 'high').length
  const total = events.length

  return (
    <div className="header-stats" style={{ display: 'flex', gap: '0.75rem' }}>
      <div style={{
        minWidth: '100px',
        padding: '0.5rem 0.85rem',
        borderLeft: '2px solid rgba(245, 158, 11, 0.6)',
        background: 'rgba(245, 158, 11, 0.06)',
        borderRadius: '0 10px 10px 0'
      }}>
        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fcd34d', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{total}</div>
        <div style={{ fontSize: '0.6rem', color: '#7a8a9e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '3px' }}>Total Events</div>
      </div>
      <div style={{
        minWidth: '100px',
        padding: '0.5rem 0.85rem',
        borderLeft: '2px solid rgba(239, 68, 68, 0.6)',
        background: 'rgba(239, 68, 68, 0.06)',
        borderRadius: '0 10px 10px 0'
      }}>
        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fca5a5', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{highSeverity}</div>
        <div style={{ fontSize: '0.6rem', color: '#7a8a9e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '3px' }}>Critical</div>
      </div>
    </div>
  )
}

export default Stats
