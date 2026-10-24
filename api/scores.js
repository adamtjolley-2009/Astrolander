import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = connectionString ? neon(connectionString) : null;
let schemaReady = null;

function ensureSchema() {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS scores (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(12) NOT NULL,
        score      INTEGER NOT NULL CHECK (score >= 0),
        level      INTEGER NOT NULL CHECK (level >= 1),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`.then(() => sql`CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC)`)
      .catch((err) => { schemaReady = null; throw err; });
  }
  return schemaReady;
}

const topScores = () =>
  sql`SELECT id, name, score, level, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 10`;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!sql) return res.status(503).json({ error: 'Database not configured' });

  try {
    await ensureSchema();

    if (req.method === 'GET') {
      return res.status(200).json({ scores: await topScores() });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const name = String(body.name || '').toUpperCase().replace(/[^A-Z0-9 _.-]/g, '').trim().slice(0, 12);
      const score = Number(body.score);
      const level = Number(body.level);
      if (!name) return res.status(400).json({ error: 'Name required' });
      if (!Number.isInteger(score) || score < 0 || score > 10_000_000) return res.status(400).json({ error: 'Invalid score' });
      if (!Number.isInteger(level) || level < 1 || level > 999) return res.status(400).json({ error: 'Invalid level' });

      const [row] = await sql`INSERT INTO scores (name, score, level) VALUES (${name}, ${score}, ${level}) RETURNING id`;
      return res.status(201).json({ id: row.id, scores: await topScores() });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
