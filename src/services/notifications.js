import fs from 'fs';
import path from 'path';
import { run } from '../db/db.js';

export async function notify(
  db,
  { user_id = null, email, subject, body, meta = {} }
) {
  const notifDir = path.join(process.cwd(), 'notifications');
  if (!fs.existsSync(notifDir)) fs.mkdirSync(notifDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(
    notifDir,
    `${ts}-${(subject || 'notificacion').replace(/\s+/g, '-')}.txt`
  );
  const content = `Para: ${email}\nAsunto: ${subject}\n\n${body}\n\n${JSON.stringify(
    meta,
    null,
    2
  )}`;
  fs.writeFileSync(filename, content, 'utf-8');
  await run(
    db,
    `INSERT INTO notifications (user_id,email,subject,body,meta) VALUES ($1,$2,$3,$4,$5)`,
    [user_id, email, subject, body, JSON.stringify(meta)]
  );
}
