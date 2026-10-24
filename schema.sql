-- Created automatically by api/scores.js on first request; kept here for reference.
CREATE TABLE IF NOT EXISTS scores (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(12) NOT NULL,
  score      INTEGER NOT NULL CHECK (score >= 0),
  level      INTEGER NOT NULL CHECK (level >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC);
