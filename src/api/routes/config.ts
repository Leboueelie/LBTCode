import { testConnection } from '../../services/api/lbtcode-engine'
import type { Provider } from '../../services/api/lbtcode-engine'
import {
  type LbtConfig,
  getConfig,
  setConfig,
} from '../../services/config-store'

export interface LoginBody {
  provider?: Provider
  apiKey?: string
  baseUrl?: string
  model?: string
}

export interface ConfigUpdateBody {
  provider?: Provider
  model?: string
  apiKey?: string
  baseUrl?: string
  maxTokens?: number
}

export async function handleLogin(body: LoginBody) {
  const config = getConfig()
  const provider = body.provider || config.provider
  const apiKey = body.apiKey || config.apiKey
  const baseUrl = body.baseUrl || config.baseUrl

  if (!apiKey) {
    return { success: false, error: 'Clé API requise' }
  }

  const result = await testConnection(provider, apiKey, baseUrl)

  if (result.ok) {
    const updates: Partial<LbtConfig> = { provider, apiKey }
    if (body.baseUrl) updates.baseUrl = body.baseUrl
    if (body.model) updates.model = body.model
    setConfig(updates)

    return {
      success: true,
      message: `✅ Connecté à ${provider}`,
      config: getConfig(),
    }
  }

  return { success: false, error: result.error || 'Échec de connexion' }
}

export function handleConfigUpdate(body: ConfigUpdateBody) {
  if (
    body.provider &&
    !['anthropic', 'openai', 'gemini', 'grok'].includes(body.provider)
  ) {
    return { success: false, error: 'Provider invalide' }
  }

  setConfig(body)
  return { success: true, config: getConfig() }
}

export function handleConfigGet() {
  return getConfig()
}
