import axios from 'axios'
import type {
  Project, ProjectCreate, Asset, AssetCreate,
  Variant, VariantCreate, Scene, SceneCreate,
  Settings, EnrichRequest, EnrichVariantRequest, AssetType,
  EnrichLayeredResponse
} from './types'

const api = axios.create({
  baseURL: '/api',
})

// Error interceptor: Extract detail from FastAPI HTTPException
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Unknown error'
    return Promise.reject(new Error(message))
  }
)

// Projects
export const projectsApi = {
  list: () => api.get<Project[]>('/projects').then(r => r.data),
  get: (id: number) => api.get<Project>(`/projects/${id}`).then(r => r.data),
  create: (data: ProjectCreate) => api.post<Project>('/projects', data).then(r => r.data),
  update: (id: number, data: Partial<ProjectCreate>) => api.put<Project>(`/projects/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/projects/${id}`),
}

// Assets
export const assetsApi = {
  list: (params?: { project_id?: number; type?: AssetType; is_global?: boolean }) =>
    api.get<Asset[]>('/assets', { params }).then(r => r.data),
  get: (id: number) => api.get<Asset>(`/assets/${id}`).then(r => r.data),
  create: (data: AssetCreate) => api.post<Asset>('/assets', data).then(r => r.data),
  update: (id: number, data: Partial<AssetCreate>) => api.put<Asset>(`/assets/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/assets/${id}`),
}

// Variants
export const variantsApi = {
  get: (id: number) => api.get<Variant>(`/variants/${id}`).then(r => r.data),
  create: (data: VariantCreate) => api.post<Variant>('/variants', data).then(r => r.data),
  update: (id: number, data: Partial<VariantCreate>) => api.put<Variant>(`/variants/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/variants/${id}`),
}

// Scenes
export const scenesApi = {
  list: (project_id?: number) => api.get<Scene[]>('/scenes', { params: { project_id } }).then(r => r.data),
  get: (id: number) => api.get<Scene>(`/scenes/${id}`).then(r => r.data),
  create: (data: SceneCreate) => api.post<Scene>('/scenes', data).then(r => r.data),
  update: (id: number, data: Partial<SceneCreate>) => api.put<Scene>(`/scenes/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/scenes/${id}`),
  generate: (id: number, style_id?: number) => api.post<Scene>(`/scenes/${id}/generate`, { style_id }).then(r => r.data),
}

// LLM
export interface TestConnectionResponse {
  success: boolean
  message: string
  model?: string
}

export interface LLMRequestLog {
  timestamp: string
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  generation_time_ms: number
  status: 'success' | 'error'
  error_message?: string
}

export interface LLMLogsResponse {
  logs: LLMRequestLog[]
}

export const llmApi = {
  enrich: (data: EnrichRequest) => api.post<EnrichLayeredResponse>('/llm/enrich', data).then(r => r.data),
  enrichVariant: (data: EnrichVariantRequest) => api.post<EnrichLayeredResponse>('/llm/enrich-variant', data).then(r => r.data),
  testConnection: () => api.post<TestConnectionResponse>('/llm/test').then(r => r.data),
  getLogs: () => api.get<LLMLogsResponse>('/llm/logs').then(r => r.data),
}

// Settings
export const settingsApi = {
  get: () => api.get<Settings>('/settings').then(r => r.data),
  update: (data: Partial<Settings>) => api.put<Settings>('/settings', data).then(r => r.data),
}
