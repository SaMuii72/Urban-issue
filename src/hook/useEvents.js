import { useState, useEffect, useCallback } from 'react'

export function useEvents(refreshInterval = 5 * 60 * 1000) {
  const [events, setEvents] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ใช้ useCallback เพื่อจำฟังก์ชันไว้ และรับค่า isManualRefresh
  const fetchEvents = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setLoading(true) // โชว์หน้าโหลดตอนกด Refresh

      const baseUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/events`
        : '/api/events'

      // ถ้าเป็นการกดปุ่มด้วยมือ ให้ต่อท้าย ?refresh=true
      const url = isManualRefresh ? `${baseUrl}?refresh=true` : baseUrl

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
  }, [])

  useEffect(() => {
    fetchEvents() // ทำงานครั้งแรก (ไม่บังคับ refresh)
    const interval = setInterval(() => fetchEvents(false), refreshInterval)
    return () => clearInterval(interval)
  }, [fetchEvents, refreshInterval])

  // ฟังก์ชันนี้จะถูกส่งไปให้ปุ่มบน Header
  const manualRefresh = () => fetchEvents(true)

  return { events, lastUpdated, loading, error, refresh: manualRefresh }
}