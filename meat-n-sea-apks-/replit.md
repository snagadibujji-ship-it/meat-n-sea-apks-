# Meat N Sea

A fresh meat and seafood delivery platform with an Express/MongoDB backend, React admin dashboard, and Expo customer mobile app.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

Required env:
- `MONGO_URI` — MongoDB Atlas connection string
- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST token
- `SESSION_SECRET` — JWT signing secret (used in auth middleware)
- `JWT_SECRET` — alias used in auth controllers (same value as SESSION_SECRET)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Mongoose (MongoDB)
- Cache: Upstash Redis
- Auth: JWT + OTP (phone-based, dev mode returns OTP in response)
- Real-time: Socket.io (rooms: `vendor_{id}`, `order_{id}`, `rider_{id}`, `admin`)
- Validation: Zod
- API codegen: Orval (from OpenAPI spec → `lib/api-client-react`)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/` — Express API server
  - `lib/db.ts` — MongoDB connection (with retry)
  - `lib/redis.ts` — Upstash Redis client
  - `models/` — Mongoose models (User, Order, Vendor, Product, Rider, Otp, etc.)
  - `controllers/` — route handlers (auth, admin, ops, dispatch, analytics, etc.)
  - `routes/index.ts` — central router
  - `socket.ts` — Socket.io setup
  - `workers/` — background workers (dispatch polling, SLA checks, subscription cron)
- `artifacts/admin-web/src/` — React + Vite admin dashboard
  - `pages/dashboard.tsx` — daily report metrics
  - `pages/vendors.tsx` — vendor list + open/close toggle
  - `pages/orders.tsx` — order list + status filter
  - `pages/products.tsx` — product list + stock toggle
- `artifacts/customer-app/app/` — Expo customer mobile app
  - `(tabs)/index.tsx` — home screen with nearby vendors
  - `(tabs)/search.tsx` — global search
  - `(tabs)/orders.tsx` — order history
  - `(tabs)/profile.tsx` — profile + sign out
  - `auth.tsx` — OTP phone auth
  - `vendor/[id].tsx` — vendor menu + add-to-cart
  - `checkout.tsx` — order placement
- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/api-client-react/` — generated React Query hooks (from Orval)

## Architecture decisions

- Server listens immediately on startup; MongoDB connection is attempted in background (non-blocking) so health check always passes even when Atlas is unreachable.
- OTP auth returns `devOtp` in development mode for frictionless testing.
- `uploads/` directory is auto-created on startup for multer file uploads.
- Admin web and customer app both use `@workspace/api-client-react` generated hooks.
- Cart state lives in React context (in-memory per session); orders are persisted to MongoDB when placed.

## Product

- **Customers**: browse nearby vendors, search, add items to cart, place orders via OTP-authenticated sessions
- **Admin**: view daily revenue/order metrics, toggle vendor open/close status, filter orders, manage product stock
- **Vendors**: toggle open/closed status, update product stock (via admin panel for now)
- **Studio**: subscription plans and curated collections (seafood studio feature)

## User preferences

- MongoDB + Redis stack (not PostgreSQL/Drizzle)
- OTP phone authentication (no email/password)
- Prices in paise (Indian Rupees × 100)

## Gotchas

- MongoDB Atlas requires IP whitelisting. In Replit, whitelist `0.0.0.0/0` (Allow Access from Anywhere) in Atlas Network Access settings.
- The workspace has legacy `@workspace/db` (Drizzle/PostgreSQL) and `@workspace/api-zod` packages from the scaffold — these are NOT used by the new Meat N Sea code. Do not import from them.
- API server `dev` script runs `build` then `start` (esbuild first). Cold start takes ~10-15 seconds.
- Do NOT run `pnpm dev` at workspace root. Use workflow names or `pnpm --filter`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
