import { supabaseAdmin } from "../config/supabase";
import { Match } from "../types";
import { v4 as uuidv4 } from "uuid";

/**
 * Bracket generation and advancement for single-elimination tournaments.
 *
 * Supports 2–8 players. For non-power-of-2 counts, byes are assigned
 * so that the top-seeded players skip the first round.
 *
 * Round numbering (for 8 players):
 *   Round 1 = Quarter-finals (4 matches)
 *   Round 2 = Semi-finals (2 matches)
 *   Round 3 = Final (1 match)
 */

/**
 * Shuffle array using Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculate the number of rounds needed for N players.
 */
function calculateRounds(playerCount: number): number {
  return Math.ceil(Math.log2(playerCount));
}

/**
 * Generate a single-elimination bracket for a tournament.
 *
 * @param tournamentId - The tournament to generate bracket for
 * @param participantIds - Array of player user IDs
 * @returns The generated matches
 */
export async function generateBracket(
  tournamentId: string,
  participantIds: string[]
): Promise<Match[]> {
  const playerCount = participantIds.length;

  if (playerCount < 2 || playerCount > 8) {
    throw new Error("Tournament requires between 2 and 8 players");
  }

  const totalRounds = calculateRounds(playerCount);
  const bracketSize = Math.pow(2, totalRounds); // Nearest power of 2
  const byeCount = bracketSize - playerCount;

  // Shuffle players for random seeding
  const shuffledPlayers = shuffleArray(participantIds);

  // Assign seeds to tournament_participants
  for (let i = 0; i < shuffledPlayers.length; i++) {
    await supabaseAdmin
      .from("tournament_participants")
      .update({ seed: i + 1 })
      .eq("tournament_id", tournamentId)
      .eq("user_id", shuffledPlayers[i]);
  }

  const allMatches: Partial<Match>[] = [];

  // ─── Generate Round 1 matches ───────────────────────────────────────

  const round1MatchCount = bracketSize / 2;

  // Build initial slots — fill with players, then nulls for byes
  // Byes go to the LAST positions so top seeds get the byes
  const slots: (string | null)[] = [];
  for (let i = 0; i < bracketSize; i++) {
    slots.push(i < shuffledPlayers.length ? shuffledPlayers[i] : null);
  }

  // Create Round 1 matches
  for (let m = 0; m < round1MatchCount; m++) {
    const p1 = slots[m * 2];
    const p2 = slots[m * 2 + 1];
    const isBye = p1 === null || p2 === null;

    const match: Partial<Match> = {
      id: uuidv4(),
      tournament_id: tournamentId,
      round: 1,
      match_order: m + 1,
      player1_id: p1,
      player2_id: p2,
      score1: 0,
      score2: 0,
      status: isBye ? "completed" : "scheduled",
      is_bye: isBye,
      winner_id: isBye ? (p1 || p2) : null, // The present player wins the bye
    };

    allMatches.push(match);
  }

  // ─── Generate subsequent round matches (empty, TBD) ─────────────────

  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    for (let m = 0; m < matchesInRound; m++) {
      allMatches.push({
        id: uuidv4(),
        tournament_id: tournamentId,
        round,
        match_order: m + 1,
        player1_id: null,
        player2_id: null,
        score1: 0,
        score2: 0,
        status: "scheduled",
        is_bye: false,
        winner_id: null,
      });
    }
  }

  // Insert all matches
  const { data, error } = await supabaseAdmin
    .from("matches")
    .insert(allMatches)
    .select();

  if (error) {
    throw new Error(`Failed to create bracket: ${error.message}`);
  }

  // ─── Advance bye winners to Round 2 ─────────────────────────────────

  const round1Matches = (data as Match[]).filter((m) => m.round === 1);
  const round2Matches = (data as Match[]).filter((m) => m.round === 2);

  for (const match of round1Matches) {
    if (match.is_bye && match.winner_id) {
      await advanceWinnerToNextRound(
        match,
        round1Matches,
        round2Matches,
        tournamentId
      );
    }
  }

  // Fetch updated matches
  const { data: finalMatches } = await supabaseAdmin
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("round")
    .order("match_order");

  // Update tournament status and current round
  await supabaseAdmin
    .from("tournaments")
    .update({ status: "in_progress", current_round: 1 })
    .eq("id", tournamentId);

  return (finalMatches as Match[]) || [];
}

