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
  list: (params?: {
    status?: string
    city?: string
    industry?: string
    search?: string
    skip?: number
    limit?: number
  }) => api.get('/api/v1/leads', { params }),

  get: (id: string) => api.get(`/api/v1/leads/${id}`),

  create: (data: {
    company_name: string
    email?: string
    phone?: string
    industry?: string
    city?: string
    address?: string
    website?: string
    source?: string
  }) => api.post('/api/v1/leads', data),

  update: (id: string, data: object) => api.put(`/api/v1/leads/${id}`, data),

  delete: (id: string) => api.delete(`/api/v1/leads/${id}`),

  updateStatus: (id: string, status: string) =>
    api.patch(`/api/v1/leads/${id}/status`, { status }),

  scrape: (data: { address: string; radius: number; industry: string; max_results?: number }) =>
    api.post('/api/v1/leads/scrape', data),

  scrapeStatus: (taskId: string) => api.get(`/api/v1/leads/scrape/${taskId}`),

  importCsv: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/v1/leads/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  exportCsv: () =>
    api.get('/api/v1/leads/export', { responseType: 'blob' }),
}

// ── Campaigns ─────────────────────────────────────────────
export const campaignsApi = {
  list: () => api.get('/api/v1/campaigns'),

  get: (id: string) => api.get(`/api/v1/campaigns/${id}`),

  create: (data: {
    name: string
    subject: string
    body_html: string
    from_email: string
    from_name: string
    industry_target?: string
    followup_days?: number
    followup_subject?: string
    followup_html?: string
  }) => api.post('/api/v1/campaigns', data),

  update: (id: string, data: object) => api.put(`/api/v1/campaigns/${id}`, data),

  delete: (id: string) => api.delete(`/api/v1/campaigns/${id}`),

  send: (id: string) => api.post(`/api/v1/campaigns/${id}/send`),

  stats: (id: string) => api.get(`/api/v1/campaigns/${id}/stats`),

  aiWrite: (data: { industry: string; tone?: string; lead_company_name?: string }) =>
    api.post('/api/v1/campaigns/ai-write', data),
}

// ── Knowledge ─────────────────────────────────────────────
export const knowledgeApi = {
  get: () => api.get('/api/v1/knowledge'),
  update: (category: string, data: object) =>
    api.put(`/api/v1/knowledge/${category}`, data),
}

// ── Reviews ───────────────────────────────────────────────
export const reviewsApi = {
  list: () => api.get('/api/v1/reviews'),
  stats: () => api.get('/api/v1/reviews/stats'),
  trigger: (leadId: string, platform = 'google') =>
    api.post(`/api/v1/reviews/trigger/${leadId}`, null, { params: { platform } }),
}
