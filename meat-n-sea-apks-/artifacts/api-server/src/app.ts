import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.use(pinoHttp({ logger, serializers: { req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; }, res(res) { return { statusCode: res.statusCode }; } } }));
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api", router);

// Serve the pre-built admin web SPA for all non-API routes.
// The dist files live at artifacts/admin-web/dist/public relative to the
// workspace root (which is process.cwd() when started via pnpm --filter).
// CWD when started via pnpm --filter is artifacts/api-server/, so admin-web is one level up
const adminDist = path.resolve(process.cwd(), "../admin-web/dist/public");
app.use(express.static(adminDist));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(adminDist, "index.html"));
});

export default app;
