# Astrolander

A browser tribute to the **Astrolander** minigame from *TimeSplitters 2*. Pilot a lunar lander and touch down on the landing pad with as much fuel, as little speed, and as much precision as you can.

## Levels
Nine fixed levels, the same for every player. Land on all of them to complete the mission.

| # | Type | What it's like |
| --- | --- | --- |
| 1 | Open | Wide sky over gentle hills |
| 2 | Open | Hills with a couple of tall spires |
| 3 | Peak | Start low at the bottom right and land on a mountain top |
| 4 | Cliff | Start at the bottom of a canyon and climb to a pad on a ledge |
| 5 | Cavern | Drop down a shaft, cross the bottom, then climb up to a chamber with the pad |
| 6 | Canyon | A winding shaft straight down |
| 7 | Canyon | A deep, winding canyon |
| 8 | Snake | Switchback tunnels zig-zagging down, with rough rocky walls |
| 9 | Canyon | The longest canyon |

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
