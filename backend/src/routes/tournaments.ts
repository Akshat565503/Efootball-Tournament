import { Router, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { authenticate } from "../middleware/auth";
import { tournamentOwnerOnly } from "../middleware/adminOnly";
import { AuthRequest, CreateTournamentDTO, TournamentDetail } from "../types";
import { generateBracket } from "../services/bracket";
import { emitToTournament } from "../services/socket";
import { notifyTournamentParticipants, sendNotification } from "../services/notification";

const router = Router();

// ─── GET /api/tournaments ────────────────────────────────────────────────────
// List tournaments with optional filters

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { status, region, search, limit, offset } = req.query;

    const limitNum = Math.min(Math.max(1, parseInt((limit as string) || "20", 10) || 20), 50);
    const offsetNum = Math.max(0, parseInt((offset as string) || "0", 10) || 0);

    let query = supabaseAdmin
      .from("tournaments")
      .select(`
        *,
        owner:profiles!tournaments_owner_id_fkey(id, username, display_name, avatar_url),
        participant_count:tournament_participants(count)
      `)
      .order("created_at", { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (status && status !== "all") {
      query = query.eq("status", status as string);
    } else {
      // By default, don't show drafts or cancelled
      query = query.in("status", ["open", "in_progress", "completed"]);
    }

    if (region) {
      query = query.contains("eligibility_filter", { region: region as string });
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error fetching tournaments from DB:", error);
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ tournaments: data || [] });
  } catch (error) {
    console.error("❌ Catch error in GET /api/tournaments:", error);
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
});

// ─── GET /api/tournaments/:id ────────────────────────────────────────────────
// Tournament detail with participants and matches

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const { data: tournament, error } = await supabaseAdmin
      .from("tournaments")
      .select(`
        *,
        owner:profiles!tournaments_owner_id_fkey(id, username, display_name, avatar_url, favorite_club)
      `)
      .eq("id", id)
      .single();

    if (error || !tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    // Get participants with profiles
    const { data: participants, error: partError } = await supabaseAdmin
      .from("tournament_participants")
      .select(`
        *,
        profile:profiles!tournament_participants_user_id_fkey(id, username, display_name, avatar_url, favorite_club, region, efootball_id)
      `)
      .eq("tournament_id", id)
      .order("joined_at");

    if (partError) {
      console.error("❌ Error fetching tournament participants:", partError);
    }

    // Get matches
    const { data: matches } = await supabaseAdmin
      .from("matches")
      .select(`
        *,
        player1:profiles!matches_player1_id_fkey(id, username, display_name, avatar_url, favorite_club, region, efootball_id),
        player2:profiles!matches_player2_id_fkey(id, username, display_name, avatar_url, favorite_club, region, efootball_id)
      `)
      .eq("tournament_id", id)
      .order("round")
      .order("match_order");

    const detail: TournamentDetail = {
      ...tournament,
      participants: participants || [],
      matches: matches || [],
      participant_count: participants?.length || 0,
    };

    res.json({ tournament: detail });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tournament" });
  }
});

// ─── Profile Helper ─────────────────────────────────────────────────────────

