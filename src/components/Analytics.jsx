import { useMemo, useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell
} from 'recharts'

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640)
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 640)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return mobile
}

const COLORS = {
  fire: '#ef4444', earthquake: '#8b5cf6', storm: '#60a5fa',
  flood: '#38bdf8', landslide: '#d97706', volcano: '#dc2626',
  drought: '#f59e0b', other: '#64748b',
}
const SEV_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' }

const darkCard = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: '1.25rem',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
}

const tooltipStyle = {
  fontSize: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
  background: '#1e293b', color: '#f1f5f9',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
}

export default function Analytics({ events }) {
  const isMobile = useIsMobile()
  const stats = useMemo(() => {
    if (!events.length) return null

    const catCount = {}
    events.forEach(e => { catCount[e.category] = (catCount[e.category] || 0) + 1 })
    const categoryData = Object.entries(catCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const sevCount = { critical: 0, high: 0, medium: 0, low: 0 }
    events.forEach(e => { if (sevCount[e.severity] !== undefined) sevCount[e.severity]++ })
    const severityData = Object.entries(sevCount)
      .map(([name, value]) => ({ name, value })).filter(d => d.value > 0)

    const countryCount = {}
    events.forEach(e => {
      if (e.country) countryCount[e.country] = (countryCount[e.country] || 0) + 1
    })
    const topCountries = Object.entries(countryCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, count }))

    const dateCount = {}
    events.forEach(e => {
      if (!e.date) return
      try {
        const d = new Date(e.date)
        if (isNaN(d.getTime())) return
        const key = d.toISOString().slice(0, 10)
        dateCount[key] = (dateCount[key] || 0) + 1
      } catch { return }
    })
    const timeline = Object.entries(dateCount)
      .sort((a, b) => a[0].localeCompare(b[0])).slice(-14)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      }))

    const srcCount = {}
    events.forEach(e => { srcCount[e.source] = (srcCount[e.source] || 0) + 1 })
    const sourceData = Object.entries(srcCount).map(([name, value]) => ({ name, value }))

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const monthCount = {}
    events.forEach(e => {
      if (!e.date) return
      const d = new Date(e.date)
      if (isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
      monthCount[key] = (monthCount[key] || 0) + 1
    })
    const monthlyPattern = Object.entries(monthCount)
      .sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
      .map(([key, count]) => {
        const [y, m] = key.split('-')
        return { month: `${monthNames[+m]} ${y.slice(2)}`, count }
      })

    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const dowCount = [0,0,0,0,0,0,0]
    events.forEach(e => {
      if (!e.date) return
      const d = new Date(e.date)
      if (isNaN(d.getTime())) return
      dowCount[d.getDay()]++
    })
    const dowPattern = dayNames.map((day, i) => ({ day, count: dowCount[i] }))

    return { categoryData, severityData, topCountries, timeline, sourceData, monthlyPattern, dowPattern, total: events.length }
  }, [events])

  if (!stats) return <div style={{ padding: '2rem', color: '#6e7d91' }}>Loading...</div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Header Card */}
      <div style={{ ...darkCard, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: '#6e7d91', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            DisasterWatch · Analytics
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>Overview</h2>
        </div>
        <div style={{ fontSize: 15, color: '#6e7d91' }}>
          <span style={{ fontWeight: 800, color: '#fcd34d', fontSize: 32 }}>{stats.total}</span>
          <span style={{ marginLeft: 6 }}>เหตุการณ์</span>
        </div>
      </div>

      {/* Timeline */}
      <Card title="เหตุการณ์ตามวัน" sub="14 วันล่าสุด">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={stats.timeline} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#7a8a9e' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#7a8a9e' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val) => [`${val} เหตุการณ์`, '']} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Category + Severity */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
        <Card title="ประเภทภัยพิบัติ" sub="จำนวนแยกตาม category">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.categoryData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#7a8a9e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#7a8a9e' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val) => [`${val} เหตุการณ์`]} contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {stats.categoryData.map(e => <Cell key={e.name} fill={COLORS[e.name] || '#64748b'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="ระดับความรุนแรง" sub="สัดส่วนแต่ละระดับ">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={stats.severityData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={65} innerRadius={30}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false} fontSize={11}>
                {stats.severityData.map(e => <Cell key={e.name} fill={SEV_COLORS[e.name] || '#64748b'} />)}
              </Pie>
              <Tooltip formatter={(val) => [`${val} เหตุการณ์`]} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Countries */}
      <Card title="Top 10 ประเทศที่ได้รับผลกระทบ" sub="นับตามจำนวนเหตุการณ์">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.topCountries} layout="vertical" margin={{ top: 0, right: 16, left: 80, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 12, fill: '#7a8a9e' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={80} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val) => [`${val} เหตุการณ์`]} contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Temporal */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
        <Card title="รายเดือน" sub="12 เดือนล่าสุด">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.monthlyPattern} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7a8a9e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#7a8a9e' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val) => [`${val} เหตุการณ์`]} contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#d97706" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="รายวันในสัปดาห์" sub="pattern รายวัน">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.dowPattern} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#7a8a9e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#7a8a9e' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val) => [`${val} เหตุการณ์`]} contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Data Sources */}
      <Card title="แหล่งข้อมูล" sub="สัดส่วนข้อมูลจากแต่ละ source">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats.sourceData.map(s => {
            const pct = Math.round((s.value / stats.total) * 100)
            return (
              <div key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                  <span style={{ color: '#b4bcc8', fontWeight: 500 }}>{s.name}</span>
                  <span style={{ color: '#6e7d91' }}>{s.value} ({pct}%)</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b, #ef4444)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

    </div>
  )
}

function Card({ title, sub, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20, padding: '1.25rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>{title}</div>
        <div style={{ fontSize: 13, color: '#6e7d91', marginTop: 2 }}>{sub}</div>
      </div>
      {children}
    </div>
  )
}
