# Astrolander

A browser tribute to the **AstroLander** cartridge from *TimeSplitters 2* (played on the Temporal Uplink). Eleven single-screen levels of thin green terrain: touch down on the pad with as much fuel, as little speed, and as much precision as you can. You have 4 ships; crashing restarts the level.

## Controls
| Action | Touch | Keyboard |
| --- | --- | --- |
| Rotate left | ◀ | ← / A |
| Rotate right | ▶ | → / D |
| Throttle | THRUST | ↑ / W / Space |
| Pause | II | Esc / P |
| OK (dialogs) | tap screen / THRUST | Enter |

## Scoring (per landing)
- **Fuel remaining**: percentage of the tank left
- **Fuel bonus**: fuel % × the level's maximum (14,000 to 32,000)
- **Landing speed bonus**: up to 5,000, more the softer you touch down
- **Landing accuracy bonus**: up to 5,000, more the closer you land to the pad centre

A safe landing needs both feet on the pad, the ship within ~12° of upright, and a slow touchdown. Touching any terrain or the frame is a crash.

## Stack
- `public/`: static HTML5 canvas game (no build step)
- `api/scores.js`: Vercel serverless function for the high-score table
- Neon Postgres via `@neondatabase/serverless`. Set `DATABASE_URL` (added automatically by the Vercel ↔ Neon integration). The `scores` table is created on first request; see `schema.sql`.
