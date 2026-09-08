import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { jwtVerify } from "jose";
import { ClientToServerEvents, ServerToClientEvents } from "../types";

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

/**
 * Initialize Socket.io server attached to the HTTP server.
 * Authenticates connections via Supabase JWT in handshake.
 */
export function initSocketIO(
  httpServer: HTTPServer,
  frontendUrl: string
): SocketIOServer<ClientToServerEvents, ServerToClientEvents> {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: [
        frontendUrl,
        "http://localhost:3000",
        "http://localhost:3001",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // ─── Authentication middleware ──────────────────────────────────────

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        // Allow unauthenticated connections for spectators
        (socket as any).userId = null;
        return next();
      }

      let userId: string | null = null;
      const jwtSecret = process.env.SUPABASE_JWT_SECRET;

      if (jwtSecret) {
        try {
          const secret = new TextEncoder().encode(jwtSecret);
          const { payload } = await jwtVerify(token, secret, {
            audience: "authenticated",
          });
          userId = payload.sub as string;
        } catch {}
      }

      if (!userId) {
        const { supabaseAdmin } = await import("../config/supabase");
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      }

      (socket as any).userId = userId;
      return next();
    } catch {
      // Allow connection but without user context
      (socket as any).userId = null;
      return next();
    }
  });

  // ─── Connection handler ─────────────────────────────────────────────

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;

    console.log(
      `🔌 Socket connected: ${socket.id}${userId ? ` (user: ${userId})` : " (spectator)"}`
    );

    // Join user's personal room for notifications
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // ─── Tournament room management ─────────────────────────────────

    socket.on("tournament:join_room", (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`);
      console.log(`   📺 ${socket.id} joined tournament:${tournamentId}`);
    });

    socket.on("tournament:leave_room", (tournamentId: string) => {
      socket.leave(`tournament:${tournamentId}`);
      console.log(`   📺 ${socket.id} left tournament:${tournamentId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log("⚡ Socket.io server initialized");
  return io;
}

/**
 * Get the Socket.io server instance.
 * Throws if not initialized.
 */
export function getIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents> {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocketIO first.");
  }
  return io;
}

/**
 * Emit a tournament-scoped event to all connected clients watching that tournament.
 */
export function emitToTournament(
  tournamentId: string,
  event: keyof ServerToClientEvents,
  data: any
): void {
  try {
    const server = getIO();
    server.to(`tournament:${tournamentId}`).emit(event, data);
  } catch {
    console.warn("Socket.io not available for emit");
  }
}
