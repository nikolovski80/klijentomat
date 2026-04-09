import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/auth'
import Layout from './components/layout/Layout'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import TehnicarPage from './pages/Tehnicar/TehnicarPage'
import KomercijalistaPage from './pages/Komercijalista/KomercijalistaPage'
import MozakPage from './pages/Mozak/MozakPage'
import IzvestajPage from './pages/Izvestaj/IzvestajPage'
import PodesavanjaPage from './pages/Podesavanja/PodesavanjaPage'

const queryClient = new QueryClient()

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
