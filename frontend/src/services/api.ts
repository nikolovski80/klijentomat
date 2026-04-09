import axios from 'axios'
import { useAuthStore } from '../store/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

// Dodaj JWT token na svaki request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Logout na 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout()
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  register: (data: { company_name: string; email: string; password: string }) =>
    api.post('/api/v1/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/v1/auth/login', data),
  me: () => api.get('/api/v1/auth/me'),
}

// ── Leads ─────────────────────────────────────────────────
export const leadsApi = {
  list: (params?: object) => api.get('/api/v1/leads', { params }),
  scrape: (data: { address: string; radius: number; industry: string }) =>
    api.post('/api/v1/leads/scrape', data),
  importCsv: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/v1/leads/import', form)
  },
  exportCsv: () => api.get('/api/v1/leads/export', { responseType: 'blob' }),
}

// ── Campaigns ─────────────────────────────────────────────
export const campaignsApi = {
  list: () => api.get('/api/v1/campaigns'),
  create: (data: object) => api.post('/api/v1/campaigns', data),
  send: (id: string) => api.post(`/api/v1/campaigns/${id}/send`),
  stats: (id: string) => api.get(`/api/v1/campaigns/${id}/stats`),
  aiWrite: (data: { industry: string; tone?: string }) =>
    api.post('/api/v1/campaigns/ai-write', data),
}

// ── Knowledge ─────────────────────────────────────────────
export const knowledgeApi = {
  get: () => api.get('/api/v1/knowledge'),
  update: (category: string, data: object) =>
    api.put(`/api/v1/knowledge/${category}`, data),
}