/**
 * Advance a match winner into their next-round slot.
 */
async function advanceWinnerToNextRound(
  completedMatch: Match,
  currentRoundMatches: Match[],
  nextRoundMatches: Match[],
  tournamentId: string
): Promise<void> {
  // Determine which next-round match this feeds into
  // Match order 1,2 feed into next round match 1; match order 3,4 feed into next round match 2, etc.
  const nextMatchIndex = Math.ceil(completedMatch.match_order / 2) - 1;
  const nextMatch = nextRoundMatches[nextMatchIndex];

  if (!nextMatch) return;

  // Determine if winner goes into player1 or player2 slot
  // Odd match_order → player1 of next match; Even → player2
  const isPlayer1Slot = completedMatch.match_order % 2 === 1;
  const updateField = isPlayer1Slot ? "player1_id" : "player2_id";

  await supabaseAdmin
    .from("matches")
    .update({ [updateField]: completedMatch.winner_id })
    .eq("id", nextMatch.id);
}

/**
 * Process a score entry: determine winner, advance to next round.
 *
 * @param matchId - The match to update
 * @param score1 - Player 1's score
 * @param score2 - Player 2's score
 * @returns Updated match and any side effects
 */
export async function processScoreEntry(
  matchId: string,
  score1: number,
  score2: number
): Promise<{
  match: Match;
  tournamentCompleted: boolean;
  roundCompleted: boolean;
}> {
  // Get the match
  const { data: match, error: matchError } = await supabaseAdmin
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    throw new Error("Match not found");
  }

  if (match.status === "completed") {
    throw new Error("Match already completed");
  }

  if (!match.player1_id || !match.player2_id) {
    throw new Error("Both players must be set before entering scores");
  }

  if (score1 === score2) {
    throw new Error("Draws are not allowed in knockout tournaments. Please include extra time / penalty result.");
  }

  // Determine winner
  const winnerId = score1 > score2 ? match.player1_id : match.player2_id;

  // Update match
  const { data: updatedMatch, error: updateError } = await supabaseAdmin
    .from("matches")
    .update({
      score1,
      score2,
      winner_id: winnerId,
      status: "completed" as const,
      completed_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .select()
    .single();

  if (updateError || !updatedMatch) {
    throw new Error(`Failed to update match: ${updateError?.message}`);
  }

  // Get all matches for this tournament
  const { data: allMatches } = await supabaseAdmin
    .from("matches")
    .select("*")
    .eq("tournament_id", match.tournament_id)
    .order("round")
    .order("match_order");

  const matches = (allMatches as Match[]) || [];
  const currentRoundMatches = matches.filter((m) => m.round === match.round);
  const nextRoundMatches = matches.filter((m) => m.round === match.round + 1);

  // Advance winner to next round (if there is one)
  if (nextRoundMatches.length > 0) {
    await advanceWinnerToNextRound(
      updatedMatch as Match,
      currentRoundMatches,
      nextRoundMatches,
      match.tournament_id
    );
  }

  // Check if current round is complete
  const roundCompleted = currentRoundMatches.every(
    (m) => m.id === matchId || m.status === "completed"
  );

  // Check if tournament is complete (this was the final match)
  const tournamentCompleted =
    nextRoundMatches.length === 0 && roundCompleted;

  if (roundCompleted && nextRoundMatches.length > 0) {
    // Advance to next round
    await supabaseAdmin
      .from("tournaments")
      .update({ current_round: match.round + 1 })
      .eq("id", match.tournament_id);
  }

  if (tournamentCompleted) {
    // Mark tournament as completed
    await supabaseAdmin
      .from("tournaments")
      .update({ status: "completed" })
      .eq("id", match.tournament_id);
  }

  return {
    match: updatedMatch as Match,
    tournamentCompleted,
    roundCompleted,
  };
}

/**
 * Get round display name.
 */
export function getRoundName(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Final";
  if (round === totalRounds - 1) return "Semi-Finals";
  if (round === totalRounds - 2) return "Quarter-Finals";
  return `Round ${round}`;
}
