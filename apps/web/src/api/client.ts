import axios from 'axios'

const API_BASE = '/api/v1'

export const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (email: string, password: string) => client.post('/auth/login', { email, password }),
  register: (data: any) => client.post('/auth/register', data),
  me: () => client.get('/auth/me'),
}

export const projectsApi = {
  list: () => client.get('/projects'),
  get: (id: string) => client.get(`/projects/${id}`),
  create: (data: any) => client.post('/projects', data),
}

export const logsApi = {
  query: (params: any) => client.get('/logs', { params }),
  get: (id: string) => client.get(`/logs/${id}`),
  timeseries: (params: any) => client.get('/logs/timeseries', { params }),
}

export const errorsApi = {
  groups: () => client.get('/errors/groups'),
  group: (fp: string) => client.get(`/errors/groups/${fp}`),
}

export const metricsApi = {
  names: () => client.get('/metrics/names'),
  query: (params: any) => client.get('/metrics', { params }),
}

export const alertsApi = {
  list: () => client.get('/alerts'),
  create: (data: any) => client.post('/alerts', data),
  delete: (id: string) => client.delete(`/alerts/${id}`),
  incidents: (id: string) => client.get(`/alerts/${id}/incidents`),
}

export const dashboardApi = {
  summary: () => client.get('/dashboard/summary'),
}
