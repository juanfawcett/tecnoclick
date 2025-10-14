
import { v4 as uuidv4 } from 'uuid';

export function trackSession(req, res, next) {
  let sid = req.cookies['tc_sid'];
  if (!sid) {
    sid = uuidv4();
    res.cookie('tc_sid', sid, { httpOnly: false, sameSite: 'Lax', maxAge: 1000*60*60*24*365 });
  }
  req.sessionId = sid;
  next();
}
