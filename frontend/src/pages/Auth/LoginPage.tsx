import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToken, setUser, onboardingDone } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      const res = await authApi.login({ email, password })
      setToken(res.data.access_token)
      const me = await authApi.me()
      setUser(me.data)
      // Novi korisnici (onboardingDone=false) idu na wizard
      navigate(onboardingDone ? '/' : '/onboarding')
    } catch {
      setError('Pogrešan email ili lozinka')
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
        <div className="text-slate-500 text-sm mb-6">Prijavite se na nalog</div>

        <div className="space-y-4">
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-dark border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
          />
          <input
            type="password" placeholder="Lozinka" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-dark border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
          />
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <button
            onClick={handleSubmit} disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Učitavanje...' : 'Prijavi se'}
          </button>
        </div>

        <div className="text-center mt-4 text-xs text-slate-600">
          Nemate nalog?{' '}
          <Link to="/register" className="text-brand-500 hover:underline">Registrujte se</Link>
        </div>
      </div>
    </div>
  )
}
