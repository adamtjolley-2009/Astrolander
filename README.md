# Astrolander

A browser tribute to the **Astrolander** minigame from *TimeSplitters 2*. Pilot a lunar lander down through increasingly deep, narrow caverns and touch down on the landing pad with as much fuel, as little speed, and as much precision as you can.

## Controls
| Action | Touch | Keyboard |
| --- | --- | --- |
| Rotate left | ◀ | ← / A |
| Rotate right | ▶ | → / D |
| Throttle | THRUST | ↑ / W / Space |
| Pause | II | Esc / P |

## Scoring (per landing)
- **Fuel remaining**: units left in the tank
- **Fuel bonus**: 5 points per unit of fuel left
- **Landing speed bonus**: up to 1000, more the softer you touch down
- **Landing accuracy bonus**: up to 1000, more the closer you land to the pad centre

A safe landing needs both feet on the pad, the ship within ~12° of upright, vertical speed ≤ 4.2 and horizontal speed ≤ 2.2. You have 3 ships.

## Stack
- `public/`: static HTML5 canvas game (no build step)
- `api/scores.js`: Vercel serverless function for the high-score table
- Neon Postgres via `@neondatabase/serverless`. Set `DATABASE_URL` (added automatically by the Vercel ↔ Neon integration). The `scores` table is created on first request; see `schema.sql`.
