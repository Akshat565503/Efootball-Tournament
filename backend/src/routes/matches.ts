import { Router, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { authenticate } from "../middleware/auth";
import { AuthRequest, UpdateScoreDTO, LiveUpdateDTO } from "../types";
import { processScoreEntry } from "../services/bracket";
import { emitToTournament } from "../services/socket";
import {
  sendNotification,
  notifyTournamentParticipants,
} from "../services/notification";

const router = Router();

// ─── GET /api/tournaments/:tournamentId/matches ──────────────────────────────
// Get all matches for a tournament

router.get(
  "/tournaments/:tournamentId/matches",
  async (req: AuthRequest, res: Response) => {
    try {
      const tournamentId = req.params.tournamentId as string;

      const { data: matches, error } = await supabaseAdmin
        .from("matches")
        .select(`
          *,
          player1:profiles!matches_player1_id_fkey(id, username, display_name, avatar_url, favorite_club, region, efootball_id),
          player2:profiles!matches_player2_id_fkey(id, username, display_name, avatar_url, favorite_club, region, efootball_id)
        `)
        .eq("tournament_id", tournamentId)
        .order("round")
        .order("match_order");

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ matches: matches || [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  }
);

// ─── PUT /api/matches/:id/score ──────────────────────────────────────────────
// Enter match score — determines winner & advances bracket

router.put(
  "/:id/score",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { score1, score2 }: UpdateScoreDTO = req.body;

      if (score1 === undefined || score2 === undefined || isNaN(Number(score1)) || isNaN(Number(score2))) {
        res.status(400).json({ error: "Please enter valid numeric scores for both players." });
        return;
      }

      const s1 = Math.floor(Number(score1));
      const s2 = Math.floor(Number(score2));

      if (s1 < 0 || s2 < 0) {
        res.status(400).json({ error: "Match scores cannot be negative numbers." });
        return;
      }

      if (s1 === s2) {
        res.status(400).json({
          error: "Draws are not permitted in knockout tournament matches. Please include extra-time or penalty shootout score."
        });
        return;
      }

      // Verify the user owns the tournament for this match
      const { data: match } = await supabaseAdmin
        .from("matches")
        .select("tournament_id")
        .eq("id", id)
        .single();

      if (!match) {
        res.status(404).json({ error: "Match not found" });
        return;
      }

      const { data: tournament } = await supabaseAdmin
        .from("tournaments")
        .select("owner_id, name")
        .eq("id", match.tournament_id)
        .single();

      if (!tournament || tournament.owner_id !== req.user!.sub) {
        res.status(403).json({ error: "Only the tournament owner can enter scores" });
        return;
      }

      // Process score entry
      const result = await processScoreEntry(id, s1, s2);

      // Emit match update
      emitToTournament(match.tournament_id, "match:updated", result.match);

      // Fetch updated bracket for emit
      const { data: allMatches } = await supabaseAdmin
        .from("matches")
        .select("*")
        .eq("tournament_id", match.tournament_id)
        .order("round")
        .order("match_order");

      emitToTournament(match.tournament_id, "tournament:bracket_updated", {
        tournamentId: match.tournament_id,
        matches: allMatches || [],
      });

      // Notify winner and loser
      if (result.match.winner_id) {
        const loserId =
          result.match.winner_id === result.match.player1_id
            ? result.match.player2_id
            : result.match.player1_id;

        await sendNotification({
          userId: result.match.winner_id,
          type: "you_advanced",
          title: "You won! 🎉",
          message: `You advanced in "${tournament.name}" with a score of ${score1}-${score2}!`,
          tournamentId: match.tournament_id,
          matchId: id,
        });

        if (loserId) {
          await sendNotification({
            userId: loserId,
            type: "you_eliminated",
            title: "Match Result",
            message: `You've been eliminated from "${tournament.name}". Score: ${score1}-${score2}. GG!`,
            tournamentId: match.tournament_id,
            matchId: id,
          });
        }
      }

      // Round complete notification
      if (result.roundCompleted) {
        emitToTournament(match.tournament_id, "tournament:round_complete", {
          tournamentId: match.tournament_id,
          round: result.match.round,
        });

        await notifyTournamentParticipants(match.tournament_id, {
          type: "round_complete",
          title: "Round Complete!",
          message: `Round ${result.match.round} of "${tournament.name}" is complete!`,
        });
      }

      // Tournament complete notification
      if (result.tournamentCompleted) {
        emitToTournament(match.tournament_id, "tournament:status_changed", {
          tournamentId: match.tournament_id,
          status: "completed",
        });

        await notifyTournamentParticipants(match.tournament_id, {
          type: "tournament_completed",
          title: "Tournament Complete! 🏆",
          message: `"${tournament.name}" has concluded!`,
        });
      }

      res.json({
        match: result.match,
        roundCompleted: result.roundCompleted,
        tournamentCompleted: result.tournamentCompleted,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update score";
      res.status(500).json({ error: message });
    }
  }
);

// ─── PUT /api/matches/:id/status ─────────────────────────────────────────────
// Update match status (scheduled → live → completed)

router.put(
  "/:id/status",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!["scheduled", "live", "completed"].includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }

      // Verify ownership
      const { data: match } = await supabaseAdmin
        .from("matches")
        .select("tournament_id")
        .eq("id", id)
        .single();

      if (!match) {
        res.status(404).json({ error: "Match not found" });
        return;
      }

      const { data: tournament } = await supabaseAdmin
        .from("tournaments")
        .select("owner_id, name")
        .eq("id", match.tournament_id)
        .single();

      if (!tournament || tournament.owner_id !== req.user!.sub) {
        res.status(403).json({ error: "Only the tournament owner can update match status" });
        return;
      }

      const updates: Record<string, unknown> = { status };
      if (status === "live") {
        updates.started_at = new Date().toISOString();
      }

      const { data: updatedMatch, error } = await supabaseAdmin
        .from("matches")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      emitToTournament(match.tournament_id, "match:updated", updatedMatch);

      // Notify players if match is going live
      if (status === "live" && updatedMatch) {
        const playerIds = [updatedMatch.player1_id, updatedMatch.player2_id].filter(Boolean) as string[];
        for (const playerId of playerIds) {
          await sendNotification({
            userId: playerId,
            type: "match_live",
            title: "Your match is LIVE! 🔴",
            message: `Your match in "${tournament.name}" is now live!`,
            tournamentId: match.tournament_id,
            matchId: id,
          });
        }
      }

      res.json({ match: updatedMatch });
    } catch (error) {
      res.status(500).json({ error: "Failed to update match status" });
    }
  }
);

