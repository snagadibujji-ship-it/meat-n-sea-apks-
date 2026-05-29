import { createServer } from "http";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { connectDB } from "./lib/db.js";
import { initSocket } from "./socket.js";
import { startDispatchPollWorker, checkSlaBreaches } from "./workers/dispatchCleanup.js";
import { processSubscriptions } from "./workers/subscriptionCron.js";
import { mkdirSync } from "fs";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

try {
  mkdirSync("uploads", { recursive: true });
} catch {}

const httpServer = createServer(app);
const io = initSocket(httpServer);
void io;

httpServer.listen(port, () => {
  logger.info({ port }, "Meat N Sea API server listening");
});

connectDB()
  .then(() => {
    startDispatchPollWorker();
    setInterval(processSubscriptions, 60 * 60 * 1000);
    setInterval(checkSlaBreaches, 60 * 1000);
  })
  .catch((err) => {
    logger.error({ err }, "DB setup error");
  });
