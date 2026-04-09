import { useEffect, useState, useCallback } from 'react'
import { knowledgeApi } from '../../services/api'
import { Brain, Building2, DollarSign, Palette, HelpCircle, Package, Save, Plus, Trash2, Loader2 } from 'lucide-react'

// ─── Tipovi ───────────────────────────────────────────────
interface KnowledgeItem {
  id: string
  category: string
  key: string
  value: string
  updated_at: string
}

type CategoryMap = Record<string, KnowledgeItem[]>

// ─── Kategorije i njihovi podrazumevani ključevi ──────────
const CATEGORIES = [
  {
    id: 'firma',
    label: 'O Firmi',
    icon: Building2,
    fields: [
      { key: 'naziv', label: 'Naziv firme', type: 'text' },
      { key: 'opis', label: 'Kratki opis', type: 'textarea' },
      { key: 'telefon', label: 'Telefon', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'adresa', label: 'Adresa', type: 'text' },
      { key: 'grad', label: 'Grad', type: 'text' },
      { key: 'website', label: 'Website', type: 'text' },
      { key: 'pib', label: 'PIB', type: 'text' },
    ],
  },
  {
    id: 'branding',
    label: 'Branding',
    icon: Palette,
    fields: [
      { key: 'slogan', label: 'Slogan', type: 'text' },
      { key: 'ton_komunikacije', label: 'Ton komunikacije', type: 'textarea' },
      { key: 'vrednosti', label: 'Vrednosti firme', type: 'textarea' },
      { key: 'ciljna_grupa', label: 'Ciljna grupa', type: 'textarea' },
    ],
  },
  {
    id: 'cenovnik',
    label: 'Cenovnik',
    icon: DollarSign,
    fields: [],
    dynamic: true,
  },
  {
    id: 'ponuda',
    label: 'Usluge / Proizvodi',
    icon: Package,
    fields: [],
    dynamic: true,
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: HelpCircle,
    fields: [],
    dynamic: true,
  },
] as const

// ─── Helper ───────────────────────────────────────────────
function itemsToMap(items: KnowledgeItem[]): Record<string, string> {
  const m: Record<string, string> = {}
  items.forEach((i) => { m[i.key] = i.value })
  return m
}

// ─── Statički tab (firma, branding) ──────────────────────
function StaticCategoryTab({
  catId,
  fields,
  data,
  onSave,
}: {
  catId: string
  fields: readonly { key: string; label: string; type: string }[]
  data: Record<string, string>
  onSave: (catId: string, items: { key: string; value: string }[]) => Promise<void>
}) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const init: Record<string, string> = {}
    fields.forEach((f) => { init[f.key] = data[f.key] ?? '' })
    setForm(init)
  }, [data, fields])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const items = Object.entries(form)
      .filter(([, v]) => v.trim() !== '')
      .map(([key, value]) => ({ key, value }))
    await onSave(catId, items)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
          {f.type === 'textarea' ? (
            <textarea
              value={form[f.key] ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              rows={3}
              className="w-full bg-dark border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 resize-none"
            />
          ) : (
            <input
              type="text"
              value={form[f.key] ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="w-full bg-dark border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {saved ? 'Sačuvano!' : 'Sačuvaj'}
      </button>
    </form>
  )
}

// ─── Dinamički tab (cenovnik, usluge, faq) ────────────────
function DynamicCategoryTab({
  catId,
  items,
  onSave,
}: {
  catId: string
  items: KnowledgeItem[]
  onSave: (catId: string, rows: { key: string; value: string }[]) => Promise<void>
}) {
  const [rows, setRows] = useState<{ key: string; value: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setRows(items.length > 0 ? items.map((i) => ({ key: i.key, value: i.value })) : [{ key: '', value: '' }])
  }, [items])

  const addRow = () => setRows((r) => [...r, { key: '', value: '' }])
  const removeRow = (idx: number) => setRows((r) => r.filter((_, i) => i !== idx))
  const update = (idx: number, field: 'key' | 'value', val: string) =>
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, [field]: val } : row)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const valid = rows.filter((r) => r.key.trim() && r.value.trim())
    await onSave(catId, valid)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const keyLabel = catId === 'faq' ? 'Pitanje' : 'Naziv'
  const valLabel = catId === 'faq' ? 'Odgovor' : catId === 'cenovnik' ? 'Cena' : 'Opis'

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-2xl">
      <div className="grid grid-cols-[1fr_1fr_32px] gap-2 text-xs text-slate-500 px-1">
        <span>{keyLabel}</span><span>{valLabel}</span><span />
      </div>
      {rows.map((row, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
          <input
            type="text"
            value={row.key}
            placeholder={keyLabel}
            onChange={(e) => update(idx, 'key', e.target.value)}
            className="bg-dark border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
          />
          <input
            type="text"
            value={row.value}
            placeholder={valLabel}
            onChange={(e) => update(idx, 'value', e.target.value)}
            className="bg-dark border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
          />
          <button
            type="button"
            onClick={() => removeRow(idx)}
            className="text-slate-600 hover:text-red-400 transition"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition"
        >
          <Plus size={13} /> Dodaj red
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? 'Sačuvano!' : 'Sačuvaj'}
        </button>
      </div>
    </form>
  )
}

// ─── Glavni page ──────────────────────────────────────────
export default function MozakPage() {
  const [activeTab, setActiveTab] = useState('firma')
  const [categoryData, setCategoryData] = useState<CategoryMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await knowledgeApi.get()
      setCategoryData(res.data.categories ?? {})
    } catch {
      setError('Greška pri učitavanju baze znanja.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (catId: string, items: { key: string; value: string }[]) => {
    await knowledgeApi.update(catId, { items })
    // Osvježi samo tu kategoriju lokalno
    const res = await knowledgeApi.get()
    setCategoryData(res.data.categories ?? {})
  }

  const activeCat = CATEGORIES.find((c) => c.id === activeTab)!

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <Brain size={20} className="text-brand-500" />
        <span className="text-lg font-semibold">Mozak Firme</span>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Baza znanja — sve što AI radnici treba da znaju o vašoj firmi
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-800">
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-all -mb-px ${
              activeTab === id
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-panel border border-slate-800 rounded-xl p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Učitavanje...
          </div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : activeCat && 'dynamic' in activeCat && activeCat.dynamic ? (
          <DynamicCategoryTab
            catId={activeTab}
            items={categoryData[activeTab] ?? []}
            onSave={handleSave}
          />
        ) : (
          <StaticCategoryTab
            catId={activeTab}
            fields={'fields' in activeCat ? activeCat.fields : []}
            data={itemsToMap(categoryData[activeTab] ?? [])}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  )
}
