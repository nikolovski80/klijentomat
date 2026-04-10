import { useState, useEffect, useRef } from 'react'
import { leadsApi } from '../../services/api'

type LeadStatus = 'new' | 'sent' | 'opened' | 'replied' | 'followup' | 'no_response' | 'converted'

interface Lead {
  id: string
  company_name: string
  email: string | null
  phone: string | null
  city: string | null
  industry: string | null
  website: string | null
  status: LeadStatus
  source: string | null
  created_at: string
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Novo',
  sent: 'Poslato',
  opened: 'Otvoreno',
  replied: 'Odgovoreno',
  followup: 'Follow-up',
  no_response: 'Bez odgovora',
  converted: 'Konvertovano',
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-slate-700 text-slate-200',
  sent: 'bg-blue-900 text-blue-200',
  opened: 'bg-yellow-900 text-yellow-200',
  replied: 'bg-green-900 text-green-200',
  followup: 'bg-purple-900 text-purple-200',
  no_response: 'bg-red-900 text-red-200',
  converted: 'bg-emerald-900 text-emerald-200',
}

export default function TehnicarPage() {
  const [activeTab, setActiveTab] = useState<'pretraga' | 'kontakti'>('pretraga')

  // Scrape form
  const [address, setAddress] = useState('')
  const [radius, setRadius] = useState(5000)
  const [industry, setIndustry] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeStatus, setScrapeStatus] = useState<{ status: string; count: number; error?: string } | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Leads list
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [skip, setSkip] = useState(0)
  const limit = 50

  // Load leads
  const loadLeads = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { skip, limit }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await leadsApi.list(params)
      setLeads(res.data.items)
      setTotal(res.data.total)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'kontakti') loadLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, statusFilter, skip])

  // Start scrape
  const handleScrape = async () => {
    if (!address || !industry) return
    setScraping(true)
    setScrapeStatus({ status: 'queued', count: 0 })
    try {
      const res = await leadsApi.scrape({ address, radius, industry })
      const taskId = res.data.task_id
      // Poll status
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await leadsApi.scrapeStatus(taskId)
          const s = statusRes.data
          setScrapeStatus(s)
          if (s.status === 'done' || s.status === 'error') {
            clearInterval(pollRef.current!)
            setScraping(false)
            if (s.status === 'done') {
              setActiveTab('kontakti')
              loadLeads()
            }
          }
        } catch {
          clearInterval(pollRef.current!)
          setScraping(false)
        }
      }, 2000)
    } catch {
      setScraping(false)
      setScrapeStatus({ status: 'error', count: 0, error: 'Greška pri pokretanju pretrage' })
    }
  }

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    try {
      await leadsApi.updateStatus(leadId, status)
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)))
    } catch {
      // ignore
    }
  }

  return (
    <div className="p-8">
      <div className="text-lg font-semibold mb-1">Tehnicar</div>
      <div className="text-sm text-slate-500 mb-6">Trazi firme po lokaciji i delatnosti</div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-800">
        {(['pretraga', 'kontakti'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'pretraga' ? 'Pretraga' : 'Kontakti'}
          </button>
        ))}
      </div>

      {/* Tab: Pretraga */}
      {activeTab === 'pretraga' && (
        <div className="max-w-xl">
          <div className="bg-panel border border-slate-800 rounded-xl p-6 space-y-5">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Adresa / Grad</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="npr. Beograd, Novi Sad..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Radius: <span className="text-brand-400">{(radius / 1000).toFixed(1)} km</span>
              </label>
              <input
                type="range"
                min={500}
                max={10000}
                step={500}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>0.5 km</span>
                <span>10 km</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Delatnost</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="npr. automehanicari, frizerski salon..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              onClick={handleScrape}
              disabled={scraping || !address || !industry}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {scraping ? 'Pretraga u toku...' : 'Pokreni pretragu'}
            </button>

            {/* Status */}
            {scrapeStatus && (
              <div
                className={`rounded-lg p-4 text-sm ${
                  scrapeStatus.status === 'error'
                    ? 'bg-red-900/30 border border-red-800 text-red-300'
                    : scrapeStatus.status === 'done'
                    ? 'bg-green-900/30 border border-green-800 text-green-300'
                    : 'bg-blue-900/30 border border-blue-800 text-blue-300'
                }`}
              >
                {scrapeStatus.status === 'queued' && 'Pretraga je u redu cekanja...'}
                {scrapeStatus.status === 'running' && 'Pretrazujem Google Places...'}
                {scrapeStatus.status === 'done' &&
                  `Zavrseno! Pronadjeno ${scrapeStatus.count} novih kontakata.`}
                {scrapeStatus.status === 'error' &&
                  `Greska: ${scrapeStatus.error || 'Nepoznata greska'}`}

                {scraping && (
                  <div className="mt-2 h-1.5 bg-blue-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full animate-pulse w-2/3" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Kontakti */}
      {activeTab === 'kontakti' && (
        <div>
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Pretrazi po nazivu..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSkip(0) }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setSkip(0) }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            >
              <option value="">Svi statusi</option>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <span className="ml-auto text-xs text-slate-500 flex items-center">
              Ukupno: {total}
            </span>
          </div>

          {/* Table */}
          <div className="bg-panel border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Naziv firme</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Telefon</th>
                    <th className="px-4 py-3 text-left">Grad</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Akcija</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-xs">
                        Ucitavanje...
                      </td>
                    </tr>
                  )}
                  {!loading && leads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-xs">
                        Nema kontakata. Pokrenite pretragu ili uvezite CSV.
                      </td>
                    </tr>
                  )}
                  {!loading && leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-100">
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-brand-400 transition-colors"
                          >
                            {lead.company_name}
                          </a>
                        ) : (
                          lead.company_name
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {lead.email || <span className="text-slate-700">-</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {lead.phone || <span className="text-slate-700">-</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {lead.city || <span className="text-slate-700">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[lead.status]}`}
                        >
                          {STATUS_LABELS[lead.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                        >
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="px-4 py-3 border-t border-slate-800 flex items-center gap-3">
                <button
                  onClick={() => setSkip(Math.max(0, skip - limit))}
                  disabled={skip === 0}
                  className="px-3 py-1 text-xs rounded bg-slate-800 text-slate-400 disabled:opacity-40 hover:bg-slate-700"
                >
                  Prethodna
                </button>
                <span className="text-xs text-slate-500">
                  {skip + 1}–{Math.min(skip + limit, total)} od {total}
                </span>
                <button
                  onClick={() => setSkip(skip + limit)}
                  disabled={skip + limit >= total}
                  className="px-3 py-1 text-xs rounded bg-slate-800 text-slate-400 disabled:opacity-40 hover:bg-slate-700"
                >
                  Sledeca
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
