// Navbar scroll
window.addEventListener('scroll', () => {
  document.querySelector('.nav')?.classList.toggle('scrolled', window.scrollY > 50);
});
// Mobile menu toggle
document.addEventListener('click', e=>{
  if(e.target.closest('.menu-btn')){
    const m = document.getElementById('mobile-menu');
    if(m) m.style.display = m.style.display==='block'?'none':'block';
  }
});

// Render category cards on home
window.onSb(async (sb)=>{
  const grid = document.getElementById('cat-grid');
  if(grid){
    try{
      const cats = await window.api.listCategories();
      if(!cats.length){ grid.innerHTML='<p class="muted center" style="grid-column:1/-1">No categories yet. Add some from the admin dashboard.</p>'; return; }
      grid.innerHTML = cats.map((c,i)=>`
        <a class="cat-card fade-up" style="animation-delay:${i*0.08}s" href="products.html?category=${encodeURIComponent(c.name)}">
          ${c.image?`<img src="${c.image}" alt="${c.name}">`:'<div style="position:absolute;inset:0;background:linear-gradient(135deg,#22253a,#161821)"></div>'}
          <div class="overlay"></div>
          <div class="label">
            <h3>${c.name}</h3>
            ${c.description?`<p class="desc">${c.description}</p>`:''}
            <div class="arrow">Explore →</div>
          </div>
        </a>`).join('');
    }catch(e){ grid.innerHTML = `<p class="muted center" style="grid-column:1/-1">${e.message}</p>`; }
  }

  // Featured products on home
  const fp = document.getElementById('featured-products');
  if(fp){
    try{
      const ps = (await window.api.listProducts()).slice(0,8);
      renderProducts(fp, ps);
    }catch(e){ fp.innerHTML = `<p class="muted center" style="grid-column:1/-1">${e.message}</p>`; }
  }
});

window.renderProducts = function(grid, list){
  if(!list.length){ grid.innerHTML='<p class="muted center" style="grid-column:1/-1">No products yet.</p>'; return; }
  grid.innerHTML = list.map(p=>{
    const variants = Array.isArray(p.variants)?p.variants:[];
    const vid = `v_${p.id}`;
    return `
    <div class="product-card">
      <div class="img">${p.image?`<img src="${p.image}" alt="${p.name}">`:'<div style="width:100%;height:100%;background:#22253a"></div>'}</div>
      <div class="body">
        <span class="cat">${p.category||''}</span>
        <h3>${p.name}</h3>
        <p>${p.description||''}</p>
        ${variants.length>1?`
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px" data-variants="${vid}">
            ${variants.map((v,i)=>`<button class="variant-pill ${i===0?'active':''}" data-variant="${v}">${v}</button>`).join('')}
          </div>`:''}
        <div class="actions">
          <button class="btn btn-outline" data-add="${p.id}" data-vgroup="${vid}">Add to Quote</button>
          <a class="btn btn-gold" href="https://wa.me/${window.APP_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello, I am interested in: '+p.name)}" target="_blank">WhatsApp</a>
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-variants]').forEach(g=>{
    g.addEventListener('click', e=>{
      const b = e.target.closest('[data-variant]'); if(!b) return;
      g.querySelectorAll('.variant-pill').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    });
  });
  grid.querySelectorAll('[data-add]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.add;
      const p = list.find(x=>x.id===id);
      const g = btn.dataset.vgroup ? document.querySelector(`[data-variants="${btn.dataset.vgroup}"]`) : null;
      const v = g?.querySelector('.variant-pill.active')?.dataset.variant;
      window.cart.add(p, v);
    });
  });
};
