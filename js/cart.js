(function(){
  const KEY = 'atc_cart_v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } };
  const write = (arr) => { localStorage.setItem(KEY, JSON.stringify(arr)); render(); };

  window.cart = {
    items(){ return read(); },
    count(){ return read().reduce((n,i)=>n+i.qty,0); },
    add(p, variant){
      const arr = read();
      const key = `${p.id}__${variant||''}`;
      const ex = arr.find(i=>i.key===key);
      if(ex) ex.qty += 1; else arr.push({key, id:p.id, name:p.name, image:p.image, variant:variant||'', qty:1});
      write(arr);
      openDrawer();
    },
    setQty(key, qty){
      const arr = read().map(i=>i.key===key?{...i,qty:Math.max(1,qty)}:i); write(arr);
    },
    remove(key){ write(read().filter(i=>i.key!==key)); },
    clear(){ write([]); }
  };

  function buildWaUrl(){
    const items = read();
    if(!items.length) return null;
    const lines = items.map(i=>`• ${i.name}${i.variant?' ('+i.variant+')':''} × ${i.qty}`);
    const msg = `Hello ${window.APP_CONFIG.COMPANY},%0A%0AI'd like a quotation for:%0A${encodeURIComponent(lines.join('\n'))}%0A%0AThank you.`;
    return `https://wa.me/${window.APP_CONFIG.WHATSAPP_NUMBER}?text=${msg}`;
  }

  function render(){
    document.querySelectorAll('[data-cart-count]').forEach(el=>{
      const n = window.cart.count();
      el.textContent = n;
      el.style.display = n>0?'flex':'none';
    });
    const body = document.getElementById('cart-body');
    if(!body) return;
    const items = read();
    if(!items.length){ body.innerHTML = '<p class="muted center" style="padding:40px 0">Your basket is empty.</p>'; }
    else {
      body.innerHTML = items.map(i=>`
        <div class="cart-item">
          ${i.image?`<img src="${i.image}" alt="">`:'<div style="width:64px;height:64px;border-radius:10px;background:#2a2d44"></div>'}
          <div class="info">
            <h4>${i.name}</h4>
            ${i.variant?`<p>${i.variant}</p>`:''}
            <div class="qty">
              <button data-cart-dec="${i.key}">−</button>
              <span>${i.qty}</span>
              <button data-cart-inc="${i.key}">+</button>
              <button class="icon-btn" style="margin-left:auto;font-size:11px" data-cart-rm="${i.key}">Remove</button>
            </div>
          </div>
        </div>`).join('');
    }
    const wa = document.getElementById('cart-wa');
    if(wa){
      const url = buildWaUrl();
      if(url){ wa.href=url; wa.classList.remove('disabled'); wa.style.opacity='1'; wa.style.pointerEvents='auto'; }
      else { wa.removeAttribute('href'); wa.style.opacity='.5'; wa.style.pointerEvents='none'; }
    }
  }

  function openDrawer(){
    document.getElementById('cart-drawer')?.classList.add('open');
    document.getElementById('cart-bg')?.classList.add('open');
  }
  function closeDrawer(){
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.getElementById('cart-bg')?.classList.remove('open');
  }
  window.openCart = openDrawer;
  window.closeCart = closeDrawer;

  document.addEventListener('click', e=>{
    const t = e.target.closest('[data-cart-inc],[data-cart-dec],[data-cart-rm],[data-open-cart],[data-close-cart]');
    if(!t) return;
    if(t.dataset.openCart!==undefined) return openDrawer();
    if(t.dataset.closeCart!==undefined) return closeDrawer();
    const items = read();
    if(t.dataset.cartInc){ const k=t.dataset.cartInc; const it=items.find(i=>i.key===k); if(it) window.cart.setQty(k, it.qty+1); }
    if(t.dataset.cartDec){ const k=t.dataset.cartDec; const it=items.find(i=>i.key===k); if(it) window.cart.setQty(k, it.qty-1); }
    if(t.dataset.cartRm) window.cart.remove(t.dataset.cartRm);
  });

  document.addEventListener('DOMContentLoaded', render);
})();
