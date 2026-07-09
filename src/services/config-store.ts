export interface LbtConfig {
  provider: 'anthropic' | 'openai' | 'gemini' | 'grok'
  model: string
  apiKey: string
  baseUrl?: string
  maxTokens: number
}

const DEFAULT_CONFIG: LbtConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || '',
  baseUrl: process.env.ANTHROPIC_BASE_URL || process.env.OPENAI_BASE_URL,
  maxTokens: 4096,
}

let config: LbtConfig = { ...DEFAULT_CONFIG }

export function getConfig(): LbtConfig {
  return { ...config }
}

export function setConfig(partial: Partial<LbtConfig>): LbtConfig {
  config = { ...config, ...partial }
  return getConfig()
}

export function resetConfig(): void {
  config = { ...DEFAULT_CONFIG }
}
