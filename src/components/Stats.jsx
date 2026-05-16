const Stats = ({ events, compact = false }) => {
  const highSeverity = events.filter(e => e.severity === 'high').length
  const total = events.length
  const numSize = compact ? '1rem' : '1.35rem'
  const pad = compact ? '0.35rem 0.6rem' : '0.5rem 0.85rem'

  return (
    <div className="header-stats" style={{ display: 'flex', gap: compact ? '0.4rem' : '0.75rem', flexShrink: 0 }}>
      <div style={{ padding: pad, borderLeft: '2px solid rgba(245,158,11,0.6)', background: 'rgba(245,158,11,0.06)', borderRadius: '0 8px 8px 0' }}>
        <div style={{ fontSize: numSize, fontWeight: 800, color: '#fcd34d', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{total}</div>
        <div style={{ fontSize: '0.55rem', color: '#7a8a9e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Total</div>
      </div>
      <div style={{ padding: pad, borderLeft: '2px solid rgba(239,68,68,0.6)', background: 'rgba(239,68,68,0.06)', borderRadius: '0 8px 8px 0' }}>
        <div style={{ fontSize: numSize, fontWeight: 800, color: '#fca5a5', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{highSeverity}</div>
        <div style={{ fontSize: '0.55rem', color: '#7a8a9e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>High</div>
      </div>
    </div>
  )
}

export default Stats
