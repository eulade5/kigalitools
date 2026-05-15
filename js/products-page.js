window.onSb(async ()=>{
  const grid = document.getElementById('all-products');
  const filters = document.getElementById('filters');
  if(!grid) return;
  try{
    const [cats, prods] = await Promise.all([window.api.listCategories(), window.api.listProducts()]);
    const params = new URLSearchParams(location.search);
    let active = params.get('category') || 'All';
    const cnames = ['All', ...cats.map(c=>c.name)];
    filters.innerHTML = cnames.map(n=>`<button class="chip ${n===active?'active':''}" data-f="${n}">${n}</button>`).join('');
    const apply = ()=>{
      const list = active==='All' ? prods : prods.filter(p=>p.category===active);
      window.renderProducts(grid, list);
    };
    filters.addEventListener('click', e=>{
      const b = e.target.closest('[data-f]'); if(!b) return;
      active = b.dataset.f;
      filters.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', c.dataset.f===active));
      apply();
    });
    apply();
  }catch(e){
    grid.innerHTML = `<p class="muted center" style="grid-column:1/-1">${e.message}</p>`;
  }
});
