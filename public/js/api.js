
export async function api(path, opts={}){
  const res = await fetch(path, { credentials:'include', headers: { 'Content-Type':'application/json' }, ...opts });
  if (!res.ok) {
    let msg = 'Error';
    try{ const j = await res.json(); msg = j.error || msg; }catch{}
    throw new Error(msg);
  }
  return res.json();
}
export function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1600);
}
export function fmt(cents){ return new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP'}).format(cents/100); }
export function qs(s,root=document){ return root.querySelector(s); }
export function qsa(s,root=document){ return Array.from(root.querySelectorAll(s)); }
export const state = { user: null, compare: new Set(), favorites: new Set() };
export function setUser(u){
  state.user = u;
  document.getElementById('loginBtn').classList.toggle('hidden', !!u);
  document.getElementById('userMenu').classList.toggle('hidden', !u);
  if (u && u.role!=='admin') qs('a[href="#/admin"]').classList.add('hidden'); else qs('a[href="#/admin"]').classList.remove('hidden');
}
export async function getUser(){
  try{
    const data = await api('/api/auth/profile');
    setUser(data.user);
  }catch{ setUser(null); }
}
export async function cartCount(){
  try{
    const data = await api('/api/cart');
    qs('#cartCount').textContent = data.items.reduce((s,i)=>s+i.qty,0);
  }catch(e){}
}
export async function track(event_type, payload={}){
  try{ await api('/api/analytics/event',{ method:'POST', body: JSON.stringify({ event_type, payload })}); }catch(e){}
}