// ─── PUT /api/matches/:id/live-update ────────────────────────────────────────
// Post live match updates (minute, notes, stream URL)

router.put(
  "/:id/live-update",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const body: LiveUpdateDTO = req.body;

      // Verify ownership
      const { data: match } = await supabaseAdmin
        .from("matches")
        .select("tournament_id, status")
        .eq("id", id)
        .single();

      if (!match) {
        res.status(404).json({ error: "Match not found" });
        return;
      }

      const { data: tournament } = await supabaseAdmin
        .from("tournaments")
        .select("owner_id")
        .eq("id", match.tournament_id)
        .single();

      if (!tournament || tournament.owner_id !== req.user!.sub) {
        res.status(403).json({ error: "Only the tournament owner can post live updates" });
        return;
      }

      const updates: Record<string, unknown> = {};
      if (body.live_minute !== undefined) updates.live_minute = body.live_minute;
      if (body.live_notes !== undefined) updates.live_notes = body.live_notes;
      if (body.stream_url !== undefined) updates.stream_url = body.stream_url;

      const { data: updatedMatch, error } = await supabaseAdmin
        .from("matches")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      // Emit live note to spectators
      emitToTournament(match.tournament_id, "match:live_note", {
        matchId: id,
        minute: body.live_minute ?? null,
        notes: body.live_notes ?? null,
      });

      emitToTournament(match.tournament_id, "match:updated", updatedMatch);

      res.json({ match: updatedMatch });
    } catch (error) {
      res.status(500).json({ error: "Failed to post live update" });
    }
  }
);

export default router;
