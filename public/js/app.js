
import { api, toast, fmt, qs, qsa, setUser, getUser, cartCount, state, track } from './api.js';

window.addEventListener('DOMContentLoaded', async ()=>{
  await getUser();
  await cartCount();
  route();
  window.addEventListener('hashchange', route);
  qs('#searchBox').addEventListener('keydown', (e)=>{
    if (e.key==='Enter') location.hash = '#/?q=' + encodeURIComponent(e.target.value);
  });
  window.addEventListener('keydown', e=>{
    if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); qs('#searchBox').focus(); }
  });
  qs('#logoutBtn')?.addEventListener('click', async ()=>{ await api('/api/auth/logout',{method:'POST'}); setUser(null); location.hash='#/login'; });
});

async function route(){
  const app = qs('#app');
  const [_, path] = location.hash.split('#/');
  const [view, query] = (path||'').split('?');
  const params = Object.fromEntries(new URLSearchParams(query||''));
  switch (view||''){
    case 'login': return renderLogin(app);
    case 'registro': return renderRegister(app);
    case 'perfil': return renderProfile(app);
    case 'producto': return renderProduct(app, params.id);
    case 'carrito': return renderCart(app);
    case 'checkout': return renderCheckout(app);
    case 'favoritos': return renderFavorites(app);
    case 'comparar': return renderCompare(app);
    case 'admin': return renderAdmin(app);
    default: return renderHome(app, params.q||'');
  }
}

async function renderHome(root, q=''){
  const data = await api('/api/products?search='+encodeURIComponent(q));
  track('view_home', { q });
  root.innerHTML = `
  <section class="hero">
    <div class="left">
      <h1>Encuentra tu próxima <span style="background:linear-gradient(90deg,#00e0ff,#7b61ff);-webkit-background-clip:text;background-clip:text;color:transparent">tecnología</span></h1>
      <p class="small">Compra como invitado o crea tu cuenta para acceder a favoritos, reseñas y <b>Plan Separe</b>.</p>
      <div class="flex">
        <a class="btn" href="#/">Explorar</a>
        <a class="btn-ghost" href="#/admin">Panel Admin</a>
      </div>
    </div>
    <img src="/assets/sample/iphone13.jpg" style="width:40%;border-radius:20px"/>
  </section>
  <h2>Productos ${q?`— buscando “${q}”`:''}</h2>
  <div class="grid grid-3" id="plist"></div>`;
  const cont = qs('#plist', root);
  data.products.forEach(p=>{
    const el = document.createElement('div');
    el.className='card';
    el.innerHTML = `
      <img src="${(p.images&&p.images[0])||'/assets/logo.svg'}"/>
      <div class="flex justify-between"><h3>${p.name}</h3><span class="badge">${fmt(p.price_cents)}</span></div>
      <p class="small">${p.description||''}</p>
      <div class="flex">
        <a class="btn" href="#/producto?id=${p.id}">Ver</a>
        <button class="btn-ghost add" data-id="${p.id}">Añadir</button>
      </div>
    `;
    cont.appendChild(el);
  });
  qsa('.add', root).forEach(b=> b.addEventListener('click', async (e)=>{
    const id = e.target.dataset.id;
    await api('/api/cart/items', { method:'POST', body: JSON.stringify({ product_id: Number(id), qty: 1 })});
    toast('Añadido al carrito'); cartCount(); track('add_to_cart', { product_id: Number(id) });
  }));
}

