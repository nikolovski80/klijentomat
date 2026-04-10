import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Palette,
  Package,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Zap,
} from 'lucide-react'
import { knowledgeApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'

// ─── Tipovi ───────────────────────────────────────────────
interface KVRow { key: string; value: string }

interface WizardData {
  firma: Record<string, string>
  branding: Record<string, string>
  usluge: KVRow[]
  faq: KVRow[]
}

// ─── Definicija koraka ────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Firma',    icon: Building2,    title: 'Osnovni podaci o firmi',       subtitle: 'Popunite kontakt informacije i opis vaše firme.' },
  { id: 2, label: 'Branding', icon: Palette,      title: 'Glas i identitet',             subtitle: 'Kako vaša firma komunicira s kupcima?' },
  { id: 3, label: 'Usluge',   icon: Package,      title: 'Usluge i cenovnik',            subtitle: 'Navedite šta nudite i po kojim cenama.' },
  { id: 4, label: 'FAQ',      icon: HelpCircle,   title: 'Najčešća pitanja',             subtitle: 'Pripremite odgovore koje AI radnici treba da znaju.' },
  { id: 5, label: 'Završetak', icon: CheckCircle2, title: 'Sve je podešeno!',            subtitle: 'Vaš AI tim je spreman za rad.' },
]

// ─── Shared input stilovi ─────────────────────────────────
const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition placeholder-slate-600'
const textareaCls = inputCls + ' resize-none'

