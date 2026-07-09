import { chatEngine, testConnection } from './api/lbtcode-engine'
import type {
  ChatResponse,
  ToolCall,
  ToolDefinition,
} from './api/lbtcode-engine'
import { getConfig, setConfig } from './config-store'

export interface QueryContext {
  cwd: string
  files?: string[]
  git?: Record<string, unknown>
}

export interface QueryResult {
  content: string
  toolCalls: ToolCall[]
  usage: { inputTokens: number; outputTokens: number }
}

const MAX_TOOL_LOOP = 10

function getSystemPrompt(context: QueryContext): string {
  const lines: string[] = [
    'Tu es LBTCode, un assistant IA de développement intégré dans un éditeur de code.',
    "Tu aides l'utilisateur à écrire, comprendre et modifier du code.",
    '',
    'Règles :',
    '- Réponds toujours en français.',
    '- Sois concis et précis.',
    "- Ne fais PAS de suppositions sur l'environnement.",
    '- Si tu utilises des outils, explique ce que tu fais.',
    '',
    `Répertoire de travail : ${context.cwd}`,
  ]

  if (context.files && context.files.length > 0) {
    lines.push(
      '',
      'Fichiers dans le contexte :',
      ...context.files.map(f => `  - ${f}`)
    )
  }

  return lines.join('\n')
}

function getAvailableTools(context: QueryContext): ToolDefinition[] {
  const tools: ToolDefinition[] = [
    {
      name: 'read_file',
      description: "Lire le contenu d'un fichier",
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Chemin du fichier' },
        },
        required: ['path'],
      },
    },
    {
      name: 'write_file',
      description: 'Écrire du contenu dans un fichier',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Chemin du fichier' },
          content: { type: 'string', description: 'Contenu à écrire' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'execute_command',
      description: 'Exécuter une commande shell',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Commande à exécuter' },
        },
        required: ['command'],
      },
    },
    {
      name: 'list_files',
      description: "Lister les fichiers d'un répertoire",
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Chemin du répertoire' },
        },
        required: ['path'],
      },
    },
  ]

  return tools
}

async function executeToolCall(
  toolCall: ToolCall,
  context: QueryContext
): Promise<string> {
  const { name, input } = toolCall

  switch (name) {
    case 'read_file': {
      const { readFileSync } = await import('fs')
      const path = input.path as string
      try {
        const content = readFileSync(path, 'utf-8')
        return JSON.stringify({ success: true, content, path })
      } catch (err: any) {
        return JSON.stringify({ success: false, error: err.message })
      }
    }
    case 'write_file': {
      const { writeFileSync, mkdirSync, dirname } = await import('fs')
      const path = input.path as string
      const content = input.content as string
      try {
        mkdirSync(dirname(path), { recursive: true })
        writeFileSync(path, content, 'utf-8')
        return JSON.stringify({ success: true, path })
      } catch (err: any) {
        return JSON.stringify({ success: false, error: err.message })
      }
    }
    case 'execute_command': {
      const { execSync } = await import('child_process')
      const command = input.command as string
      try {
        const stdout = execSync(command, {
          cwd: context.cwd,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
        })
        return JSON.stringify({ success: true, stdout, command })
      } catch (err: any) {
        return JSON.stringify({
          success: false,
          stdout: err.stdout,
          stderr: err.stderr,
          error: err.message,
          command,
        })
      }
    }
    case 'list_files': {
      const { readdirSync } = await import('fs')
      const path = input.path as string
      try {
        const entries = readdirSync(path, { withFileTypes: true }).map(e => ({
          name: e.name,
          isDirectory: e.isDirectory(),
        }))
        return JSON.stringify({ success: true, entries, path })
      } catch (err: any) {
        return JSON.stringify({ success: false, error: err.message })
      }
    }
    default:
      return JSON.stringify({ success: false, error: `Tool unknown: ${name}` })
  }
}

function buildChatHistory(
  history: { role: 'user' | 'assistant' | 'system'; content: string }[]
): { role: 'user' | 'assistant' | 'system'; content: string }[] {
  return history.map(m => ({
    role: m.role,
    content: m.content,
  }))
}

export async function queryEngine(
  message: string,
  context: QueryContext,
  history: { role: 'user' | 'assistant' | 'system'; content: string }[] = []
): Promise<QueryResult> {
  const config = getConfig()
  const system = getSystemPrompt(context)
  const tools = getAvailableTools(context)

  const messages = [
    ...buildChatHistory(history),
    { role: 'user' as const, content: message },
  ]

  let currentMessages = [...messages]
  let toolLoopCount = 0
  let totalContent = ''
  const allToolCalls: ToolCall[] = []
  let totalUsage = { inputTokens: 0, outputTokens: 0 }

  while (toolLoopCount < MAX_TOOL_LOOP) {
    const response: ChatResponse = await chatEngine({
      system,
      messages: currentMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      model: config.model,
      provider: config.provider,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      maxTokens: config.maxTokens,
      tools,
    })

    totalUsage.inputTokens += response.usage.inputTokens
    totalUsage.outputTokens += response.usage.outputTokens

    if (response.content) {
      totalContent += response.content
    }

    if (!response.toolCalls || response.toolCalls.length === 0) {
      break
    }

    allToolCalls.push(...response.toolCalls)

    const assistantMsg = {
      role: 'assistant' as const,
      content: response.content || '',
    }
    const toolResultMsg: {
      role: 'user' | 'assistant' | 'system'
      content: string
    } = {
      role: 'user' as const,
      content: '',
    }
    const toolResults: string[] = []

    for (const toolCall of response.toolCalls) {
      const result = await executeToolCall(toolCall, context)
      toolResults.push(`Résultat de ${toolCall.name}: ${result}`)
    }

    currentMessages = [
      ...currentMessages,
      assistantMsg,
      { role: 'user', content: toolResults.join('\n\n') },
    ]

    toolLoopCount++
  }

  return {
    content: totalContent,
    toolCalls: allToolCalls,
    usage: totalUsage,
  }
}

export { testConnection, getConfig, setConfig }
