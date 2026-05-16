import { motion } from 'framer-motion'
import { Calendar, MapPin, ExternalLink } from 'lucide-react'
import { getCategoryStyles } from './Header'

const Gallery = ({ events, selectedId, onSelect }) => {
  const sortedEvents = [...events].sort((a, b) => new Date(b.date) - new Date(a.date))
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

  if (!sortedEvents.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: 12 }}>
      <span style={{ fontSize: 36 }}>🔍</span>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#7a8a9e', margin: 0 }}>ไม่พบเหตุการณ์</p>
      <p style={{ fontSize: 12, margin: 0, color: '#7a8a9e' }}>ลองเปลี่ยน filter ดูครับ</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.5rem' }}>
      {sortedEvents.map((event, index) => {
        const catStyle = getCategoryStyles(event.category)
        const isSelected = selectedId === event.title

        return (
          <motion.div
            key={index}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.01 }}
            onClick={() => onSelect(event)}
            className={`issue-card ${isSelected ? 'active' : ''}`}
            style={{ borderRadius: '16px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span className={`severity-tag severity-${event.severity || 'medium'}`}>
                  {event.severity || 'Medium'}
                </span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '0.2rem',
                  padding: '0.25rem 0.6rem', borderRadius: '9999px',
                  fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                  background: catStyle.bg, color: catStyle.color,
                  border: `1px solid ${catStyle.color}40`
                }}>
                  {catStyle.icon} {event.category}
                </span>
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6e7d91' }}>
                {event.source.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <h3 style={{
              fontSize: '0.9rem', fontWeight: 600,
              color: '#e2e8f0',
              marginBottom: '0.75rem', lineHeight: 1.4,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {formatTitle(event.title)}
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#7a8a9e', fontWeight: 500 }}>
                <Calendar size={12} />
                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#7a8a9e', fontWeight: 500 }}>
                <MapPin size={12} />
                {event.city || 'Global Location'}
              </div>
            </div>

            {isSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}
              >
                <p style={{ fontSize: '0.85rem', color: '#7a8a9e', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  {event.description}
                </p>
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.75rem', color: '#0d1117',
                    background: '#f59e0b',
                    padding: '0.5rem 1rem', borderRadius: '8px',
                    textDecoration: 'none', fontWeight: 700
                  }}
                >
                  Source Details <ExternalLink size={13} />
                </a>
              </motion.div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

export default Gallery
