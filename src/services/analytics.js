import { run } from '../db/db.js';

export async function recordEvent(
  db,
  { session_id, user_id = null, event_type, payload = {} }
) {
  await run(
    db,
    `INSERT INTO analytics_events (session_id,user_id,event_type,payload) VALUES ($1,$2,$3,$4)`,
    [session_id, user_id, event_type, JSON.stringify(payload)]
  );
}
