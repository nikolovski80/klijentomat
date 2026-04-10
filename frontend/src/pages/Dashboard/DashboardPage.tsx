import { useState, useEffect } from 'react'
import { leadsApi, campaignsApi } from '../../services/api'

interface KpiData {
  totalLeads: number
  activeCampaigns: number
  avgOpenRate: string
  totalReplied: number
}

interface Warning {
  type: 'followup' | 'draft'
  message: string
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KpiData>({
    totalLeads: 0,
    activeCampaigns: 0,
    avgOpenRate: '0%',
    totalReplied: 0,
  })
  const [warnings, setWarnings] = useState<Warning[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Paralelno dohvati leads i campaigns
      const [leadsRes, campaignsRes] = await Promise.allSettled([
        leadsApi.list({ limit: 1 }),
        campaignsApi.list(),
      ])

      let totalLeads = 0
      let totalReplied = 0

      if (leadsRes.status === 'fulfilled') {
        totalLeads = leadsRes.value.data.total ?? 0
      }

      // Replied leadovi
      try {
        const repliedRes = await leadsApi.list({ status: 'replied', limit: 1 })
        totalReplied = repliedRes.data.total ?? 0
      } catch {
        // ignore
      }

      let activeCampaigns = 0
      let avgOpenRate = '0%'
      const newWarnings: Warning[] = []

      if (campaignsRes.status === 'fulfilled') {
        const campaigns = campaignsRes.value.data as Array<{
          id: string
          status: string
          name: string
          followup_days: number
          followup_subject: string | null
        }>

        activeCampaigns = campaigns.filter((c) =>
          c.status === 'active' || c.status === 'scheduled'
        ).length

        // Draft upozorenja
        const drafts = campaigns.filter((c) => c.status === 'draft')
        for (const d of drafts.slice(0, 3)) {
          newWarnings.push({
            type: 'draft',
            message: `Kampanja "${d.name}" je u nacrtu — nije poslata.`,
          })
        }

        // Dohvati statistike za aktivne/završene kampanje
        const finishedOrActive = campaigns.filter(
          (c) => c.status === 'finished' || c.status === 'active'
        )
        if (finishedOrActive.length > 0) {
          const statsResults = await Promise.allSettled(
            finishedOrActive.slice(0, 5).map((c) => campaignsApi.stats(c.id))
          )
          let totalOpen = 0
          let totalSent = 0
          for (const r of statsResults) {
            if (r.status === 'fulfilled') {
              totalOpen += r.value.data.opened_count ?? 0
              totalSent += r.value.data.sent_count ?? 0
            }
          }
          if (totalSent > 0) {
            avgOpenRate = `${Math.round((totalOpen / totalSent) * 100)}%`
          }
        }
      }

      setKpi({ totalLeads, activeCampaigns, avgOpenRate, totalReplied })
      setWarnings(newWarnings)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const kpiCards = [
    { label: 'Ukupno kontakata', val: loading ? '...' : String(kpi.totalLeads), color: 'text-blue-400' },
    { label: 'Aktivne kampanje', val: loading ? '...' : String(kpi.activeCampaigns), color: 'text-brand-500' },
    { label: 'Open rate', val: loading ? '...' : kpi.avgOpenRate, color: 'text-green-400' },
    { label: 'Odgovori', val: loading ? '...' : String(kpi.totalReplied), color: 'text-purple-400' },
  ]

  return (
    <div className="p-8">
      <div className="text-lg font-semibold mb-6">Pregled</div>

      {/* KPI kartice */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpiCards.map((s, i) => (
          <div key={i} className="bg-panel border border-slate-800 rounded-xl p-5">
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upozorenja */}
      <div className="bg-panel border border-slate-800 rounded-xl p-5">
        <div className="text-xs text-slate-500 mb-3 tracking-wider uppercase">Upozorenja</div>
        {loading ? (
          <div className="text-sm text-slate-600">Ucitavanje...</div>
        ) : warnings.length === 0 ? (
          <div className="text-sm text-slate-500">Nema upozorenja. Dobro uradjeno!</div>
        ) : (
          <ul className="space-y-2">
            {warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-yellow-500">
                  {w.type === 'draft' ? '!' : '!'}
                </span>
                <span className="text-slate-300">{w.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