async function renderProduct(root, id){
  const { product } = await api('/api/products/'+id);
  track('view_product', { id: Number(id) });
  root.innerHTML = `
    <div class="grid" style="grid-template-columns: 1fr 1fr">
      <img src="${(product.images&&product.images[0])||'/assets/logo.svg'}"/>
      <div>
        <h2>${product.name}</h2>
        <p>${product.description||''}</p>
        <div class="flex"><span class="badge">${fmt(product.price_cents)}</span><span class="tag">${product.category||''}</span></div>
        <div class="flex" style="margin-top:8px">
          <button class="btn" id="addCart">Añadir al carrito</button>
          <button class="btn-ghost" id="buyNow">Comprar ahora</button>
          <button class="btn-ghost" id="addFav">❤️ Favorito</button>
          <button class="btn-ghost" id="addCompare">🔍 Comparar</button>
          <button class="btn" id="layaway">Plan Separe</button>
        </div>
      </div>
    </div>
    <h3>Reseñas</h3>
    <div id="reviews"></div>
    <div class="card">
      <h4>Escribir reseña</h4>
      <div class="flex">
        <select id="rating">
          <option value="5">5 ⭐</option>
          <option value="4">4 ⭐</option>
          <option value="3">3 ⭐</option>
          <option value="2">2 ⭐</option>
          <option value="1">1 ⭐</option>
        </select>
        <input class="input" id="comment" placeholder="Tu opinión"/>
        <button class="btn" id="sendReview">Publicar</button>
      </div>
    </div>
  `;
  qs('#addCart').addEventListener('click', async ()=>{
    await api('/api/cart/items',{method:'POST', body: JSON.stringify({ product_id:Number(id), qty:1 })});
    toast('Añadido al carrito'); cartCount(); track('add_to_cart', { product_id:Number(id) });
  });
  qs('#buyNow').addEventListener('click', async ()=>{
    await api('/api/cart/items',{method:'POST', body: JSON.stringify({ product_id:Number(id), qty:1 })});
    location.hash = '#/checkout';
  });
  qs('#addFav').addEventListener('click', async ()=>{
    try{
      await api('/api/cart/favorites/'+id, { method:'POST' });
      toast('Añadido a favoritos');
    }catch(e){ toast('Requiere iniciar sesión'); }
  });
  qs('#addCompare').addEventListener('click', ()=>{
    state.compare.add(Number(id)); toast('Añadido al comparador');
  });
  qs('#layaway').addEventListener('click', async ()=>{
    try{
      const r = await api('/api/layaway/create', { method:'POST', body: JSON.stringify({ product_id:Number(id), deposit_percent:20, installments:3 })});
      toast('Plan Separe creado. Paga el abono inicial en Admin > Layaway (mock).');
    }catch(e){ toast('Plan Separe requiere sesión'); }
  });
  const rev = await api('/api/products/'+id+'/reviews');
  const revBox = qs('#reviews');
  rev.reviews.forEach(r=>{
    const d = document.createElement('div'); d.className='card';
    d.innerHTML = `<b>${r.user_name}</b> — ${'⭐'.repeat(r.rating)}<div class="small">${r.comment||''}</div>`;
    revBox.appendChild(d);
  });
  qs('#sendReview').addEventListener('click', async ()=>{
    try{
      await api('/api/products/'+id+'/reviews', { method:'POST', body: JSON.stringify({ rating: Number(qs('#rating').value), comment: qs('#comment').value })});
      toast('Gracias por tu reseña'); route();
    }catch(e){ toast('Inicia sesión para reseñar'); }
  })
}

