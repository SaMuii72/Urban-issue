import { useMemo, useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
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

const DEVELOPING = new Set([
  'Philippines','Indonesia','Myanmar','Vietnam','Bangladesh','India','Pakistan',
  'Nepal','Afghanistan','Haiti','Somalia','Sudan','Ethiopia','Nigeria','Kenya',
  'Colombia','Bolivia','Peru','Cambodia','Papua New Guinea','Angola','Zambia',
  'Mozambique','Madagascar','Democratic Republic of Congo','Syria','Yemen',
  'Thailand','Laos','Timor-Leste','Honduras','Guatemala','Nicaragua',
])

const SEVERITY_COLORS = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981'
}

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
  fontSize: 12, borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)',
  background: '#1e293b', color: '#f1f5f9',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
}

export default function DataStory({ events }) {
  const isMobile = useIsMobile()
  const stats = useMemo(() => {
    if (!events.length) return null

    const withCountry = events.filter(e => e.country)
    const developing = withCountry.filter(e => DEVELOPING.has(e.country))
    const developingPct = withCountry.length
      ? Math.round((developing.length / withCountry.length) * 100) : 0

    const catCount = {}
    events.forEach(e => { catCount[e.category] = (catCount[e.category] || 0) + 1 })
    const categoryData = Object.entries(catCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const countryCount = {}
    events.forEach(e => {
      if (e.country) countryCount[e.country] = (countryCount[e.country] || 0) + 1
    })
    const topCountries = Object.entries(countryCount)
      .map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 12) + '…' : name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8)

    const sevCount = { critical: 0, high: 0, medium: 0, low: 0 }
    events.forEach(e => { if (sevCount[e.severity] !== undefined) sevCount[e.severity]++ })
    const severityData = Object.entries(sevCount)
      .map(([name, value]) => ({ name, value })).filter(d => d.value > 0)

    const sourceCount = {}
    events.forEach(e => { sourceCount[e.source] = (sourceCount[e.source] || 0) + 1 })

    const seriousPct = Math.round(((sevCount.critical + sevCount.high) / events.length) * 100)
    const topCat = categoryData[0]?.name || 'fire'
    const topCatPct = Math.round(((catCount[topCat] || 0) / events.length) * 100)

    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const spotlight = [...events]
      .filter(e => e.title && e.description)
      .sort((a, b) => {
        const sd = (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4)
        if (sd !== 0) return sd
        return new Date(b.date) - new Date(a.date)
      })[0] || null

    const narrativeTimeline = [...events]
      .filter(e => e.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6).reverse()

    return {
      developingPct, categoryData, topCountries, severityData,
      seriousPct, topCat, topCatPct,
      total: events.length, withCountryCount: withCountry.length,
      sourceCount, spotlight, narrativeTimeline,
    }
  }, [events])

  if (!stats) return <div style={{ padding: '2rem', color: '#7a8a9e', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(239,68,68,0.08) 60%, rgba(255,255,255,0.02) 100%)',
        borderRadius: 24, padding: '2rem',
        position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(245,158,11,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(245,158,11,0.08)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '30%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(239,68,68,0.06)', filter: 'blur(30px)' }} />
        <p style={{ fontSize: 13, color: '#7a8a9e', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>
          CPE 494 · Humanities Computing · Data Story
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.4, color: '#f1f5f9' }}>
          เบื้องหลังตัวเลข:<br />ภัยพิบัติกับความเหลื่อมล้ำของโลก
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.8, maxWidth: 520, margin: 0 }}>
          จากข้อมูลภัยพิบัติ <strong style={{ color: '#fcd34d' }}>{stats.total} เหตุการณ์</strong> ที่รวบรวมแบบ real-time
          จาก USGS — ตัวเลขเหล่านี้สะท้อนว่า <em style={{ color: '#94a3b8' }}>ใคร</em> ได้รับผลกระทบมากที่สุด
        </p>
      </div>

      {/* Key Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { number: `${stats.developingPct}%`, label: 'เกิดในประเทศกำลังพัฒนา', sub: `จาก ${stats.withCountryCount} เหตุการณ์`, color: '#60a5fa' },
          { number: `${stats.seriousPct}%`, label: 'ระดับ High / Critical', sub: 'ต้องการการตอบสนองเร่งด่วน', color: '#ef4444' },
          { number: `${stats.topCatPct}%`, label: `ประเภท "${stats.topCat}"`, sub: 'พบมากที่สุดในช่วงนี้', color: COLORS[stats.topCat] || '#f59e0b' },
        ].map((item, i) => (
          <div key={i} style={{ ...darkCard, borderTop: `2px solid ${item.color}40`, paddingTop: '1.25rem' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: item.color, lineHeight: 1, marginBottom: 6 }}>{item.number}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#b4bcc8', marginBottom: 3 }}>{item.label}</div>
            <div style={{ fontSize: 13, color: '#6e7d91' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Spotlight */}
      {stats.spotlight && (
        <div style={{
          ...darkCard,
          borderLeft: `2px solid ${SEVERITY_COLORS[stats.spotlight.severity] || '#64748b'}`,
          borderRadius: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: SEVERITY_COLORS[stats.spotlight.severity], marginBottom: 8 }}>
            Event Spotlight · {stats.spotlight.severity?.toUpperCase()}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.5, marginBottom: 8 }}>
            {stats.spotlight.title}
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 15, color: '#94a3b8', lineHeight: 1.7 }}>
            {stats.spotlight.description}
          </p>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#7a8a9e' }}>
            {stats.spotlight.city && <span>📍 {stats.spotlight.city}{stats.spotlight.country ? `, ${stats.spotlight.country}` : ''}</span>}
            {stats.spotlight.date && <span>🗓 {new Date(stats.spotlight.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            <span>📂 {stats.spotlight.category}</span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
        <Card title="ประเภทภัยพิบัติ" sub="จำนวนแยกตามประเภท">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.categoryData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7a8a9e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#7a8a9e' }} axisLine={false} tickLine={false} />
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
                {stats.severityData.map(e => <Cell key={e.name} fill={SEVERITY_COLORS[e.name] || '#64748b'} />)}
              </Pie>
              <Tooltip formatter={(val) => [`${val} เหตุการณ์`]} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Countries */}
      <Card title="ประเทศที่ได้รับผลกระทบมากที่สุด" sub="นับจากจำนวนเหตุการณ์">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.topCountries} layout="vertical" margin={{ top: 0, right: 16, left: 70, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#7a8a9e' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={70} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val) => [`${val} เหตุการณ์`]} contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Narrative Timeline */}
      <Card title="Narrative Timeline" sub="6 เหตุการณ์ล่าสุดเรียงตามลำดับเวลา">
        <div style={{ position: 'relative', paddingLeft: 22 }}>
          <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 1.5, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }} />
          {stats.narrativeTimeline.map((e, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: i < stats.narrativeTimeline.length - 1 ? 18 : 0 }}>
              <div style={{
                position: 'absolute', left: -19, top: 4,
                width: 9, height: 9, borderRadius: '50%',
                background: SEVERITY_COLORS[e.severity] || '#64748b',
                border: '2px solid #0d1117',
                boxShadow: `0 0 8px ${SEVERITY_COLORS[e.severity] || '#64748b'}80`
              }} />
              <div style={{ fontSize: 13, color: '#7a8a9e', marginBottom: 3 }}>
                {e.date ? new Date(e.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                {e.city ? ` · ${e.city}` : ''}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>{e.title}</div>
              <div style={{ fontSize: 14, color: '#6e7d91', lineHeight: 1.6 }}>
                {e.description?.slice(0, 110)}{e.description?.length > 110 ? '…' : ''}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Humanities Analysis */}
      <Card title="บทวิเคราะห์เชิง Humanities" sub="มุมมองจากข้อมูล">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { emoji: '🌏', title: 'ความเหลื่อมล้ำของภัยพิบัติ', text: `${stats.developingPct}% ของเหตุการณ์เกิดในประเทศกำลังพัฒนา สะท้อนว่าประเทศเหล่านี้มักขาดระบบเตือนภัยล่วงหน้า โครงสร้างพื้นฐานที่แข็งแกร่ง และทรัพยากรในการฟื้นฟูหลังเกิดเหตุ` },
            { emoji: '🔥', title: `ทำไม "${stats.topCat}" ถึงพบมากที่สุด`, text: `เหตุการณ์ประเภท ${stats.topCat} คิดเป็น ${stats.topCatPct}% ของทั้งหมด นักวิทยาศาสตร์เชื่อมโยงแนวโน้มนี้กับการเปลี่ยนแปลงสภาพภูมิอากาศที่ทำให้ภัยพิบัติบางประเภทรุนแรงและถี่ขึ้น` },
            { emoji: '🏙️', title: 'มิติของเมืองกับภัยพิบัติ', text: 'ปัญหาระดับเมืองอย่างน้ำท่วมขัง ไฟฟ้าดับ และเส้นทางที่เสียหายจากพายุ ส่งผลกระทบโดยตรงต่อคนในเมืองหลายล้านคน ซึ่งมักไม่ถูกนับในสถิติภัยพิบัติระดับโลก' },
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{p.emoji}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>{p.title}</div>
                <div style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.8 }}>{p.text}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sources */}
      <div style={{ ...darkCard, borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fcd34d', marginBottom: 8 }}>Data Sources & Methodology</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(stats.sourceCount).map(([src, count]) => (
            <div key={src} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#94a3b8' }}>
              <span>{src}</span>
              <span style={{ fontWeight: 600, color: '#64748b' }}>{count} events</span>
            </div>
          ))}
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 13, color: '#7a8a9e', lineHeight: 1.6 }}>
          ข้อมูลดึงแบบ real-time · จัดประเภทด้วย Python · แสดงผลด้วย React + Recharts
        </p>
      </div>

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
        <div style={{ fontSize: 14, color: '#7a8a9e', marginTop: 2 }}>{sub}</div>
      </div>
      {children}
    </div>
  )
}
