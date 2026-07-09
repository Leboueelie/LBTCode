# CLAUDE.md

Ce fichier donne les instructions aux agents IA (LBTCode, Claude, etc.) qui travaillent sur ce dépôt.

## Présentation du projet

**LBTCode** est un assistant IA Desktop développé pour THE IT FOUNDATION.
Basé sur Tauri + React + Bun, il supporte plusieurs providers (Anthropic, OpenAI, Gemini, Grok).

## Architecture

```
lbtcode/
├── desktop/              # Frontend React (Vite + Tailwind)
│   ├── src/components/   # ChatPanel, EditorPanel, FileExplorer, SettingsPanel...
│   └── src/services/     # tauri-api.ts (HTTP + IPC)
├── src/                  # Backend
│   ├── api/server.ts     # Serveur HTTP (Bun)
│   ├── api/routes/       # Routes API
│   └── services/         # Moteur IA, config store
├── src-tauri/            # Tauri (Rust)
│   ├── src/main.rs       # Sidecar + IPC commands
│   └── tauri.conf.json   # Configuration Tauri
└── packages/             # Monorepo (outils CCB legacy)
```

## Commandes

```bash
bun install           # Installer les dépendances
bun run dev           # Backend + Desktop (dev)
bun run dev:backend   # Backend seul
bun run dev:desktop   # Desktop seul
bun run tauri:dev     # Tauri (backend auto-lancé)
bun run build         # Build complet
bun run build:backend # Backend standalone (minifié)
bun run build:desktop # Desktop standalone (Vite)
bun run tauri:build   # Installeur (.msi/.AppImage/.dmg)
bun run test          # Tests d'intégration (goal-lifecycle)
bun run lint          # Biome check (src + desktop)
```

## Conventions

- **Langue** : tout en français (code, docs, messages)
- **Commits** : Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)
- **TypeScript** : strict mode (pas de `typecheck`, utiliser `bun run lint` pour Biome)
- **UI** : React 18 + Tailwind + lucide-react

## Stack technique

- **Runtime** : Bun
- **Frontend** : React 18, Vite 5, Tailwind CSS 3
- **Desktop** : Tauri 2 (Rust)
- **Backend** : Bun serveur HTTP
- **IA** : Anthropic SDK / OpenAI SDK
