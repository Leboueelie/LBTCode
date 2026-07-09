# LBTCode

[![GitHub License](https://img.shields.io/github/license/Leboueelie/LBTCode?style=flat-square)](https://github.com/Leboueelie/LBTCode/blob/main/LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun-black?style=flat-square&logo=bun)](https://bun.sh/)

**LBTCode** — Assistant IA Desktop pour THE IT FOUNDATION.

Application de bureau basée sur Tauri qui permet de chatter avec des modèles de langage (Anthropic, OpenAI, Gemini, Grok), d'éditer du code, d'explorer des fichiers et de configurer des outils de développement.

![LBTCode Desktop](docs/assets/lbtcode-screenshot.png)

## Fonctionnalités

| Fonction | Description |
|----------|-------------|
| **Chat IA** | Assistant multi-providers avec historique |
| **Éditeur de code** | Ouvre et sauvegarde des fichiers via IPC natif |
| **Explorateur de fichiers** | Navigation arborescente |
| **Paramètres** | Configuration provider / clé API / modèle |
| **Multi-providers** | Anthropic, OpenAI, Gemini, Grok |

## Prérequis

- [Bun](https://bun.sh/) >= 1.3.0
- [Rust](https://rustup.rs/) (pour Tauri)

## Installation

```bash
git clone https://github.com/Leboueelie/LBTCode.git
cd lbtcode
bun install
```

## Développement

```bash
# Backend + Desktop (2 terminaux)
bun run dev

# Ou avec Tauri (backend auto-lancé)
bun run tauri:dev

# Build complet
bun run build
```

Le backend API tourne sur `http://localhost:3001` et l'interface sur `http://localhost:5173`.

## API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/health` | GET | Statut du serveur |
| `/api/chat` | POST | Envoyer un message à l'IA |
| `/api/config` | GET/POST | Lire/modifier la configuration |
| `/api/login` | POST | Tester et sauvegarder une connexion |
| `/api/tools` | GET | Lister les outils disponibles |

## Build Release

```bash
# Builder le backend standalone
bun run build:backend

# Builder le desktop
bun run build:desktop

# Builder l'installeur Tauri (msi/appimage/dmg)
bun run tauri:build
```

## Licence

MIT — THE IT FOUNDATION
