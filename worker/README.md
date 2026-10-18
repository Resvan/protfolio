# resvan-chat Worker

Backend for the AI chat on resvan.in. Runs on Cloudflare Workers AI, on the **Workers Free** plan only.
Never upgrade the account to Workers Paid: on Free, usage past the daily allocation fails ("chat is busy") instead of billing.

## How it works

`POST /chat` with `{ messages: [{ role: 'user' | 'assistant', content }] }` → streamed plain-text answer.
The Worker loads `https://resvan.in/chat-context.json` (built from `src/data`), builds the system prompt,
calls the model in `MODEL`, and filters the output against `BLOCKED_TERMS`. It never logs messages.

## Deploy

- Automatic: pushing changes under `worker/` to `main` runs `.github/workflows/deploy-worker.yml`.
  It needs the repo secret `CLOUDFLARE_API_TOKEN` (template "Edit Cloudflare Workers") and the repo variable `CLOUDFLARE_ACCOUNT_ID`.
- Manual: `npx wrangler login`, then `npx wrangler deploy --config worker/wrangler.toml`.

## Secrets

`BLOCKED_TERMS`: comma-separated words the bot must never output. Set or rotate it with
`npx wrangler secret put BLOCKED_TERMS --config worker/wrangler.toml` and type the value at the prompt.
Never put the value in this repo, in tests, or in chat transcripts.

## Settings (`wrangler.toml` vars)

- `MODEL`: Workers AI model id, picked by the evaluation in `worker/eval/`.
- `MALAYALAM_REPLIES`: `on` replies in Malayalam to Malayalam questions; `off` answers them in English.
- `ALLOWED_ORIGINS`: sites allowed to call the Worker.