async function renderCart(root){
  const { items } = await api('/api/cart');
  root.innerHTML = `
    <h2>Carrito</h2>
    <table class="table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th></th></tr></thead>
    <tbody id="rows"></tbody></table>
    <div class="flex">
      <input id="coupon" class="input" placeholder="Cupón de descuento"/>
      <button class="btn" id="applyCoupon">Aplicar cupón</button>
      <div id="totals"></div>
    </div>
    <div class="flex" style="margin-top:10px"><a class="btn" href="#/checkout">Proceder al pago</a></div>
  `;
  const tbody = qs('#rows');
  let total = 0;
  items.forEach(it=>{
    const sub = it.discounted_price_cents * it.qty; total += sub;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${it.name}</td><td>${it.qty}</td><td>${fmt(it.discounted_price_cents)}</td><td>${fmt(sub)}</td><td><button class="btn-ghost del" data-id="${it.id}">Quitar</button></td>`;
    tbody.appendChild(tr);
  });
  qs('#totals').textContent = 'Total parcial: '+fmt(total);
  qsa('.del').forEach(b=>b.addEventListener('click', async (e)=>{
    await api('/api/cart/items/'+e.target.dataset.id, { method:'DELETE' }); toast('Eliminado'); route();
  }));
  qs('#applyCoupon').addEventListener('click', async ()=>{
    try{
      const code = qs('#coupon').value.trim();
      const r = await api('/api/cart/apply-coupon', { method:'POST', body: JSON.stringify({ code })});
      qs('#totals').textContent = `Subtotal: ${fmt(r.totals.subtotal)} | Desc: -${fmt(r.totals.discount)} | IVA: ${fmt(r.totals.tax)} | Total: ${fmt(r.totals.total)}`;
    }catch(e){ toast(e.message); }
  });
}

async function renderCheckout(root){
  const { items } = await api('/api/cart');
  if (!items.length){ root.innerHTML='<p>Tu carrito está vacío.</p>'; return; }
  root.innerHTML = `
    <h2>Checkout</h2>
    <div class="grid" style="grid-template-columns: 2fr 1fr">
      <div class="card">
        <h3>Datos</h3>
        <input class="input" id="email" placeholder="Email (para recibos y notificaciones)"/>
        <textarea class="input" id="shipping" placeholder='Dirección de envío (JSON {"street":"...","city":"..."})'></textarea>
        <textarea class="input" id="billing" placeholder='Dirección de facturación (JSON)'></textarea>
        <input class="input" id="cup" placeholder="Cupón (opcional)"/>
        <select id="method" class="input">
          <option value="card">Tarjeta</option>
          <option value="pse">PSE</option>
          <option value="wallet">Billetera</option>
        </select>
        <button class="btn" id="pay">Generar orden y pagar</button>
      </div>
      <div class="card">
        <h3>Resumen</h3>
        <ul id="sum"></ul>
      </div>
    </div>
  `;
  const ul = qs('#sum');
  items.forEach(it=>{
    const li = document.createElement('li');
    li.textContent = `${it.name} x${it.qty} — ${fmt(it.discounted_price_cents)}`;
    ul.appendChild(li);
  });
  qs('#pay').addEventListener('click', async ()=>{
    try{
      track('checkout_started', {});
      const r = await api('/api/orders/checkout',{ method:'POST', body: JSON.stringify({
        email: qs('#email').value,
        shipping: JSON.parse(qs('#shipping').value||'{}'),
        billing: JSON.parse(qs('#billing').value||'{}'),
        coupon_code: qs('#cup').value.trim()||null,
        payment_method: qs('#method').value
      })});
      if (r.status==='under_review'){ toast('Tu orden está en revisión.'); return; }
      const p = await api('/api/payments/init', { method:'POST', body: JSON.stringify({ order_id:r.order_id, method: qs('#method').value })});
      location.href = p.redirect_url;
    }catch(e){ toast(e.message); }
  });
}

async function renderLogin(root){
  root.innerHTML = `
    <div class="grid" style="grid-template-columns: 1fr 1fr">
      <div class="card">
        <h3>Iniciar sesión</h3>
        <input class="input" id="lemail" placeholder="Email"/>
        <input class="input" id="lpass" type="password" placeholder="Contraseña"/>
        <button class="btn" id="login">Entrar</button>
        <p class="small">¿Sin cuenta? <a href="#/registro">Regístrate</a></p>
      </div>
      <div class="card">
        <h3>Crear cuenta</h3>
        <input class="input" id="rname" placeholder="Nombre"/>
        <input class="input" id="remail" placeholder="Email"/>
        <input class="input" id="rpass" type="password" placeholder="Contraseña"/>
        <button class="btn" id="register">Registrar</button>
      </div>
    </div>
  `;
  qs('#login').addEventListener('click', async ()=>{
    try{
      const r = await api('/api/auth/login', { method:'POST', body: JSON.stringify({ email: qs('#lemail').value, password: qs('#lpass').value })});
      setUser(r.user); toast('Bienvenido'); location.hash = '#/';
    }catch(e){ toast(e.message); }
  });
  qs('#register').addEventListener('click', async ()=>{
    try{
      const r = await api('/api/auth/register', { method:'POST', body: JSON.stringify({ name: qs('#rname').value, email: qs('#remail').value, password: qs('#rpass').value })});
      setUser(r.user); toast('Cuenta creada'); location.hash = '#/';
    }catch(e){ toast(e.message); }
  });
}

async function renderRegister(root){ location.hash = '#/login'; }

async function renderProfile(root){
  try{
    const { user } = await api('/api/auth/profile');
    root.innerHTML = `
      <h2>Perfil</h2>
      <div class="card">
        <input class="input" id="name" value="${user.name||''}" placeholder="Nombre"/>
        <textarea class="input" id="addr" placeholder="Dirección (JSON)">${JSON.stringify(user.address||{})}</textarea>
        <button class="btn" id="save">Guardar</button>
      </div>
    `;
    qs('#save').addEventListener('click', async ()=>{
      await api('/api/auth/profile', { method:'PUT', body: JSON.stringify({ name: qs('#name').value, address: JSON.parse(qs('#addr').value||'{}') })});
      toast('Actualizado');
    });
  }catch(e){
    root.innerHTML = `<p>Debes iniciar sesión.</p>`;
  }
}

async function renderFavorites(root){
  try{
    const r = await api('/api/cart/favorites');
    root.innerHTML = `<h2>Favoritos</h2><div id="favs" class="grid grid-3"></div>`;
    const c = qs('#favs');
    r.favorites.forEach(p=>{
      const el = document.createElement('div'); el.className='card';
      el.innerHTML = `<img src="${(p.images&&p.images[0])||'/assets/logo.svg'}"/><h3>${p.name}</h3><div class="badge">${fmt(p.price_cents)}</div>`;
      c.appendChild(el);
    });
  }catch(e){ root.innerHTML = `<p>Inicia sesión para ver favoritos.</p>`; }
}

async function renderCompare(root){
  root.innerHTML = `<h2>Comparar productos</h2><div id="cmp"></div>`;
  const ids = Array.from(state.compare.values());
  if (!ids.length){ qs('#cmp').innerHTML='<p>No has agregado productos al comparador.</p>'; return; }
  const r = await api('/api/products/compare', { method:'POST', body: JSON.stringify({ ids })});
  const table = document.createElement('table'); table.className='table';
  const head = document.createElement('tr');
  head.innerHTML = '<th>Atributo</th>' + r.products.map(p=>`<th>${p.name}</th>`).join('');
  const body = document.createElement('tbody');
  const rows = [
    ['Precio', ...r.products.map(p=>fmt(p.price_cents))],
    ['Stock', ...r.products.map(p=>p.stock)],
    ['Categoría', ...r.products.map(p=>p.category||'')]
  ];
  rows.forEach(rw=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${rw[0]}</td>` + rw.slice(1).map(v=>`<td>${v}</td>`).join('');
    body.appendChild(tr);
  });
  table.appendChild(head); table.appendChild(body);
  qs('#cmp').appendChild(table);
}

