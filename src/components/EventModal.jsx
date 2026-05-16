import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, ShieldCheck, Share2, ArrowUpRight, Zap, AlertTriangle } from 'lucide-react'
import { getCategoryStyles } from './Header'

const EventModal = ({ event, onClose }) => {
  if (!event) return null
  

  const catStyle = getCategoryStyles(event.category)
  const isHigh = event.severity === 'high'

  // Dynamic timeline items based on event type
  const timeline = [
    { time: '0m', label: 'Signal Detected', desc: 'Anomaly identified via AI-driven social monitoring.', icon: <Zap size={14} /> },
    { time: '12m', label: 'Impact Validated', desc: 'Verified ' + event.severity + ' severity level through multiple sources.', icon: <ShieldCheck size={14} /> },
    { time: 'Live', label: 'Resilience Active', desc: 'Local networks and humanitarian responders are mobilized.', icon: <Heart size={14} /> },
  ]

  // Animation variants
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
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(2, 6, 23, 0.65)',
          backdropFilter: 'blur(12px) saturate(180%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        <motion.div
          variants={cardVars}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '600px',
            maxHeight: '92vh',
            overflow: 'hidden',
            borderRadius: '32px',
            background: 'rgba(255, 255, 255, 0.92)',
            boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255,255,255,0.5)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          {/* Header Visual */}
          <div style={{ 
            height: '180px', 
            background: `linear-gradient(135deg, ${catStyle.color} 0%, ${catStyle.color}dd 40%, ${catStyle.color}aa 100%)`,
            position: 'relative',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            overflow: 'hidden'
          }}>
            {/* Abstract Background Shapes */}
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(30px)' }} />
            
            <button 
              onClick={onClose}
              className="modal-close-btn"
              style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                background: 'rgba(0,0,0,0.15)',
                border: 'none', borderRadius: '50%', padding: '0.6rem',
                cursor: 'pointer', color: 'white', backdropFilter: 'blur(10px)',
                display: 'flex', transition: 'transform 0.2s ease'
              }}
            >
              <X size={20} />
            </button>
            
            <motion.div variants={itemVars} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
              <div style={{ 
                background: 'white', 
                padding: '1.1rem', 
                borderRadius: '22px',
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                display: 'flex',
                color: catStyle.color,
              }}>
                {catStyle.icon ? <div style={{ transform: 'scale(1.4)' }}>{catStyle.icon}</div> : <AlertTriangle size={24} />}
              </div>
              <div style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.9, letterSpacing: '0.1em', marginBottom: '4px' }}>
                  System Report · {event.category}
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{event.title}</h2>
              </div>
            </motion.div>
          </div>

          {/* Main Body */}
          <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }} className="modal-body-scroll">
            
            {/* Bento Grid Stats */}
            <motion.div variants={itemVars} style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '1rem', 
              marginBottom: '2rem' 
            }}>
              <div style={{ padding: '1rem', background: isHigh ? '#fef2f2' : '#fff7ed', borderRadius: '20px', border: `1px solid ${isHigh ? '#fee2e2' : '#ffedd5'}` }}>
                <div style={{ fontSize: '0.65rem', color: isHigh ? '#ef4444' : '#f59e0b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Level</div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: isHigh ? '#991b1b' : '#92400e' }}>{event.severity?.toUpperCase() || 'MEDIUM'}</div>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9', gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Location Context</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#3b82f6" /> {event.city || 'Global Origin'}
                </div>
              </div>
            </motion.div>

            {/* Narrative Box */}
            <motion.div variants={itemVars} style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '3px', height: '16px', background: 'var(--accent-primary)', borderRadius: '2px' }} />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#334155', letterSpacing: '0.02em' }}>Impact Narrative</span>
              </div>
              <p style={{ 
                fontSize: '1rem', 
                color: '#475569', 
                lineHeight: 1.7, 
                background: '#fff', 
                padding: '1.25rem', 
                borderRadius: '24px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                border: '1px solid #f1f5f9'
              }}>
                {event.description}
              </p>
            </motion.div>

            {/* Removed Response Status for better realism */}
          </div>

          {/* Dynamic Footer */}
          <motion.div variants={itemVars} style={{ 
            padding: '1.5rem 2rem', 
            background: 'white', 
            display: 'flex', 
            gap: '1rem',
            borderTop: '1px solid #f1f5f9',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.02)'
          }}>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: event.title,
                    text: event.description,
                    url: window.location.href,
                  })
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              style={{ 
                flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                padding: '0.9rem', background: 'var(--accent-primary)', color: 'white',
                border: 'none', borderRadius: '18px', fontWeight: 800, cursor: 'pointer', 
                boxShadow: '0 8px 20px rgba(14,165,233,0.35)',
                fontSize: '0.9rem'
              }}
            >
              <Share2 size={18} /> Share Updates
            </button>
            <a 
              href={event.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.9rem', background: '#f8fafc', color: '#475569',
                border: '1px solid #e2e8f0', borderRadius: '18px', fontWeight: 700, 
                cursor: 'pointer', textDecoration: 'none', fontSize: '0.85rem'
              }}
            >
              Full Data <ArrowUpRight size={18} />
            </a>
          </motion.div>
        </motion.div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-body-scroll::-webkit-scrollbar { width: 6px; }
        .modal-body-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-body-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; borderRadius: 10px; }
        .modal-body-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        .kind-action-btn {
          display: flex; alignItems: center; justify-content: center; gap: 0.6rem;
          padding: 0.75rem; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
          border-radius: 16px; font-size: 0.85rem; font-weight: 800; color: white; 
          cursor: pointer; backdrop-filter: blur(10px); transition: all 0.2s ease;
          width: 100%;
        }
        .kind-action-btn:hover {
          background: rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }
        .modal-close-btn:hover {
          transform: rotate(90deg) scale(1.1);
        }
      `}} />
    </AnimatePresence>
  )
}

export default EventModal
