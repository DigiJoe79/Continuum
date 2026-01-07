# Continuum - Consistent Prompt Engine

Web tool for consistent AI image generation. Define reusable assets (characters, locations, objects) with LLM-assisted prompt enrichment, create variants, and compose scenes. Ensures visual consistency across image series through structured prompt building blocks and template-based scene assembly.

## Screenshots

![Alt text](/docs/screenshots/v0.1.0-GlobalAssets.png?raw=true "Global Assets with camera, lighting and style settings")
![Alt text](/docs/screenshots/v0.1.0-EnrichmentBase.png?raw=true "LLM Assistand for base and variant enrichment")
![Alt text](/docs/screenshots/v0.1.0-EditScene.png?raw=true "Intelligent scene assembly based on assets")
![Alt text](/docs/screenshots/v0.1.0-Settings.png?raw=true "Setting")


## Status

> **Experimental** - This project is in early development. Currently only tested with:
> - LLM: Claude Sonnet 4.5 (via OpenRouter)
> - Image Generator: Nano Banana Pro
>
> Other models may work but are untested.

## Installation

### Option 1: Docker (Recommended)

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/digijoe79/continuum:latest

# Run container
docker run -d -p 80:80 -v continuum-data:/app/data ghcr.io/digijoe79/continuum:latest

# Or build locally
git clone https://github.com/digijoe79/continuum.git
cd continuum
docker-compose up --build
```

Access at `http://localhost`

### Option 2: Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
PYTHONPATH=. uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Access at `http://localhost:5173`

## Concepts

### Assets

Assets are reusable prompt building blocks. Each asset has a **base prompt** that describes its core visual characteristics.

| Type | Description | Example |
|------|-------------|---------|
| **Character** | People, creatures | "elderly woman, silver hair, round glasses, warm smile" |
| **Location** | Places, environments | "medieval marketplace, wooden stalls, cobblestone streets" |
| **Object** | Items, props | "brass pocket compass, engraved lid, worn leather strap" |

### Variants

Variants are **modifications** of an asset. They describe what changes, not the entire asset again.

**Example:**
- Base Asset: "Anna" (young woman, red hair, freckles)
- Variant "Medieval": "burgundy velvet dress, golden embroidery, leather belt"
- Variant "Modern": "white t-shirt, blue jeans, sneakers"

### Scenes

Scenes compose assets into final prompts using a simple template syntax:

```
[ANNA:Medieval] walks through [MARKET:Night]
```

This resolves to a complete prompt combining:
- Anna's base description
- Medieval variant details
- Market's base description
- Night variant details
- Selected shot type, lighting, and style

### Global Presets

Pre-configured settings available across all projects:

- **Shot Types**: Camera framing (Close-up, Wide, POV, Dutch Angle, etc.)
- **Lighting Setups**: Light configuration (Golden Hour, Noir, Silhouette, etc.)
- **Styles**: Visual aesthetics (Cinematic, Anime, Photorealistic, etc.)

## Workflow

```
1. Create Project
   └── Define your story/series scope

2. Create Assets (Upstream - with LLM)
   ├── Add Character/Location/Object
   ├── Describe in chat dialog
   └── LLM generates structured prompt

3. Create Variants
   ├── Add variant to asset
   ├── Describe the modification
   └── LLM generates delta prompt

4. Compose Scenes (Downstream - no LLM)
   ├── Write action text with [ASSET:Variant] syntax
   ├── Select shot type, lighting, style
   └── Generate final prompt
```

## Configuration

Go to **Settings** to configure your LLM provider:

| Provider | Base URL | Notes |
|----------|----------|-------|
| OpenRouter | `https://openrouter.ai/api/v1` | Recommended, requires API key |
| OpenAI | `https://api.openai.com/v1` | Requires API key |
| LM Studio | `http://host.docker.internal:1234/v1` | Local, no API key needed |

Use the **Test Connection** button to verify your configuration.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + TypeScript + Vite + MUI |
| State | Zustand + React Query |
| Backend | Python 3.11 + FastAPI |
| Database | SQLite + SQLAlchemy |
| Container | Docker (multi-stage build) |

## License

MIT
