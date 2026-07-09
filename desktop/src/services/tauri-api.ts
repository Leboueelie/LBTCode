import { invoke } from '@tauri-apps/api/core'

const API_BASE = 'http://localhost:3001'

// === HTTP API (backend sidecar) ===

export async function sendMessage(message: string, history?: any[]) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: history || [] }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function login(config: {
  provider?: string
  apiKey?: string
  baseUrl?: string
  model?: string
}) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  return res.json()
}

export async function getConfig() {
  const res = await fetch(`${API_BASE}/api/config`)
  return res.json()
}

export async function setConfig(config: any) {
  const res = await fetch(`${API_BASE}/api/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  return res.json()
}

// === Tauri IPC (système de fichiers natif) ===

export async function tauriReadFile(path: string): Promise<string> {
  return invoke('read_file', { path })
}

export async function tauriWriteFile(
  path: string,
  content: string
): Promise<void> {
  return invoke('write_file', { path, content })
}

export async function tauriListDir(path: string): Promise<string[]> {
  return invoke('list_dir', { path })
}

export async function tauriGetCwd(): Promise<string> {
  return invoke('get_cwd')
}

export async function tauriOpenFolder(path: string): Promise<void> {
  return invoke('open_folder', { path })
}

export async function tauriPathExists(path: string): Promise<boolean> {
  return invoke('path_exists', { path })
}
