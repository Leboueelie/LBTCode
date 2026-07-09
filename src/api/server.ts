import { serve } from 'bun'
import {
  getConfig,
  queryEngine,
  setConfig,
  testConnection,
} from '../services/query-engine'

const PORT = process.env.LBTCODE_PORT
  ? parseInt(process.env.LBTCODE_PORT)
  : 3001

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

serve({
  port: PORT,
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)
    const headers = { ...corsHeaders, 'Content-Type': 'application/json' }

    // Health
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          app: 'lbtcode',
          version: '1.0.0',
          provider: getConfig().provider,
          model: getConfig().model,
          connected: !!getConfig().apiKey,
        }),
        { headers }
      )
    }

    // Chat — branché sur le vrai moteur
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        const body = await request.json()

        if (!body.message) {
          return new Response(
            JSON.stringify({ error: "Le champ 'message' est requis" }),
            { status: 400, headers }
          )
        }

        const result = await queryEngine(
          body.message,
          {
            cwd: body.cwd || process.cwd(),
            files: body.files,
          },
          body.history || []
        )

        return new Response(
          JSON.stringify({
            role: 'assistant',
            content: result.content,
            toolCalls: result.toolCalls,
            usage: result.usage,
            timestamp: new Date().toISOString(),
          }),
          { headers }
        )
      } catch (err: any) {
        console.error('Chat error:', err)
        return new Response(
          JSON.stringify({
            error: err.message,
            stack:
              process.env.NODE_ENV === 'development' ? err.stack : undefined,
          }),
          { status: 500, headers }
        )
      }
    }

    // Config
    if (url.pathname === '/api/config' && request.method === 'GET') {
      return new Response(JSON.stringify(getConfig()), { headers })
    }

    if (url.pathname === '/api/config' && request.method === 'POST') {
      try {
        const body = await request.json()

        if (
          body.provider &&
          !['anthropic', 'openai', 'gemini', 'grok'].includes(body.provider)
        ) {
          return new Response(
            JSON.stringify({
              error:
                'Provider invalide. Utilise: anthropic, openai, gemini, grok',
            }),
            { status: 400, headers }
          )
        }

        setConfig({
          provider: body.provider,
          model: body.model,
          apiKey: body.apiKey,
          baseUrl: body.baseUrl,
          maxTokens: body.maxTokens,
        })

        return new Response(
          JSON.stringify({ success: true, config: getConfig() }),
          { headers }
        )
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers,
        })
      }
    }

    // Login — test et sauvegarde de connexion
    if (url.pathname === '/api/login' && request.method === 'POST') {
      try {
        const body = await request.json()
        const provider = body.provider || getConfig().provider

        const testResult = await testConnection(
          provider,
          body.apiKey || getConfig().apiKey,
          body.baseUrl || getConfig().baseUrl
        )

        if (testResult.ok) {
          setConfig({
            provider,
            apiKey: body.apiKey,
            baseUrl: body.baseUrl,
            model: body.model,
          })
          return new Response(
            JSON.stringify({
              success: true,
              message: `Connecté à ${provider}`,
            }),
            { headers }
          )
        }

        return new Response(
          JSON.stringify({ success: false, error: testResult.error }),
          { status: 401, headers }
        )
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers,
        })
      }
    }

    // Tools — lister les outils disponibles
    if (url.pathname === '/api/tools' && request.method === 'GET') {
      return new Response(
        JSON.stringify({
          tools: [
            { name: 'read_file', description: 'Lire un fichier' },
            { name: 'write_file', description: 'Écrire un fichier' },
            {
              name: 'execute_command',
              description: 'Exécuter une commande shell',
            },
            {
              name: 'list_files',
              description: "Lister les fichiers d'un répertoire",
            },
          ],
        }),
        { headers }
      )
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers,
    })
  },
})

console.log(`🚀 LBTCode API v1.0.0 — http://localhost:${PORT}`)
console.log(
  `📡 Provider: ${getConfig().provider} | Modèle: ${getConfig().model}`
)
console.log(
  `🔑 API Key: ${getConfig().apiKey ? '✓ configurée' : '✗ manquante'}`
)
