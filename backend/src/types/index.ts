// ─── Shared TypeScript Types ─────────────────────────────────────────────────

import { Request } from "express";

// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = "owner" | "participant";
export type TournamentStatus = "draft" | "open" | "in_progress" | "completed" | "cancelled";
export type MatchStatus = "scheduled" | "live" | "completed";
export type NotificationType =
  | "match_upcoming"
  | "match_live"
  | "match_result"
  | "round_complete"
  | "tournament_started"
  | "tournament_completed"
  | "player_joined"
  | "you_advanced"
  | "you_eliminated";

// ─── Database Models ─────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  favorite_club: string | null;
  region: string | null;
  efootball_id: string | null;
  role: UserRole;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tournament {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  theme: string | null;
  ruleset: string;
  eligibility_filter: Record<string, unknown>;
  status: TournamentStatus;
  max_players: number;
  current_round: number;
  start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TournamentParticipant {
  tournament_id: string;
  user_id: string;
  seed: number | null;
  joined_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  match_order: number;
  player1_id: string | null;
  player2_id: string | null;
  score1: number;
  score2: number;
  status: MatchStatus;
  winner_id: string | null;
  is_bye: boolean;
  live_minute: number | null;
  live_notes: string | null;
  stream_url: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  tournament_id: string | null;
  match_id: string | null;
  created_at: string;
}

// ─── Extended Request with Auth ──────────────────────────────────────────────

export interface JWTPayload {
  sub: string;       // user id
  email?: string;
  role?: string;
  aud?: string;
  iss?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
  userProfile?: Profile;
}

// ─── API DTOs ────────────────────────────────────────────────────────────────

export interface CreateTournamentDTO {
  name: string;
  description?: string;
  banner_url?: string;
  theme?: string;
  ruleset?: string;
  eligibility_filter?: Record<string, unknown>;
  max_players?: number;
  start_date?: string;
}

export interface UpdateScoreDTO {
  score1: number;
  score2: number;
}

export interface LiveUpdateDTO {
  live_minute?: number;
  live_notes?: string;
  stream_url?: string;
}

export interface UpdateProfileDTO {
  username?: string;
  display_name?: string;
  avatar_url?: string;
  favorite_club?: string;
  region?: string;
  efootball_id?: string;
  bio?: string;
}

// ─── Tournament with relations ───────────────────────────────────────────────

export interface TournamentDetail extends Tournament {
  owner?: Profile;
  participants?: (TournamentParticipant & { profile?: Profile })[];
  matches?: Match[];
  participant_count?: number;
}

// ─── Socket.io Events ────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  "match:updated": (match: Match) => void;
  "match:live_note": (data: { matchId: string; minute: number | null; notes: string | null }) => void;
  "tournament:bracket_updated": (data: { tournamentId: string; matches: Match[] }) => void;
  "tournament:round_complete": (data: { tournamentId: string; round: number }) => void;
  "tournament:status_changed": (data: { tournamentId: string; status: TournamentStatus }) => void;
  "notification:new": (notification: Notification) => void;
  "participant:joined": (data: { tournamentId: string; profile: Profile }) => void;
}

export interface ClientToServerEvents {
  "tournament:join_room": (tournamentId: string) => void;
  "tournament:leave_room": (tournamentId: string) => void;
}
