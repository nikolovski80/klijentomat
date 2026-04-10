import { useState, useEffect } from 'react'
import { campaignsApi } from '../../services/api'

type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'finished'

interface Campaign {
  id: string
  name: string
  subject: string
  body_html: string
  from_email: string
  from_name: string
  status: CampaignStatus
  industry_target: string | null
  followup_days: number
  followup_subject: string | null
  followup_html: string | null
  created_at: string
}

interface CampaignStats {
  campaign_id: string
  sent_count: number
  opened_count: number
  clicked_count: number
  open_rate: number
  click_rate: number
}

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Nacrt',
  scheduled: 'Zakazano',
  active: 'Aktivna',
  paused: 'Pauzirana',
  finished: 'Zavrsena',
}

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-slate-700 text-slate-300',
  scheduled: 'bg-blue-900 text-blue-200',
  active: 'bg-yellow-900 text-yellow-200',
  paused: 'bg-orange-900 text-orange-200',
  finished: 'bg-green-900 text-green-200',
}

export default function KomercijalistaPage() {
  const [activeTab, setActiveTab] = useState<'kampanje' | 'nova' | 'statistike'>('kampanje')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)

  // Nova kampanja forma
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body_html: '',
    from_email: '',
    from_name: '',
    industry_target: '',
    followup_days: 3,
    followup_subject: '',
    followup_html: '',
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // AI Write forma
  const [aiIndustry, setAiIndustry] = useState('')
  const [aiTone, setAiTone] = useState('formalan')

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const res = await campaignsApi.list()
      setCampaigns(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  const handleSend = async (id: string) => {
    setSendingId(id)
    try {
      await campaignsApi.send(id)
      await loadCampaigns()
    } catch {
      // ignore
    } finally {
      setSendingId(null)
    }
  }

  const handleViewStats = async (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setActiveTab('statistike')
    try {
      const res = await campaignsApi.stats(campaign.id)
      setStats(res.data)
    } catch {
      setStats(null)
    }
  }

  const handleAiWrite = async () => {
    if (!aiIndustry) return
    setAiLoading(true)
    try {
      const res = await campaignsApi.aiWrite({
        industry: aiIndustry,
        tone: aiTone,
      })
      setForm((prev) => ({
        ...prev,
        subject: res.data.subject,
        body_html: res.data.body_html,
      }))
    } catch {
      // ignore
    } finally {
      setAiLoading(false)
    }
  }

  const handleSaveCampaign = async () => {
    if (!form.name || !form.subject || !form.body_html || !form.from_email || !form.from_name) return
    setSaving(true)
    try {
      await campaignsApi.create({
        ...form,
        industry_target: form.industry_target || undefined,
        followup_subject: form.followup_subject || undefined,
        followup_html: form.followup_html || undefined,
      })
      await loadCampaigns()
      setActiveTab('kampanje')
      setForm({
        name: '', subject: '', body_html: '', from_email: '',
        from_name: '', industry_target: '', followup_days: 3,
        followup_subject: '', followup_html: '',
      })
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const pct = (n: number) => `${Math.round(n * 100)}%`

  return (
    <div className="p-8">
      <div className="text-lg font-semibold mb-1">Komercijalista</div>
      <div className="text-sm text-slate-500 mb-6">Kampanje, AI pisanje, follow-up</div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-800">
        {(['kampanje', 'nova', 'statistike'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'kampanje' ? 'Kampanje' : tab === 'nova' ? 'Nova kampanja' : 'Statistike'}
          </button>
        ))}
      </div>

      {/* Tab: Kampanje */}
      {activeTab === 'kampanje' && (
        <div>
          {loading && (
            <div className="text-sm text-slate-500 py-8 text-center">Ucitavanje...</div>
          )}
          {!loading && campaigns.length === 0 && (
            <div className="bg-panel border border-slate-800 rounded-xl p-8 text-center">
              <div className="text-slate-500 text-sm mb-3">Nema kampanja.</div>
              <button
                onClick={() => setActiveTab('nova')}
                className="bg-brand-600 hover:bg-brand-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Kreiraj prvu kampanju
              </button>
            </div>
          )}
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-panel border border-slate-800 rounded-xl p-5 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-100 truncate">{campaign.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{campaign.subject}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Od: {campaign.from_name} &lt;{campaign.from_email}&gt;
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${STATUS_COLORS[campaign.status]}`}
                >
                  {STATUS_LABELS[campaign.status]}
                </span>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleViewStats(campaign)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    Statistike
                  </button>
                  {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                    <button
                      onClick={() => handleSend(campaign.id)}
                      disabled={sendingId === campaign.id}
                      className="px-3 py-1.5 text-xs rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white transition-colors"
                    >
                      {sendingId === campaign.id ? 'Saljem...' : 'Posalji'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Nova kampanja */}
      {activeTab === 'nova' && (
        <div className="max-w-2xl space-y-6">
          {/* AI Write */}
          <div className="bg-panel border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">
              AI pisanje
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Delatnost</label>
                <input
                  type="text"
                  value={aiIndustry}
                  onChange={(e) => setAiIndustry(e.target.value)}
                  placeholder="npr. automehanicari, frizerski saloni..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ton</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                >
                  <option value="formalan">Formalan</option>
                  <option value="prijatan">Prijatan</option>
                  <option value="ubedljiv">Ubedljiv</option>
                </select>
              </div>
              <button
                onClick={handleAiWrite}
                disabled={aiLoading || !aiIndustry}
                className="px-4 py-2 text-sm rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white transition-colors"
              >
                {aiLoading ? 'Generisuem...' : 'AI napisi'}
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-panel border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
              Podaci kampanje
            </div>
            {[
              { label: 'Naziv kampanje', key: 'name', placeholder: 'npr. Jesen 2026 promo' },
              { label: 'Predmet (subject)', key: 'subject', placeholder: 'npr. Posebna ponuda za Vas' },
              { label: 'Email posaljaoca', key: 'from_email', placeholder: 'vas@firma.rs' },
              { label: 'Ime posaljaoca', key: 'from_name', placeholder: 'Vasa Firma d.o.o.' },
              { label: 'Ciljna delatnost', key: 'industry_target', placeholder: 'npr. automehanicari (opciono)' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-slate-500 mb-1">{label}</label>
                <input
                  type="text"
                  value={(form as Record<string, unknown>)[key] as string}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs text-slate-500 mb-1">Sadrzaj emaila (HTML)</label>
              <textarea
                value={form.body_html}
                onChange={(e) => setForm((prev) => ({ ...prev, body_html: e.target.value }))}
                rows={8}
                placeholder="<p>Postovani...</p>"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Follow-up nakon (dana)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={form.followup_days}
                onChange={(e) => setForm((prev) => ({ ...prev, followup_days: Number(e.target.value) }))}
                className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            {form.followup_days > 0 && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Follow-up predmet</label>
                <input
                  type="text"
                  value={form.followup_subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, followup_subject: e.target.value }))}
                  placeholder="Podsetnik: nasa ponuda..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            <button
              onClick={handleSaveCampaign}
              disabled={saving || !form.name || !form.subject || !form.body_html || !form.from_email || !form.from_name}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {saving ? 'Cuva se...' : 'Sacuvaj kampanju'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Statistike */}
      {activeTab === 'statistike' && (
        <div>
          {!selectedCampaign ? (
            <div className="text-sm text-slate-500 py-8 text-center">
              Izaberite kampanju klikom na "Statistike" u listi kampanja.
            </div>
          ) : (
            <div className="max-w-2xl">
              <div className="mb-4">
                <div className="text-base font-semibold text-slate-100">{selectedCampaign.name}</div>
                <div className="text-xs text-slate-500">{selectedCampaign.subject}</div>
              </div>
              {!stats ? (
                <div className="text-sm text-slate-500">Ucitavanje statistika...</div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-panel border border-slate-800 rounded-xl p-5">
                    <div className="text-2xl font-bold text-blue-400">{stats.sent_count}</div>
                    <div className="text-xs text-slate-500 mt-1">Poslato</div>
                  </div>
                  <div className="bg-panel border border-slate-800 rounded-xl p-5">
                    <div className="text-2xl font-bold text-yellow-400">
                      {pct(stats.open_rate)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Open rate ({stats.opened_count})
                    </div>
                  </div>
                  <div className="bg-panel border border-slate-800 rounded-xl p-5">
                    <div className="text-2xl font-bold text-green-400">
                      {pct(stats.click_rate)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Click rate ({stats.clicked_count})
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
