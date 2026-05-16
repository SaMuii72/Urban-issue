import { useState, useEffect } from 'react'

export function useEvents(refreshInterval = 5 * 60 * 1000) { // 5 นาที
  const [events, setEvents] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      const url = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/events`
        : '/api/events'
      const res = await fetch(url)
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