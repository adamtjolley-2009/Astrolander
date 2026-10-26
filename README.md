# Astrolander

A browser tribute to the **Astrolander** minigame from *TimeSplitters 2*. Pilot a lunar lander and touch down on the landing pad with as much fuel, as little speed, and as much precision as you can.

## Levels
Levels are generated from their number, so everyone flies the same maps, and they never run out. There are four kinds:
- **Open**: wide sky over hilly ground (levels 1 and 3)
- **Peak**: you start low beside a mountain and land on its summit (levels 2, 5, 9)
- **Canyon**: a winding shaft straight down (levels 4, 7)
- **Snake**: switchback tunnels that zig-zag back and forth on the way down (levels 6, 8, 10)

After level 10 they cycle snake, canyon, snake, peak, with smaller pads and longer snakes.

## Controls
| Action | Touch | Keyboard |
| --- | --- | --- |
| Rotate left | ◀ | ← / A |
| Rotate right | ▶ | → / D |
| Throttle | THRUST | ↑ / W / Space |
| Pause | II | Esc / P |
| Mute music | ♫ | M |

## Scoring (per landing)
- **Fuel remaining**: units left in the tank
- **Fuel bonus**: 5 points per unit of fuel left
- **Landing speed bonus**: up to 1000, more the softer you touch down
- **Landing accuracy bonus**: up to 1000, more the closer you land to the pad centre

A safe landing needs both feet on the pad, the ship within ~18° of upright, vertical speed ≤ 6.0 and horizontal speed ≤ 3.2. You have 3 ships.

## Stack
- `public/`: static HTML5 canvas game (no build step), with `astrolander.mp3` looping as background music once you press a key or tap
- `api/scores.js`: Vercel serverless function for the high-score table
- Neon Postgres via `@neondatabase/serverless`. Set `DATABASE_URL` (added automatically by the Vercel ↔ Neon integration). The `scores` table is created on first request; see `schema.sql`.
