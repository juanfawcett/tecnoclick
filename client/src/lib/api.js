export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = 'Error';
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export function fmtCOP(cents) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
  }).format((cents || 0) / 100);
}

export function track(event_type, payload = {}) {
  try {
    return api(`${import.meta.env.VITE_API_URL}/api/analytics/event`, {
      method: 'POST',
      body: { event_type, payload },
    });
  } catch {}
}

export const CompareStore = {
  key: 'tc_compare',
  add(id) {
    const ids = this.all();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(this.key, JSON.stringify(ids));
      window.dispatchEvent(new Event('compare:update'));
    }
  },
  all() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || '[]');
    } catch {
      return [];
    }
  },
  remove(id) {
    const ids = this.all().filter((x) => x !== id);
    localStorage.setItem(this.key, JSON.stringify(ids));
    window.dispatchEvent(new Event('compare:update'));
  },
};
