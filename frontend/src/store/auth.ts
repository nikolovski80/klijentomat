import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  user: { id: string; email: string; full_name: string; tenant_id: string } | null
  onboardingDone: boolean
  setToken: (token: string) => void
  setUser: (user: AuthState['user']) => void
  setOnboardingDone: (done: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      onboardingDone: false,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setOnboardingDone: (done) => set({ onboardingDone: done }),
      logout: () => set({ token: null, user: null, onboardingDone: false }),
    }),
    { name: 'klijentomat-auth' }
  )
)
