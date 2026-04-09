import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'

export default function RegisterPage() {
  const [form, setForm] = useState({ company_name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToken, setUser } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      const res = await authApi.register(form)
      setToken(res.data.access_token)
      const me = await authApi.me()
      setUser(me.data)
      navigate('/')
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Greška pri registraciji')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="bg-panel border border-slate-800 rounded-xl p-8 w-full max-w-sm">
        <div className="text-2xl font-bold mb-1">
          Klijento<span className="text-brand-500">mat</span>
        </div>
        <div className="text-slate-500 text-sm mb-6">Zaposlite prvog AI radnika</div>

        <div className="space-y-4">
          {(['company_name', 'email', 'password'] as const).map((field) => (
            <input
              key={field}
              type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
              placeholder={field === 'company_name' ? 'Naziv firme' : field === 'email' ? 'Email' : 'Lozinka'}
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              className="w-full bg-dark border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
            />
          ))}
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <button
            onClick={handleSubmit} disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Učitavanje...' : 'Kreiraj nalog'}
          </button>
        </div>

        <div className="text-center mt-4 text-xs text-slate-600">
          Imate nalog?{' '}
          <Link to="/login" className="text-brand-500 hover:underline">Prijavite se</Link>
        </div>
      </div>
    </div>
  )
}
