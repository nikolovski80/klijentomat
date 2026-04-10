import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/auth'
import Layout from './components/layout/Layout'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import OnboardingWizard from './pages/Onboarding/OnboardingWizard'
import DashboardPage from './pages/Dashboard/DashboardPage'
import TehnicarPage from './pages/Tehnicar/TehnicarPage'
import KomercijalistaPage from './pages/Komercijalista/KomercijalistaPage'
import MozakPage from './pages/Mozak/MozakPage'
import IzvestajPage from './pages/Izvestaj/IzvestajPage'
import PodesavanjaPage from './pages/Podesavanja/PodesavanjaPage'

const queryClient = new QueryClient()

// Zaštita za autentifikovane korisnike (bez onboardinga)
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, onboardingDone } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (!onboardingDone) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

// Zaštita za onboarding (prijavljeni, ali još nisu prošli wizard)
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { token, onboardingDone } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (onboardingDone) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Javne rute */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Onboarding wizard */}
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <OnboardingWizard />
              </OnboardingRoute>
            }
          />

          {/* Privatne rute sa Layout-om */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="tehnicar" element={<TehnicarPage />} />
            <Route path="komercijalista" element={<KomercijalistaPage />} />
            <Route path="mozak" element={<MozakPage />} />
            <Route path="izvestaj" element={<IzvestajPage />} />
            <Route path="podesavanja" element={<PodesavanjaPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
