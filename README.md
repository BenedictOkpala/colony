# COLONY

A subterranean social-deduction game: investigate sabotage, question suspects, gather evidence, and decide whom to accuse in an emergency meeting.

Built with **Phaser 3 + TypeScript + Vite**, with **AntSeed-powered AI interrogation** and deterministic dialogue fallbacks. Desktop is recommended for the full investigation experience.

## Install and run locally

Install a current Node.js LTS release, then run:

```sh
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` (and `npm.cmd` if required). Open the local URL printed by Vite, normally http://localhost:5173.

## Server environment

Set these in your local `.env` for live AI interrogation:

- `ANTSEED_API_KEY`: your private provider credential.
- `ANTSEED_BASE_URL`: your configured OpenAI-compatible AntSeed endpoint.
- `ANTSEED_MODEL`: the model identifier supported by that endpoint.

The existing integration also accepts `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `OPENAI_MODEL` as fallback configuration. The example file contains placeholders; configure it for your provider. Never commit credentials or use a `VITE_` prefix for secrets. Without working provider access, deterministic dialogue fallbacks remain available.

## Build

```sh
npm run build
```

Output is written to `dist/`. Important deployment limitation: `/api/chat` currently runs through Vite development middleware. Static hosting or `npm run preview` alone does not provide that API. Production server routing must be arranged before deployment; provider credentials must remain server-side.
