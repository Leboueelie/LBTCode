import Anthropic from '@anthropic-ai/sdk'
import type {
  MessageParam,
  TextBlock,
  ToolUseBlock,
  Usage,
} from '@anthropic-ai/sdk/resources/messages/messages.mjs'
import OpenAI from 'openai'

export type Provider =
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'grok'
  | 'bedrock'
  | 'vertex'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface Usage {
  inputTokens: number
  outputTokens: number
}

export interface ChatRequest {
  system?: string
  messages: Message[]
  model?: string
  provider?: Provider
  apiKey?: string
  baseUrl?: string
  maxTokens?: number
  tools?: ToolDefinition[]
}

export interface ChatResponse {
  content: string
  usage: Usage
  toolCalls: ToolCall[]
  stopReason: string | null
}

interface EngineConfig {
  provider: Provider
  model: string
  apiKey?: string
  baseUrl?: string
  maxTokens: number
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === maxRetries) throw err
      const delay = Math.min(1000 * 2 ** attempt, 10000)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw new Error('Unreachable')
}

function getDefaultConfig(): EngineConfig {
  return {
    provider: (process.env.LBTCODE_PROVIDER as Provider) || 'anthropic',
    model: process.env.LBTCODE_MODEL || 'claude-sonnet-4-20250514',
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
    baseUrl: process.env.ANTHROPIC_BASE_URL || process.env.OPENAI_BASE_URL,
    maxTokens: 4096,
  }
}

function buildConfig(overrides: Partial<ChatRequest>): EngineConfig {
  const defaults = getDefaultConfig()
  return {
    provider: (overrides.provider as Provider) || defaults.provider,
    model: overrides.model || defaults.model,
    apiKey: overrides.apiKey || defaults.apiKey,
    baseUrl: overrides.baseUrl || defaults.baseUrl,
    maxTokens: overrides.maxTokens || defaults.maxTokens,
  }
}

async function createAnthropicClient(cfg: EngineConfig) {
  if (!cfg.apiKey) {
    throw new Error(
      'Clé API manquante. Configure-la via /api/login ou /api/config.'
    )
  }
  return new Anthropic({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseUrl,
  })
}

async function createOpenAIClient(cfg: EngineConfig) {
  if (!cfg.apiKey) {
    throw new Error(
      'Clé API manquante. Configure-la via /api/login ou /api/config.'
    )
  }
  return new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseUrl,
  })
}

function formatMessages(messages: Message[]): MessageParam[] {
  return messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))
}

function convertToAnthropicTools(
  tools?: ToolDefinition[]
): Anthropic.Messages.Tool[] {
  if (!tools || tools.length === 0) return []
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as Anthropic.Messages.Tool.InputSchema,
  }))
}

async function callAnthropic(
  cfg: EngineConfig,
  system: string | undefined,
  messages: MessageParam[],
  tools: Anthropic.Messages.Tool[]
): Promise<Anthropic.Messages.Message> {
  const client = await createAnthropicClient(cfg)

  return withRetry(async () => {
    const params: Anthropic.Messages.MessageCreateParams = {
      model: cfg.model,
      max_tokens: cfg.maxTokens,
      messages,
    }
    if (system) params.system = system
    if (tools.length > 0) params.tools = tools

    return client.messages.create(params)
  })
}

function parseAnthropicResponse(msg: Anthropic.Messages.Message): ChatResponse {
  const contentBlocks = msg.content as (TextBlock | ToolUseBlock)[]
  const content = contentBlocks
    .filter(b => b.type === 'text')
    .map(b => (b as TextBlock).text)
    .join('')

  const toolCalls = contentBlocks
    .filter(b => b.type === 'tool_use')
    .map(b => ({
      id: b.id,
      name: (b as ToolUseBlock).name,
      input: (b as ToolUseBlock).input as Record<string, unknown>,
    }))

  return {
    content,
    usage: {
      inputTokens: msg.usage?.input_tokens || 0,
      outputTokens: msg.usage?.output_tokens || 0,
    },
    toolCalls,
    stopReason: msg.stop_reason || null,
  }
}

async function callOpenAI(
  cfg: EngineConfig,
  system: string | undefined,
  messages: MessageParam[],
  _tools: Anthropic.Messages.Tool[]
): Promise<ChatResponse> {
  const client = await createOpenAIClient(cfg)

  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map(
    m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content as string,
    })
  )

  if (system) {
    openaiMessages.unshift({ role: 'system', content: system })
  }

  const response = await withRetry(async () =>
    client.chat.completions.create({
      model: cfg.model,
      max_tokens: cfg.maxTokens,
      messages: openaiMessages,
    })
  )

  const choice = response.choices[0]
  return {
    content: choice?.message?.content || '',
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
    toolCalls: (choice?.message?.tool_calls || []).map(tc => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments || '{}'),
    })),
    stopReason: choice?.finish_reason || null,
  }
}

export async function chatEngine(request: ChatRequest): Promise<ChatResponse> {
  const cfg = buildConfig(request)
  const system = request.system
  const messages = formatMessages(request.messages)
  const tools = convertToAnthropicTools(request.tools)

  switch (cfg.provider) {
    case 'anthropic':
    case 'bedrock':
    case 'vertex': {
      const msg = await callAnthropic(cfg, system, messages, tools)
      return parseAnthropicResponse(msg)
    }
    case 'openai':
    case 'grok':
    case 'gemini': {
      return callOpenAI(cfg, system, messages, tools)
    }
    default:
      throw new Error(`Unsupported provider: ${cfg.provider}`)
  }
}

export async function testConnection(
  provider: Provider,
  apiKey?: string,
  baseUrl?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await chatEngine({
      messages: [{ role: 'user', content: 'Ping. Reply with just "pong".' }],
      provider,
      apiKey,
      baseUrl,
      maxTokens: 10,
    })
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}
