---
name: api-zod duplicate exports
description: Why lib/api-zod/src/index.ts must only re-export from one source.
---

## Rule
`lib/api-zod/src/index.ts` must only contain:
```ts
export * from "./generated/api";
```

**Why:** The orval codegen creates both `./generated/api.ts` (Zod schemas) and `./generated/types/` (TypeScript types). Both export the same symbol names. Re-exporting both causes TS2308 "already exported a member" errors.

**How to apply:** After running `pnpm --filter @workspace/api-spec run codegen`, verify `lib/api-zod/src/index.ts` still only has the single export. The Zod schemas already provide TypeScript types via inference, so the `types/` directory is redundant.
