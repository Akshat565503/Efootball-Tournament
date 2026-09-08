import { Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase";
import { AuthRequest } from "../types";

/**
 * Admin-only middleware — checks if the authenticated user has the 'owner' role.
 * Must be used AFTER the `authenticate` middleware.
 */
export async function adminOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.userProfile) {
    res.status(403).json({ error: "Forbidden: Profile not found" });
    return;
  }

  if (req.userProfile.role !== "owner") {
    res.status(403).json({ error: "Forbidden: Owner access required" });
    return;
  }

  next();
}

/**
 * Tournament owner middleware — checks if the user owns the specific tournament.
 * Expects `req.params.id` or `req.params.tournamentId` to be the tournament ID.
 * Must be used AFTER the `authenticate` middleware.
 */
export async function tournamentOwnerOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const tournamentId = req.params.id || req.params.tournamentId;

  if (!tournamentId) {
    res.status(400).json({ error: "Tournament ID required" });
    return;
  }

  const { data: tournament } = await supabaseAdmin
    .from("tournaments")
    .select("owner_id")
    .eq("id", tournamentId)
    .single();

  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }

  if (tournament.owner_id !== req.user.sub) {
    res.status(403).json({ error: "Forbidden: You do not own this tournament" });
    return;
  }

  next();
}