async function ensureProfile(req: AuthRequest, defaultRole: "owner" | "participant" = "participant") {
  const userId = req.user!.sub;
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    if (defaultRole === "owner" && existing.role !== "owner") {
      await supabaseAdmin.from("profiles").update({ role: "owner" }).eq("id", userId);
      existing.role = "owner";
    }
    return existing;
  }

  // Auto-generate profile if missing
  const emailPrefix = req.user?.email ? req.user.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") : `player_${userId.slice(0, 5)}`;
  const cleanUsername = emailPrefix.length >= 3 ? emailPrefix : `player_${userId.slice(0, 5)}`;
  const finalUsername = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`.toLowerCase();
  const displayName = (req.user?.user_metadata as any)?.full_name || (req.user?.user_metadata as any)?.name || cleanUsername;
  const avatarUrl = (req.user?.user_metadata as any)?.avatar_url || (req.user?.user_metadata as any)?.picture || null;

  const { data: created } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userId,
        username: finalUsername,
        display_name: displayName,
        avatar_url: avatarUrl,
        role: defaultRole,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  return created;
}

// ─── POST /api/tournaments ───────────────────────────────────────────────────
// Create a new tournament (owner only)

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const body: CreateTournamentDTO = req.body;

    if (!body.name || !body.name.trim()) {
      res.status(400).json({ error: "Tournament name is required." });
      return;
    }

    const trimmedName = body.name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 60) {
      res.status(400).json({ error: "Tournament name must be between 3 and 60 characters." });
      return;
    }

    const allowedMaxPlayers = [2, 4, 6, 8];
    const maxPlayers = body.max_players ? Number(body.max_players) : 8;
    if (!allowedMaxPlayers.includes(maxPlayers)) {
      res.status(400).json({ error: "Max players must be 2, 4, 6, or 8." });
      return;
    }

    if (body.start_date) {
      const parsedDate = new Date(body.start_date);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: "Please provide a valid start date and time." });
        return;
      }
    }

    // Ensure user profile exists with owner role
    await ensureProfile(req, "owner");

    const { data, error } = await supabaseAdmin
      .from("tournaments")
      .insert({
        owner_id: userId,
        name: trimmedName,
        description: body.description?.trim() || null,
        banner_url: body.banner_url?.trim() || null,
        theme: body.theme?.trim() || null,
        ruleset: body.ruleset?.trim() || "Friend Match",
        eligibility_filter: body.eligibility_filter || {},
        max_players: maxPlayers,
        start_date: body.start_date || null,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating tournament in DB:", error);
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ tournament: data });
  } catch (error) {
    console.error("❌ Catch error in POST /api/tournaments:", error);
    res.status(500).json({ error: "Failed to create tournament. Please try again." });
  }
});

// ─── PUT /api/tournaments/:id ────────────────────────────────────────────────
// Update tournament (owner only)

router.put(
  "/:id",
  authenticate,
  tournamentOwnerOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const body = req.body;

      // Only allow updates to editable fields
      const allowedFields = [
        "name", "description", "banner_url", "theme",
        "ruleset", "eligibility_filter", "max_players", "start_date", "status",
      ];

      const updates: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      }

      const { data, error } = await supabaseAdmin
        .from("tournaments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ tournament: data });
    } catch (error) {
      res.status(500).json({ error: "Failed to update tournament" });
    }
  }
);

// ─── POST /api/tournaments/:id/join ──────────────────────────────────────────
// Join a tournament

router.post("/:id/join", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.sub;

    // Check tournament exists and is open
    const { data: tournament } = await supabaseAdmin
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found or no longer available." });
      return;
    }

    if (tournament.status !== "open") {
      res.status(400).json({ error: `Tournament is ${tournament.status.replace('_', ' ')} and no longer accepting registrations.` });
      return;
    }

    if (tournament.owner_id === userId) {
      res.status(400).json({ error: "As the organizer, you manage the tournament and cannot register as a player." });
      return;
    }

    // Check current participant count
    const { count } = await supabaseAdmin
      .from("tournament_participants")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", id);

    if ((count || 0) >= tournament.max_players) {
      res.status(400).json({ error: `Tournament is full! All ${tournament.max_players} participant slots have been taken.` });
      return;
    }

    // Ensure player has a profile in profiles table before joining
    const profile = await ensureProfile(req, "participant");

    // Check if already joined
    const { data: existing } = await supabaseAdmin
      .from("tournament_participants")
      .select("*")
      .eq("tournament_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      res.status(400).json({ error: "You are already registered for this tournament." });
      return;
    }

    // Join
    const { error } = await supabaseAdmin
      .from("tournament_participants")
      .insert({ tournament_id: id, user_id: userId });

    if (error) {
      console.error("❌ Error joining tournament:", error);
      res.status(500).json({ error: error.message });
      return;
    }

    // Notify tournament room
    if (profile) {
      emitToTournament(id, "participant:joined", {
        tournamentId: id,
        profile,
      });
    }

    // Notify tournament owner
    await sendNotification({
      userId: tournament.owner_id,
      type: "player_joined",
      title: "New player joined!",
      message: `${profile?.display_name || profile?.username || "A player"} joined "${tournament.name}"`,
      tournamentId: id,
    });

    res.json({ message: "Successfully joined tournament" });
  } catch (error) {
    console.error("❌ Catch error in POST /api/tournaments/:id/join:", error);
    res.status(500).json({ error: "Failed to join tournament. Please try again." });
  }
});

// ─── POST /api/tournaments/:id/start ─────────────────────────────────────────
// Start tournament and generate bracket (owner only)

router.post(
  "/:id/start",
  authenticate,
  tournamentOwnerOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;

      // Get tournament
      const { data: tournament } = await supabaseAdmin
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!tournament) {
        res.status(404).json({ error: "Tournament not found." });
        return;
      }

      if (tournament.status !== "open") {
        res.status(400).json({ error: `Tournament cannot be started from "${tournament.status}" status.` });
        return;
      }

      // Get participants
      const { data: participants } = await supabaseAdmin
        .from("tournament_participants")
        .select("user_id")
        .eq("tournament_id", id);

      if (!participants || participants.length < 2) {
        res.status(400).json({ error: "At least 2 players must join the tournament before you can generate the bracket and start." });
        return;
      }

      // Generate bracket
      const participantIds = participants.map((p) => p.user_id);
      const matches = await generateBracket(id, participantIds);

      // Notify all participants
      await notifyTournamentParticipants(id, {
        type: "tournament_started",
        title: "Tournament Started! 🏆",
        message: `"${tournament.name}" has begun! Check the bracket for your first match.`,
      });

      // Emit to tournament room
      emitToTournament(id, "tournament:bracket_updated", {
        tournamentId: id,
        matches,
      });

      emitToTournament(id, "tournament:status_changed", {
        tournamentId: id,
        status: "in_progress",
      });

      res.json({ message: "Tournament started successfully", matches });
    } catch (error) {
      console.error("❌ Catch error in POST /api/tournaments/:id/start:", error);
      const message = error instanceof Error ? error.message : "Failed to start tournament. Please try again.";
      res.status(500).json({ error: message });
    }
  }
);

export default router;
