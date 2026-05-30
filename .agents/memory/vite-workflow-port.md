---
name: Vite dev workflow port tracking
description: How to configure artifact.toml dev commands so the workflow system detects the opened port correctly for Vite apps.
---

## Rule
In `artifact.toml`, the `[services.development] run` command for Vite apps MUST use `exec` to replace the shell process with Vite directly. Using `pnpm --filter` as the dev run command causes `DIDNT_OPEN_A_PORT` failures even though Vite starts successfully.

## Correct pattern
```toml
[services.development]
run = "sh -c 'cd /home/runner/workspace/artifacts/<name> && BASE_PATH=/<path>/ exec ./node_modules/.bin/vite --config vite.config.ts --host 0.0.0.0'"
```

## What NOT to do
```toml
[services.development]
run = "pnpm --filter @workspace/<name> run dev"
```

**Why:** The workflow system tracks port ownership. With `pnpm --filter`, the port is opened by a grandchild process (Vite). With `exec`, Vite replaces the shell and becomes the direct child tracked by the workflow runner.

**How to apply:** Any new Vite-based web artifact in this repo must use the `exec ./node_modules/.bin/vite` pattern. Also remove `PORT` from `[services.env]` — the workflow runner injects it from `localPort`.
