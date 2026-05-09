import { useState, useEffect } from 'react'

export function useEvents(refreshInterval = 5 * 60 * 1000) { // 5 นาที
  const [events, setEvents] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      // เพิ่ม ?t= เพื่อไม่ให้ browser cache
      const res = await fetch(`/events.json?t=${Date.now()}`)
      const data = await res.json()
      setEvents(data.events || [])
      setLastUpdated(new Date())
    } catch (e) {
      console.error('Failed to fetch events:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  return { events, lastUpdated, loading, refresh: fetchEvents }
}