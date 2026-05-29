# Meat N Sea

A full-stack food and groceries delivery platform for fresh meat and seafood, covering the complete delivery lifecycle for customers, vendors, riders, and admins.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Socket.IO (real-time order tracking)
- DB: MongoDB + Mongoose ORM
- Auth: JWT (OTP-based phone authentication)
- Validation: Zod
- Redis: Upstash (dispatch deduplication — falls back to in-memory if not configured)
- Build: esbuild (ESM bundle)

## Where things live

| Path | Purpose |
|---|---|
| `artifacts/api-server/src/` | Express API server (main source) |
| `artifacts/api-server/src/controllers/` | Business logic per domain |
| `artifacts/api-server/src/middlewares/auth.ts` | JWT auth + RBAC middleware |
| `artifacts/api-server/src/models/` | Mongoose models |
| `artifacts/api-server/src/schemas/` | Zod validation schemas |
| `artifacts/api-server/src/routes/index.ts` | All routes with RBAC wiring |
| `artifacts/api-server/src/workers/` | Background workers (dispatch, subscriptions) |
| `meat-n-sea-apks-/` | Original cloned repo (reference only) |

## RBAC System

Four roles are defined on the JWT token: `customer`, `vendor`, `partner` (rider), `admin`.

Middleware helpers in `middlewares/auth.ts`:
- `requireAuth` — any valid JWT
- `requireAdmin` — admin only
- `requireVendorOrAdmin` — vendor or admin
- `requireRiderOrAdmin` — partner or admin
- `requireRole(...roles)` — factory for custom role combos

Route protection matrix:
| Route group | Guard |
|---|---|
| Admin reports, all vendors/orders, analytics summary | `requireAdmin` |
| Coupon creation, studio write ops, plan creation | `requireAdmin` |
| Dispatch | `requireAdmin` |
| Vendor status, product stock, order advance, vendor orders | `requireVendorOrAdmin` |
| Rider profile, rider status, complete delivery, rider orders | `requireRiderOrAdmin` |
| Place order, my orders, addresses, subscriptions | `requireAuth` |

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | ✅ | Server port (set by workflow) |
| `JWT_SECRET` | ✅ (prod) | JWT signing secret — server warns if missing in dev, exits in prod |
| `MONGO_URI` | ✅ | MongoDB connection string (default: `mongodb://localhost:27017/meat-n-sea`) |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Redis — falls back to in-memory if missing |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis token |
| `PLATFORM_FEE_PERCENT` | Optional | Platform fee % (default: 10) |
| `ALLOWED_ORIGINS` | Optional | Comma-separated CORS origins (default: `*`) |
| `NODE_ENV` | Optional | `development` or `production` |

## Architecture Decisions

- **MongoDB over Postgres**: The app was built with Mongoose models — Drizzle/Postgres lib exists as a stub but is not used. MongoDB was chosen for its flexible schema and geospatial query support (`$geoNear`, `2dsphere` indexes).
- **OTP without paid SMS**: The OTP provider is abstracted in `lib/otp.ts`. In dev mode it returns the code in the response. To wire up a real provider (e.g. MSG91, Twilio free tier) add logic there without touching auth controllers.
- **Redis in-memory fallback**: If Upstash credentials are absent, a process-local Map is used — safe for single-instance dev, but dispatch deduplication won't persist across restarts.
- **Price recalculated server-side**: `placeOrder` ignores any client-sent total — it fetches product prices from DB and calculates the total itself, preventing price manipulation.
- **Role isolation on vendor/product routes**: Vendor and product mutation endpoints verify the authenticated user owns the resource before allowing changes.

## Product

- Customers browse nearby vendors, add products to cart, and place orders (OTP login)
- Vendors manage their store status, product stock, and incoming orders in real-time
- Riders receive dispatch offers, update their status/location, and mark deliveries complete
- Admins see daily revenue reports, all vendors/orders, and analytics summaries
- Studio subscription boxes are auto-created daily by a background cron job

## Gotchas

- **Always set `JWT_SECRET` before going to production** — the server will exit if it's missing in `NODE_ENV=production`
- Redis falls back to in-memory — set Upstash vars for persistent dispatch deduplication
- `uploads/` is local disk — ephemeral in cloud deployments. Swap `controllers/media.ts` to use object storage for production
- Rider default coordinates are `[0, 0]` until the rider sends their first location update

## User preferences

- Only free tools/services
