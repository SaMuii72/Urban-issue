import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORS = {
  fire: '#ef4444', earthquake: '#8b5cf6', storm: '#0ea5e9',
  flood: '#3b82f6', landslide: '#92400e', volcano: '#dc2626',
  drought: '#ca8a04', other: '#94a3b8',
}

const DEVELOPING = new Set([
  'Philippines','Indonesia','Myanmar','Vietnam','Bangladesh','India','Pakistan',
  'Nepal','Afghanistan','Haiti','Somalia','Sudan','Ethiopia','Nigeria','Kenya',
  'Colombia','Bolivia','Peru','Cambodia','Papua New Guinea','Angola','Zambia',
  'Mozambique','Madagascar','Democratic Republic of Congo','Syria','Yemen',
  'Thailand','Laos','Timor-Leste','Honduras','Guatemala','Nicaragua',
])

const SEVERITY_COLORS = {
  critical: '#dc2626', high: '#f97316', medium: '#f59e0b', low: '#22c55e'
}

const glassCard = {
  background: 'rgba(255,255,255,0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(226,232,240,0.8)',
  borderRadius: 20,
  padding: '1.25rem',
  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
}

const tooltipStyle = { fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }

export default function DataStory({ events }) {
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

  if (!stats) return <div style={{ padding: '2rem', color: '#64748b', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 20, padding: '1.75rem 2rem', color: 'white',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(15,23,42,0.2)',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(99,102,241,0.15)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '30%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(14,165,233,0.1)' }} />
        <p style={{ fontSize: 11, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>
          CPE 494 · Humanities Computing · Data Story
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 10px', lineHeight: 1.4 }}>
          เบื้องหลังตัวเลข:<br />ภัยพิบัติกับความเหลื่อมล้ำของโลก
        </h1>
        <p style={{ opacity: 0.6, fontSize: 13, lineHeight: 1.8, maxWidth: 520, margin: 0 }}>
          จากข้อมูลภัยพิบัติ <strong style={{ color: 'white', opacity: 1 }}>{stats.total} เหตุการณ์</strong> ที่รวบรวมแบบ real-time
          จาก USGS — ตัวเลขเหล่านี้สะท้อนว่า <em>ใคร</em> ได้รับผลกระทบมากที่สุด
        </p>
      </div>

      {/* Key Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { number: `${stats.developingPct}%`, label: 'เกิดในประเทศกำลังพัฒนา', sub: `จาก ${stats.withCountryCount} เหตุการณ์`, color: '#3b82f6' },
          { number: `${stats.seriousPct}%`, label: 'ระดับ High / Critical', sub: 'ต้องการการตอบสนองเร่งด่วน', color: '#ef4444' },
          { number: `${stats.topCatPct}%`, label: `ประเภท "${stats.topCat}"`, sub: 'พบมากที่สุดในช่วงนี้', color: COLORS[stats.topCat] || '#f97316' },
        ].map((item, i) => (
          <div key={i} style={{ ...glassCard, borderTop: `3px solid ${item.color}` }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: item.color, lineHeight: 1, marginBottom: 6 }}>{item.number}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#1e293b', marginBottom: 3 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Spotlight */}
      {stats.spotlight && (
        <div style={{
          ...glassCard,
          borderLeft: `3px solid ${SEVERITY_COLORS[stats.spotlight.severity] || '#94a3b8'}`,
          borderRadius: 20,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: SEVERITY_COLORS[stats.spotlight.severity], marginBottom: 8 }}>
            Event Spotlight · {stats.spotlight.severity?.toUpperCase()}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.5, marginBottom: 8 }}>
            {stats.spotlight.title}
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#475569', lineHeight: 1.7 }}>
            {stats.spotlight.description}
          </p>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8' }}>
            {stats.spotlight.city && <span>📍 {stats.spotlight.city}{stats.spotlight.country ? `, ${stats.spotlight.country}` : ''}</span>}
            {stats.spotlight.date && <span>🗓 {new Date(stats.spotlight.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            <span>📂 {stats.spotlight.category}</span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card title="ประเภทภัยพิบัติ" sub="จำนวนแยกตามประเภท">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.categoryData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val) => [`${val} เหตุการณ์`]} contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {stats.categoryData.map(e => <Cell key={e.name} fill={COLORS[e.name] || '#94a3b8'} />)}
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
                {stats.severityData.map(e => <Cell key={e.name} fill={SEVERITY_COLORS[e.name] || '#94a3b8'} />)}
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
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={70} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val) => [`${val} เหตุการณ์`]} contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Narrative Timeline */}
      <Card title="Narrative Timeline" sub="6 เหตุการณ์ล่าสุดเรียงตามลำดับเวลา">
        <div style={{ position: 'relative', paddingLeft: 22 }}>
          <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 1.5, background: '#e2e8f0', borderRadius: 2 }} />
          {stats.narrativeTimeline.map((e, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: i < stats.narrativeTimeline.length - 1 ? 18 : 0 }}>
              <div style={{
                position: 'absolute', left: -19, top: 4,
                width: 9, height: 9, borderRadius: '50%',
                background: SEVERITY_COLORS[e.severity] || '#94a3b8',
                border: '2px solid white', boxShadow: '0 0 0 1.5px #e2e8f0'
              }} />
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>
                {e.date ? new Date(e.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                {e.city ? ` · ${e.city}` : ''}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{e.title}</div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
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
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{p.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 3 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.75 }}>{p.text}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sources */}
      <div style={{ ...glassCard, background: 'rgba(239,246,255,0.7)', borderColor: 'rgba(191,219,254,0.8)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>Data Sources & Methodology</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(stats.sourceCount).map(([src, count]) => (
            <div key={src} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#3730a3' }}>
              <span>{src}</span>
              <span style={{ fontWeight: 500 }}>{count} events</span>
            </div>
          ))}
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 11, color: '#3730a3', lineHeight: 1.6, opacity: 0.8 }}>
          ข้อมูลดึงแบบ real-time · จัดประเภทด้วย Python · แสดงผลด้วย React + Recharts
        </p>
      </div>

    </div>
  )
}

function Card({ title, sub, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(226,232,240,0.8)',
      borderRadius: 20,
      padding: '1.25rem',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
      </div>
      {children}
    </div>
  )
}
