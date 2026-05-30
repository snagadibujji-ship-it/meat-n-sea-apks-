---
name: orval query options typing
description: How to pass enabled/disabled query options to orval-generated React Query hooks without TS errors.
---

## Rule
Orval-generated hooks have a typing quirk where `{ query: { enabled: boolean } }` doesn't satisfy the full `UseQueryOptions` type (which requires `queryKey`). Cast the options with `as never` to suppress this without touching generated code:

```ts
const { data } = useGetSomething(
  params,
  { query: { enabled: !!someCondition } as never }
);
```

**Why:** Orval internally provides `queryKey`, but the TypeScript signature exposes the full `UseQueryOptions` type for the override, which makes `queryKey` required. Casting `as never` tells TypeScript to trust us without changing generated code.

**How to apply:** Any time you see `Property 'queryKey' is missing in type '{ enabled: boolean; }'` in orval-generated hook calls, apply `as never` cast to the query options object.