async function renderAdmin(root){
  // Simple admin: productos y cupones
  root.innerHTML = `
    <h2>Admin</h2>
    <div class="grid" style="grid-template-columns: 1fr 1fr">
      <div class="card">
        <h3>Productos</h3>
        <div id="plist"></div>
        <hr/>
        <h4>Nuevo/Editar</h4>
        <input class="input" id="sku" placeholder="SKU"/>
        <input class="input" id="pname" placeholder="Nombre"/>
        <input class="input" id="pprice" placeholder="Precio (centavos)"/>
        <input class="input" id="pstock" placeholder="Stock"/>
        <input class="input" id="pcat" placeholder="Categoría"/>
        <textarea class="input" id="pdesc" placeholder="Descripción"></textarea>
        <button class="btn" id="saveP">Guardar</button>
      </div>
      <div class="card">
        <h3>Cupones</h3>
        <div id="clist"></div>
        <hr/>
        <h4>Nuevo Cupón</h4>
        <input class="input" id="ccode" placeholder="Código"/>
        <select class="input" id="ckind"><option value="percent">% Porcentaje</option><option value="fixed">Fijo (centavos)</option></select>
        <input class="input" id="cvalue" placeholder="Valor"/>
        <button class="btn" id="saveC">Guardar</button>
      </div>
    </div>
  `;
  const prods = await api('/api/products');
  const plist = qs('#plist');
  prods.products.forEach(p=>{
    const el = document.createElement('div'); el.className='flex justify-between'; el.innerHTML = `<div>${p.name} — ${fmt(p.price_cents)} — stock ${p.stock}</div><div><a class="btn-ghost" href="#/producto?id=${p.id}">Ver</a></div>`;
    plist.appendChild(el);
  });
  qs('#saveP').addEventListener('click', async ()=>{
    await api('/api/products', { method:'POST', body: JSON.stringify({
      sku: qs('#sku').value, name: qs('#pname').value, price_cents: Number(qs('#pprice').value), stock: Number(qs('#pstock').value), category: qs('#pcat').value, description: qs('#pdesc').value, images: []
    })});
    toast('Producto guardado'); route();
  });
  const coupons = await api('/api/coupons');
  const clist = qs('#clist');
  coupons.coupons.forEach(c=>{
    const el = document.createElement('div'); el.className='flex justify-between'; el.innerHTML = `<div>${c.code} — ${c.kind} ${c.value}</div>`; clist.appendChild(el);
  });
  qs('#saveC').addEventListener('click', async ()=>{
    await api('/api/coupons', { method:'POST', body: JSON.stringify({ code: qs('#ccode').value, kind: qs('#ckind').value, value: Number(qs('#cvalue').value) })});
    toast('Cupón creado'); route();
  });
}