// ─── Korak 1 — Firma ─────────────────────────────────────
function StepFirma({ data, onChange }: {
  data: Record<string, string>
  onChange: (key: string, val: string) => void
}) {
  const fields = [
    { key: 'naziv',    label: 'Naziv firme *',   type: 'text',     span: 2 },
    { key: 'opis',     label: 'Kratki opis',      type: 'textarea', span: 2 },
    { key: 'telefon',  label: 'Telefon',          type: 'text',     span: 1 },
    { key: 'email',    label: 'Email',            type: 'email',    span: 1 },
    { key: 'adresa',   label: 'Adresa',           type: 'text',     span: 1 },
    { key: 'grad',     label: 'Grad',             type: 'text',     span: 1 },
    { key: 'website',  label: 'Website',          type: 'text',     span: 2 },
  ] as const

  return (
    <div className="grid grid-cols-2 gap-4">
      {fields.map((f) => (
        <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
          <label className="block text-xs text-slate-400 mb-1.5">{f.label}</label>
          {f.type === 'textarea' ? (
            <textarea
              rows={3}
              value={data[f.key] ?? ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={`Npr. "${f.key === 'opis' ? 'Bavimo se servisom automobila od 2010. godine.' : ''}"`}
              className={textareaCls}
            />
          ) : (
            <input
              type={f.type}
              value={data[f.key] ?? ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              className={inputCls}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Korak 2 — Branding ──────────────────────────────────
function StepBranding({ data, onChange }: {
  data: Record<string, string>
  onChange: (key: string, val: string) => void
}) {
  const TONOVI = ['Profesionalan', 'Prijatan i opušten', 'Energičan i moderan', 'Stručan i direktan']

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Slogan</label>
        <input
          type="text"
          value={data.slogan ?? ''}
          onChange={(e) => onChange('slogan', e.target.value)}
          placeholder="Npr. Vaš auto, naša briga."
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Ton komunikacije</label>
        <div className="grid grid-cols-2 gap-2">
          {TONOVI.map((ton) => (
            <button
              key={ton}
              type="button"
              onClick={() => onChange('ton_komunikacije', ton)}
              className={`px-4 py-2.5 rounded-lg text-sm border transition text-left ${
                data.ton_komunikacije === ton
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {ton}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Vrednosti firme</label>
        <textarea
          rows={2}
          value={data.vrednosti ?? ''}
          onChange={(e) => onChange('vrednosti', e.target.value)}
          placeholder="Npr. Pouzdanost, brzina, transparentnost."
          className={textareaCls}
        />
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Ko su vaši kupci?</label>
        <textarea
          rows={2}
          value={data.ciljna_grupa ?? ''}
          onChange={(e) => onChange('ciljna_grupa', e.target.value)}
          placeholder="Npr. Vlasnici automobila u Beogradu, starosti 25–55 godina."
          className={textareaCls}
        />
      </div>
    </div>
  )
}

// ─── Korak 3 — Usluge & Cenovnik ─────────────────────────
function StepUsluge({ rows, onChange }: { rows: KVRow[]; onChange: (rows: KVRow[]) => void }) {
  const add = () => onChange([...rows, { key: '', value: '' }])
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const update = (i: number, field: 'key' | 'value', val: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_1fr_32px] gap-2 text-xs text-slate-500 px-1">
        <span>Naziv usluge / proizvoda</span>
        <span>Cena ili opis</span>
        <span />
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
          <input
            type="text"
            value={row.key}
            placeholder="Npr. Zamena ulja"
            onChange={(e) => update(i, 'key', e.target.value)}
            className={inputCls}
          />
          <input
            type="text"
            value={row.value}
            placeholder="Npr. 3.500 din"
            onChange={(e) => update(i, 'value', e.target.value)}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-slate-600 hover:text-red-400 transition flex items-center justify-center"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-500 transition mt-1"
      >
        <Plus size={13} /> Dodaj uslugu
      </button>
    </div>
  )
}

// ─── Korak 4 — FAQ ────────────────────────────────────────
function StepFaq({ rows, onChange }: { rows: KVRow[]; onChange: (rows: KVRow[]) => void }) {
  const add = () => onChange([...rows, { key: '', value: '' }])
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const update = (i: number, field: 'key' | 'value', val: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_1fr_32px] gap-2 text-xs text-slate-500 px-1">
        <span>Pitanje</span>
        <span>Odgovor</span>
        <span />
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-start">
          <textarea
            rows={2}
            value={row.key}
            placeholder="Npr. Da li dajete garanciju?"
            onChange={(e) => update(i, 'key', e.target.value)}
            className={textareaCls}
          />
          <textarea
            rows={2}
            value={row.value}
            placeholder="Npr. Da, dajemo 6 meseci garancije na sve radove."
            onChange={(e) => update(i, 'value', e.target.value)}
            className={textareaCls}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-slate-600 hover:text-red-400 transition mt-2"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-500 transition"
      >
        <Plus size={13} /> Dodaj pitanje
      </button>
    </div>
  )
}

// ─── Korak 5 — Završetak ─────────────────────────────────
function StepFinish({ data }: { data: WizardData }) {
  const summaryItems = [
    { label: 'Firma',   value: data.firma.naziv || '—' },
    { label: 'Slogan',  value: data.branding.slogan || '—' },
    { label: 'Ton',     value: data.branding.ton_komunikacije || '—' },
    { label: 'Usluge',  value: `${data.usluge.filter(r => r.key).length} stavki` },
    { label: 'FAQ',     value: `${data.faq.filter(r => r.key).length} pitanja` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-brand-500" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Zap size={12} className="text-white" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800">
        {summaryItems.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-5 py-3">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-sm text-slate-200 font-medium">{value}</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-400 text-center leading-relaxed">
        Vaši AI radnici su naučili sve o firmi.<br />
        Možete uvek ažurirati podatke u{' '}
        <span className="text-brand-500">Mozak Firme</span>.
      </p>
    </div>
  )
}

// ─── Glavni Wizard ────────────────────────────────────────
export default function OnboardingWizard() {
  const navigate = useNavigate()
  const { setOnboardingDone } = useAuthStore()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<WizardData>({
    firma: {},
    branding: {},
    usluge: [{ key: '', value: '' }],
    faq: [{ key: '', value: '' }],
  })

  const updateFirma = (key: string, val: string) =>
    setData((d) => ({ ...d, firma: { ...d.firma, [key]: val } }))

  const updateBranding = (key: string, val: string) =>
    setData((d) => ({ ...d, branding: { ...d.branding, [key]: val } }))

  const current = STEPS[step - 1]

  // Validacija minimalnih polja
  const canProceed = () => {
    if (step === 1) return !!data.firma.naziv?.trim()
    return true
  }

  // Snimanje kategorije na API
  const saveCategory = async (category: string, items: { key: string; value: string }[]) => {
    const valid = items.filter((i) => i.key.trim() && i.value.trim())
    if (valid.length === 0) return
    await knowledgeApi.update(category, { items: valid })
  }

  const handleNext = async () => {
    if (step === STEPS.length) {
      // Poslednji korak — sve sačuvano, završi
      setOnboardingDone(true)
      navigate('/')
      return
    }

    setSaving(true)
    setError(null)
    try {
      // Sačuvaj trenutni korak
      if (step === 1) {
        await saveCategory(
          'firma',
          Object.entries(data.firma).map(([key, value]) => ({ key, value })),
        )
      } else if (step === 2) {
        await saveCategory(
          'branding',
          Object.entries(data.branding).map(([key, value]) => ({ key, value })),
        )
      } else if (step === 3) {
        await saveCategory('usluge', data.usluge)
      } else if (step === 4) {
        await saveCategory('faq', data.faq)
      }
      setStep((s) => s + 1)
    } catch {
      setError('Greška pri čuvanju. Proverite internet konekciju.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    if (step < STEPS.length) setStep((s) => s + 1)
  }

  const isLast = step === STEPS.length
  const Icon = current.icon

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-2xl font-bold">
          Klijento<span className="text-brand-500">mat</span>
        </div>
        <div className="text-xs text-slate-600 mt-1 tracking-widest">AI TIM RADNIKA</div>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-panel border border-slate-800 rounded-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-1 bg-brand-500 transition-all duration-500"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex border-b border-slate-800">
          {STEPS.map(({ id, label, icon: StepIcon }) => (
            <div
              key={id}
              className={`flex-1 flex flex-col items-center py-3 gap-1 border-r border-slate-800 last:border-r-0 transition-all ${
                id === step
                  ? 'bg-brand-500/5'
                  : id < step
                  ? 'opacity-60'
                  : 'opacity-30'
              }`}
            >
              <StepIcon
                size={14}
                className={id <= step ? 'text-brand-500' : 'text-slate-600'}
              />
              <span className={`text-[10px] ${id <= step ? 'text-slate-300' : 'text-slate-600'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Icon size={16} className="text-brand-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-100">{current.title}</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6 ml-11">{current.subtitle}</p>

          {/* Step content */}
          {step === 1 && <StepFirma data={data.firma} onChange={updateFirma} />}
          {step === 2 && <StepBranding data={data.branding} onChange={updateBranding} />}
          {step === 3 && (
            <StepUsluge
              rows={data.usluge}
              onChange={(rows) => setData((d) => ({ ...d, usluge: rows }))}
            />
          )}
          {step === 4 && (
            <StepFaq
              rows={data.faq}
              onChange={(rows) => setData((d) => ({ ...d, faq: rows }))}
            />
          )}
          {step === 5 && <StepFinish data={data} />}

          {error && (
            <div className="mt-4 text-xs text-red-400 bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-3">
              {step > 1 && !isLast && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition"
                >
                  <ArrowLeft size={14} /> Nazad
                </button>
              )}
              {!isLast && step > 1 && (
                <button
                  onClick={handleSkip}
                  className="text-sm text-slate-600 hover:text-slate-400 transition"
                >
                  Preskoči
                </button>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={saving || !canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isLast ? (
                <Zap size={14} />
              ) : (
                <ArrowRight size={14} />
              )}
              {saving
                ? 'Čuvanje...'
                : isLast
                ? 'Pokreni sistem'
                : step === 1
                ? 'Sledeće'
                : 'Sledeće'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-600">
            Korak {step} od {STEPS.length}
          </span>
          {!isLast && (
            <button
              onClick={() => { setOnboardingDone(true); navigate('/') }}
              className="text-xs text-slate-600 hover:text-slate-400 transition"
            >
              Preskoči sve →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
