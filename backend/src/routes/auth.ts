import { Router, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { authenticate } from "../middleware/auth";
import { AuthRequest, UpdateProfileDTO } from "../types";

const router = Router();

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

function validateProfileInput(body: UpdateProfileDTO): string | null {
  if (body.username !== undefined) {
    const trimmed = body.username.trim();
    if (!trimmed) return "Username is required.";
    if (trimmed.length < 3 || trimmed.length > 24) {
      return "Username must be between 3 and 24 characters.";
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      return "Username can only contain letters, numbers, and underscores (no spaces or special symbols).";
    }
  }

  if (body.efootball_id !== undefined && body.efootball_id !== null) {
    const trimmedId = body.efootball_id.trim();
    if (trimmedId.length > 0 && (trimmedId.length < 2 || trimmedId.length > 40)) {
      return "eFootball™ Account ID must be between 2 and 40 characters.";
    }
  }

  if (body.display_name && body.display_name.trim().length > 40) {
    return "Display name cannot exceed 40 characters.";
  }

  if (body.favorite_club && body.favorite_club.trim().length > 50) {
    return "Favorite club cannot exceed 50 characters.";
  }

  if (body.region && body.region.trim().length > 50) {
    return "Region cannot exceed 50 characters.";
  }

  return null;
}

// ─── POST /api/profile ───────────────────────────────────────────────────────
// Create or upsert profile on first login

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const body: UpdateProfileDTO = req.body;

    const validationError = validateProfileInput(body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    if (!body.username || !body.username.trim()) {
      res.status(400).json({ error: "Please enter a valid username." });
      return;
    }

    const cleanUsername = body.username.trim().toLowerCase();

    // Check username availability
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", cleanUsername)
      .neq("id", userId)
      .maybeSingle();

    if (existing) {
      res.status(400).json({ error: `Username "${cleanUsername}" is already taken. Please choose another.` });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          username: cleanUsername,
          display_name: body.display_name?.trim() || cleanUsername,
          avatar_url: body.avatar_url || null,
          favorite_club: body.favorite_club?.trim() || null,
          region: body.region?.trim() || null,
          efootball_id: body.efootball_id?.trim() || null,
          bio: body.bio?.trim() || null,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("❌ DB error saving profile:", error);
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ profile: data });
  } catch (error) {
    console.error("❌ Catch error in POST /api/profile:", error);
    res.status(500).json({ error: "Failed to create profile. Please try again." });
  }
});

// ─── GET /api/profile ────────────────────────────────────────────────────────
// Get current user's profile

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.sub;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      res.status(404).json({ error: "Profile not found." });
      return;
    }

    res.json({ profile: data });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ─── PUT /api/profile ────────────────────────────────────────────────────────
// Update current user's profile

router.put("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const body: UpdateProfileDTO = req.body;

    const validationError = validateProfileInput(body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const updates: Record<string, unknown> = {};

    if (body.username !== undefined) {
      const cleanUsername = body.username.trim().toLowerCase();
      // Check uniqueness
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("username", cleanUsername)
        .neq("id", userId)
        .maybeSingle();

      if (existing) {
        res.status(400).json({ error: `Username "${cleanUsername}" is already taken. Please choose another.` });
        return;
      }

      updates.username = cleanUsername;
    }

    if (body.display_name !== undefined) updates.display_name = body.display_name?.trim() || null;
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
    if (body.favorite_club !== undefined) updates.favorite_club = body.favorite_club?.trim() || null;
    if (body.region !== undefined) updates.region = body.region?.trim() || null;
    if (body.efootball_id !== undefined) updates.efootball_id = body.efootball_id?.trim() || null;
    if (body.bio !== undefined) updates.bio = body.bio?.trim() || null;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating profile in DB:", error);
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ profile: data });
  } catch (error) {
    console.error("❌ Catch error in PUT /api/profile:", error);
    res.status(500).json({ error: "Failed to update profile. Please try again." });
  }
});

// ─── GET /api/profile/:username ──────────────────────────────────────────────
// Public player profile with stats

router.get("/:username", async (req: AuthRequest, res: Response) => {
  try {
    const username = req.params.username as string;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("username", username.toLowerCase())
      .single();

    if (error || !profile) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    // Get match stats
    const { data: matchesAsP1 } = await supabaseAdmin
      .from("matches")
      .select("id, winner_id, status")
      .eq("player1_id", profile.id)
      .eq("status", "completed")
      .eq("is_bye", false);

    const { data: matchesAsP2 } = await supabaseAdmin
      .from("matches")
      .select("id, winner_id, status")
      .eq("player2_id", profile.id)
      .eq("status", "completed")
      .eq("is_bye", false);

    const allMatches = [...(matchesAsP1 || []), ...(matchesAsP2 || [])];
    const wins = allMatches.filter((m) => m.winner_id === profile.id).length;
    const losses = allMatches.length - wins;

    // Get tournaments played
    const { count: tournamentsPlayed } = await supabaseAdmin
      .from("tournament_participants")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id);

    // Get tournaments won (winner of final match)
    const { data: finalsWon } = await supabaseAdmin
      .from("matches")
      .select("tournament_id")
      .eq("winner_id", profile.id)
      .eq("status", "completed");

    // Filter to only count finals
    let tournamentsWon = 0;
    if (finalsWon) {
      for (const final of finalsWon) {
        const { data: matchCount } = await supabaseAdmin
          .from("matches")
          .select("round")
          .eq("tournament_id", final.tournament_id)
          .order("round", { ascending: false })
          .limit(1);

        if (matchCount && matchCount.length > 0) {
          const { data: finalMatch } = await supabaseAdmin
            .from("matches")
            .select("winner_id")
            .eq("tournament_id", final.tournament_id)
            .eq("round", matchCount[0].round)
            .single();

          if (finalMatch?.winner_id === profile.id) {
            tournamentsWon++;
          }
        }
      }
    }

    res.json({
      profile,
      stats: {
        matches_played: allMatches.length,
        wins,
        losses,
        win_rate: allMatches.length > 0 ? Math.round((wins / allMatches.length) * 100) : 0,
        tournaments_played: tournamentsPlayed || 0,
        tournaments_won: tournamentsWon,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch player profile" });
  }
});

export default router;
