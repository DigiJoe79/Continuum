export type AssetType = 'character' | 'location' | 'object' | 'style' | 'shot_type' | 'lighting_setup'

export interface Project {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface ProjectCreate {
  name: string
  description?: string
}

export interface Variant {
  id: number
  name: string
  delta_prompt: string
  created_at: string
}

export interface Asset {
  id: number
  name: string
  type: AssetType
  base_prompt: string
  is_global: boolean
  project_id: number | null
  created_at: string
  updated_at: string
  variants: Variant[]
}

export interface AssetCreate {
  name: string
  type: AssetType
  base_prompt?: string
  is_global?: boolean
  project_id?: number
}

export interface VariantCreate {
  name: string
  delta_prompt: string
  asset_id: number
}

export interface Scene {
  id: number
  name: string
  project_id: number
  shot_type_id: number | null
  style_id: number | null
  lighting_id: number | null
  action_text: string
  generated_prompt: string | null
  created_at: string
  updated_at: string
}

export interface SceneCreate {
  name: string
  project_id: number
  shot_type_id?: number
  style_id?: number
  lighting_id?: number
  action_text?: string
}

export interface Settings {
  llm_provider: string
  llm_api_key: string
  llm_model: string
  llm_base_url: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface EnrichRequest {
  asset_type: AssetType
  messages: ChatMessage[]
  current_prompt?: string
}

export interface EnrichVariantRequest {
  asset_type: AssetType
  base_prompt: string
  messages: ChatMessage[]
  current_delta?: string
}

export interface LayeredPrompt {
  core: string
  standard: string
  detail: string
}

export interface EnrichLayeredResponse {
  layers: LayeredPrompt
  outfit_suggestion?: LayeredPrompt
}
