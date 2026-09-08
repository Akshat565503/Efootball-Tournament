import "dotenv/config";

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { initSocketIO } from "./services/socket";

// Routes
import tournamentRoutes from "./routes/tournaments";
import matchRoutes from "./routes/matches";
import notificationRoutes from "./routes/notifications";
import profileRoutes from "./routes/auth";

const app = express();
const httpServer = createServer(app);
const PORT = parseInt(process.env.PORT || "4000", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ─── Middleware ──────────────────────────────────────────────────────────────

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".netlify.app") ||
        origin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// ─── Routes ─────────────────────────────────────────────────────────────────

app.use("/api/tournaments", tournamentRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api", matchRoutes); // Also mount for /api/tournaments/:tournamentId/matches
app.use("/api/notifications", notificationRoutes);
app.use("/api/profile", profileRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "eFootball Tournament API",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Server Startup ─────────────────────────────────────────────────────────

async function start() {
  // Initialize Socket.io
  initSocketIO(httpServer, FRONTEND_URL);

  // Start HTTP server
  httpServer.listen(PORT, () => {
    console.log(`\n⚽ eFootball Tournament API`);
    console.log(`   Running on http://localhost:${PORT}`);
    console.log(`   CORS allowed: ${FRONTEND_URL}`);
    console.log(`\n   Routes:`);
    console.log(`   GET  /api/tournaments`);
    console.log(`   GET  /api/tournaments/:id`);
    console.log(`   POST /api/tournaments`);
    console.log(`   POST /api/tournaments/:id/join`);
    console.log(`   POST /api/tournaments/:id/start`);
    console.log(`   GET  /api/tournaments/:id/matches`);
    console.log(`   PUT  /api/matches/:id/score`);
    console.log(`   PUT  /api/matches/:id/status`);
    console.log(`   PUT  /api/matches/:id/live-update`);
    console.log(`   GET  /api/notifications`);
    console.log(`   GET  /api/profile`);
    console.log(`   GET  /api/profile/:username`);
    console.log(`   GET  /api/health\n`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n🛑 Shutting down...");
    httpServer.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start();
