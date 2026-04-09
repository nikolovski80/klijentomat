// DashboardPage.tsx
export function DashboardPage() {
  return (
    <div className="p-8">
      <div className="text-lg font-semibold mb-6">⚡ Pregled</div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Ukupno kontakata', val: '0', color: 'text-blue-400' },
          { label: 'Aktivne kampanje', val: '0', color: 'text-brand-500' },
          { label: 'Open rate', val: '0%', color: 'text-green-400' },
          { label: 'Odgovori', val: '0', color: 'text-purple-400' },
        ].map((s, i) => (
          <div key={i} className="bg-panel border border-slate-800 rounded-xl p-5">
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-panel border border-slate-800 rounded-xl p-5">
        <div className="text-xs text-slate-500 mb-3 tracking-wider">UPOZORENJA</div>
        <div className="text-sm text-slate-500">Nema upozorenja. Dobro urađeno! 👍</div>
      </div>
    </div>
  )
}
export default DashboardPage
