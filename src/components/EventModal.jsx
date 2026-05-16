import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Share2, ArrowUpRight, AlertTriangle, Calendar, Database, Navigation } from 'lucide-react'
import { getCategoryStyles } from './Header'

const EventModal = ({ event, onClose }) => {
  if (!event) return null

  const catStyle = getCategoryStyles(event.category)
  const isHigh = event.severity === 'high'

  const containerVars = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  }

  const cardVars = {
    hidden: { scale: 0.95, y: 30, opacity: 0 },
    visible: {
      scale: 1, y: 0, opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 300, delayChildren: 0.1, staggerChildren: 0.1 }
    },
    exit: { scale: 0.95, y: 20, opacity: 0, transition: { duration: 0.2 } }
  }

  const itemVars = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(16px) saturate(120%)',
          zIndex: 9999, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '1rem'
        }}
      >
        <motion.div
          variants={cardVars}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '600px', maxHeight: '92vh',
            overflow: 'hidden', borderRadius: '28px',
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', position: 'relative'
          }}
        >
          {/* Header Visual */}
          <div style={{
            height: '175px',
            background: `linear-gradient(135deg, ${catStyle.color}33 0%, ${catStyle.color}18 40%, transparent 100%)`,
            borderBottom: `1px solid ${catStyle.color}25`,
            position: 'relative', padding: '2rem',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', overflow: 'hidden'
          }}>
            {/* Glow orbs */}
            <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '220px', height: '220px', borderRadius: '50%', background: `${catStyle.color}12`, filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', bottom: '-30%', left: '5%', width: '160px', height: '160px', borderRadius: '50%', background: `${catStyle.color}08`, filter: 'blur(40px)' }} />

            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '50%', padding: '0.5rem',
                cursor: 'pointer', color: '#94a3b8',
                display: 'flex', transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#f1f5f9' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8' }}
            >
              <X size={18} />
            </button>

            <motion.div variants={itemVars} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
              <div style={{
                background: `${catStyle.color}22`,
                border: `1px solid ${catStyle.color}40`,
                padding: '1rem', borderRadius: '18px',
                display: 'flex', color: catStyle.color,
              }}>
                {catStyle.icon ? <div style={{ transform: 'scale(1.4)' }}>{catStyle.icon}</div> : <AlertTriangle size={22} />}
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: catStyle.color, letterSpacing: '0.1em', marginBottom: '5px', opacity: 0.85 }}>
                  System Report · {event.category}
                </div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.25, color: '#f1f5f9' }}>
                  {event.title}
                </h2>
              </div>
            </motion.div>
          </div>

          {/* Main Body */}
          <div style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1 }} className="modal-body-scroll">

            {/* Bento Stats */}
            <motion.div variants={itemVars} style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem', marginBottom: '1.75rem'
            }}>
              {/* Severity */}
              <div style={{
                padding: '1rem', borderRadius: '16px',
                background: isHigh ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                border: `1px solid ${isHigh ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`
              }}>
                <div style={{ fontSize: '0.6rem', color: isHigh ? '#fca5a5' : '#fcd34d', fontWeight: 800, textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.05em' }}>Severity</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: isHigh ? '#fca5a5' : '#fcd34d' }}>{event.severity?.toUpperCase() || 'MEDIUM'}</div>
              </div>
              {/* Location */}
              <div style={{
                padding: '1rem', background: 'rgba(255,255,255,0.04)',
                borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', gridColumn: 'span 2'
              }}>
                <div style={{ fontSize: '0.6rem', color: '#7a8a9e', fontWeight: 800, textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.05em' }}>Location</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} color="#f59e0b" />
                  {[event.city, event.country].filter(Boolean).join(', ') || 'Global Origin'}
                </div>
              </div>
              {/* Date */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.6rem', color: '#7a8a9e', fontWeight: 800, textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.05em' }}>Date</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={12} color="#64748b" />
                  {event.date ? new Date(event.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </div>
              </div>
              {/* Source */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.6rem', color: '#7a8a9e', fontWeight: 800, textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.05em' }}>Source</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Database size={12} color="#64748b" />
                  {event.source || 'Unknown'}
                </div>
              </div>
              {/* Coordinates */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.6rem', color: '#7a8a9e', fontWeight: 800, textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.05em' }}>Coords</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Navigation size={12} color="#64748b" />
                  {event.lat != null ? `${event.lat.toFixed(2)}, ${event.lng.toFixed(2)}` : 'N/A'}
                </div>
              </div>
            </motion.div>

            {/* Narrative */}
            <motion.div variants={itemVars} style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '3px', height: '16px', background: '#f59e0b', borderRadius: '2px' }} />
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Impact Narrative</span>
              </div>
              <p style={{
                fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.75,
                background: 'rgba(255,255,255,0.03)', padding: '1.25rem',
                borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)',
              }}>
                {event.description}
              </p>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div variants={itemVars} style={{
            padding: '1.25rem 2rem',
            background: 'rgba(255,255,255,0.02)',
            display: 'flex', gap: '0.75rem',
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: event.title, text: event.description, url: window.location.href })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Link copied!')
                }
              }}
              style={{
                flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                padding: '0.85rem', background: '#f59e0b', color: '#0d1117',
                border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer',
                fontSize: '0.85rem', transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fbbf24'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.transform = 'none' }}
            >
              <Share2 size={16} /> Share Updates
            </button>
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.85rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
                fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#f1f5f9' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8' }}
            >
              Full Data <ArrowUpRight size={16} />
            </a>
          </motion.div>
        </motion.div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-body-scroll::-webkit-scrollbar { width: 4px; }
        .modal-body-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-body-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .modal-body-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
      `}} />
    </AnimatePresence>
  )
}

export default EventModal
