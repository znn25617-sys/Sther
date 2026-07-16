/*
# Create high_scores table (single-tenant, no auth — public leaderboard)

1. New Tables
- `high_scores`
  - `id` (uuid, primary key)
  - `player_name` (text, not null) — display name entered on game over
  - `score` (integer, not null) — points collected during the run
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `high_scores`.
- Allow anon + authenticated to read all rows (leaderboard is intentionally public).
- Allow anon + authenticated to insert new scores (anyone can submit).
- No update or delete from the client (scores are immutable once submitted).
3. Indexes
- Index on `score` descending for fast top-10 leaderboard queries.
4. Notes
- This is a single-tenant game with no sign-in screen, so the anon-key client
  must be able to read and write. Policies use `TO anon, authenticated` with
  `USING (true)` / `WITH CHECK (true)` because the data is intentionally shared.
*/

CREATE TABLE IF NOT EXISTS high_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_high_scores" ON high_scores;
CREATE POLICY "anon_select_high_scores"
ON high_scores FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_high_scores" ON high_scores;
CREATE POLICY "anon_insert_high_scores"
ON high_scores FOR INSERT
TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS high_scores_score_desc_idx
ON high_scores (score DESC);
