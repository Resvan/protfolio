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
Never put the value in this repo, in tests, or in chat transcripts. Include common variants: the Malayalam-script spelling
and any short or product names (spacing, hyphens and letter case are already ignored by the filter).
If the secret is missing the Worker logs `BLOCKED_TERMS not set` and the filter is off; check with `npx wrangler secret list`.
For `wrangler dev`, local secrets go in `worker/.dev.vars`, which is git-ignored. Do not run the eval
(`worker/eval/run.mjs`) against a Worker without the secret, because its output is committed.

## Limits

Each IP may send 5 questions a minute (Cloudflare rate-limit binding) plus a best-effort 20 per 10 minutes per instance.
On the Free plan, someone determined can still use up the daily AI allocation; the chat then says it is busy until the
next day, and nothing is billed.

## Settings (`wrangler.toml` vars)

- `MODEL`: Workers AI model id, picked by the evaluation in `worker/eval/`.
- `MALAYALAM_REPLIES`: `on` replies in Malayalam to Malayalam questions; `off` answers them in English.
- `ALLOWED_ORIGINS`: sites allowed to call the Worker.
