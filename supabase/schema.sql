-- ============================================================================
-- eFootball Tournament Platform — Supabase Postgres Schema
-- ============================================================================

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('owner', 'participant');
CREATE TYPE tournament_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'completed');
CREATE TYPE notification_type AS ENUM (
  'match_upcoming',
  'match_live',
  'match_result',
  'round_complete',
  'tournament_started',
  'tournament_completed',
  'player_joined',
  'you_advanced',
  'you_eliminated'
);

-- ─── Profiles ───────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  favorite_club TEXT,
  region        TEXT,
  efootball_id  TEXT,
  role          user_role NOT NULL DEFAULT 'participant',
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_region ON profiles(region);

-- ─── Tournaments ────────────────────────────────────────────────────────────

CREATE TABLE tournaments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  banner_url          TEXT,
  theme               TEXT,                          -- e.g. "Serie A Only", "Home Nation Heroes"
  ruleset             TEXT NOT NULL DEFAULT 'Friend Match',
  eligibility_filter  JSONB DEFAULT '{}'::jsonb,     -- { league, club, country, region }
  status              tournament_status NOT NULL DEFAULT 'draft',
  max_players         INT NOT NULL DEFAULT 8 CHECK (max_players BETWEEN 2 AND 8),
  current_round       INT DEFAULT 0,
  start_date          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_owner ON tournaments(owner_id);
CREATE INDEX idx_tournaments_created ON tournaments(created_at DESC);

-- ─── Tournament Participants ────────────────────────────────────────────────

CREATE TABLE tournament_participants (
  tournament_id  UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seed           INT,                                -- seeding position (optional)
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tournament_id, user_id)
);

CREATE INDEX idx_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_participants_user ON tournament_participants(user_id);

-- ─── Matches ────────────────────────────────────────────────────────────────

CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round           INT NOT NULL,                      -- 1 = QF, 2 = SF, 3 = Final (for 8 players)
  match_order     INT NOT NULL,                      -- position within the round (1-4 for QF, etc.)
  player1_id      UUID REFERENCES profiles(id),      -- NULL if TBD (waiting for previous round)
  player2_id      UUID REFERENCES profiles(id),      -- NULL if TBD or bye
  score1          INT DEFAULT 0,
  score2          INT DEFAULT 0,
  status          match_status NOT NULL DEFAULT 'scheduled',
  winner_id       UUID REFERENCES profiles(id),
  is_bye          BOOLEAN NOT NULL DEFAULT FALSE,    -- true if one player advances automatically
  live_minute     INT,                               -- current game minute (manual update)
  live_notes      TEXT,                              -- running commentary
  stream_url      TEXT,                              -- optional YouTube/Twitch embed URL
  scheduled_at    TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_tournament_round ON matches(tournament_id, round);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_players ON matches(player1_id, player2_id);

-- ─── Notifications ──────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  tournament_id   UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  match_id        UUID REFERENCES matches(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ─── Updated At Trigger ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security (basic policies) ────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tournaments: public read, owner write
CREATE POLICY tournaments_select ON tournaments FOR SELECT USING (true);
CREATE POLICY tournaments_insert ON tournaments FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY tournaments_update ON tournaments FOR UPDATE USING (auth.uid() = owner_id);

-- Participants: public read, self join
CREATE POLICY participants_select ON tournament_participants FOR SELECT USING (true);
CREATE POLICY participants_insert ON tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY participants_delete ON tournament_participants FOR DELETE USING (auth.uid() = user_id);

-- Matches: public read, tournament owner write
CREATE POLICY matches_select ON matches FOR SELECT USING (true);
CREATE POLICY matches_insert ON matches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM tournaments WHERE id = tournament_id AND owner_id = auth.uid())
);
CREATE POLICY matches_update ON matches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM tournaments WHERE id = tournament_id AND owner_id = auth.uid())
);

-- Notifications: own read/write only
CREATE POLICY notifications_select ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (auth.uid() = user_id);
