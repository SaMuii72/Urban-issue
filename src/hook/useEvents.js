import { useState, useEffect } from 'react'

export function useEvents(refreshInterval = 5 * 60 * 1000) {
  const [events, setEvents] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEvents = async () => {
    try {
      const url = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/events`
        : '/api/events'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setEvents(data.events || [])
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError(e.message || 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  return { events, lastUpdated, loading, error, refresh: fetchEvents }
}
