// Admin dashboard logic — plain JS, Supabase auth + CRUD
let editing = null;
let cachedCats = [];
let cachedProds = [];

const $ = (id) => document.getElementById(id);
function showError(id, msg) { const el = $(id); if (el) el.textContent = msg || ''; }
function setStatus(msg) { const el = $('prod-count'); if (el) el.textContent = msg; }

// Boot when Supabase client is ready
window.onSb(async (sb) => {
  // Wire login form immediately so it works regardless of session state
  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('login-err', '');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';
    try {
      const email = $('email').value.trim();
      const password = $('password').value;
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // No admin-email restriction — any authenticated user can manage
      await enterDashboard(data.user);
    }
    alert('Login successful'); catch (err) {
      showError('login-err', err.message || 'Sign in failed');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Restore existing session if present
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) await enterDashboard(session.user);
  } catch (err) {
    console.error('getSession failed', err);
  }

  // React to auth changes (sign out in another tab, token refresh, etc.)
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      $('dashboard').style.display = 'none';
      $('login-screen').style.display = 'flex';
    }
  });
});

async function enterDashboard(user) {
  $('login-screen').style.display = 'none';
  $('dashboard').style.display = 'block';
  $('who').textContent = user.email;

  $('logout').onclick = async () => {
    await window.sb.auth.signOut();
    location.reload();
  };

  document.querySelectorAll('.tab').forEach((t) =>
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      const id = t.dataset.tab;
      $('tab-products').style.display = id === 'products' ? 'block' : 'none';
      $('tab-categories').style.display = id === 'categories' ? 'block' : 'none';
    })
  );

  $('new-product').onclick = () => openProdModal();
  $('modal-close').onclick = $('modal-cancel').onclick = () => {
    $('prod-modal').style.display = 'none';
  };

  $('p-file').addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    showError('prod-err', 'Uploading…');
    try {
      const url = await window.api.uploadImage(f);
      $('p-image').value = url;
      $('p-preview').style.backgroundImage = `url(${url})`;
      showError('prod-err', '');
    } catch (err) {
      showError('prod-err', err.message);
    }
  });

  $('p-image').addEventListener('input', (e) => {
    $('p-preview').style.backgroundImage = e.target.value ? `url(${e.target.value})` : '';
  });

  $('prod-form').addEventListener('submit', saveProduct);

  $('cat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('cat-err', '');
    try {
      await window.api.createCategory({
        name: $('cat-name').value.trim(),
        image: $('cat-image').value.trim() || null,
        description: $('cat-desc').value.trim() || null,
      });
      $('cat-form').reset();
      await refreshCats();
    } catch (err) {
      showError('cat-err', err.message);
    }
  });

  // Load data — surface failures instead of leaving "Loading…" forever
  setStatus('Loading…');
  try {
    await refreshCats();
  } catch (err) {
    console.error(err);
    $('cat-list').innerHTML = `<p class="muted center" style="grid-column:1/-1;padding:20px;color:#f87171">Failed to load categories: ${err.message}</p>`;
  }
  try {
    await refreshProducts();
  } catch (err) {
    console.error(err);
    setStatus('');
    $('prod-list').innerHTML = `<div class="empty" style="color:#f87171">Failed to load products: ${err.message}<br><span class="muted" style="font-size:12px">Make sure the SQL setup script has been run in Supabase.</span></div>`;
  }
}

async function refreshCats() {
  cachedCats = await window.api.listCategories();
  const sel = $('p-cat');
  sel.innerHTML = cachedCats.length
    ? cachedCats.map((c) => `<option value="${c.name}">${c.name}</option>`).join('')
    : '<option value="">(create a category first)</option>';
  $('cat-list').innerHTML = cachedCats.length
    ? cachedCats.map((c) => `
        <div class="admin-prod">
          <div class="img" style="${c.image ? `background:url(${c.image}) center/cover` : ''}"></div>
          <div class="pad">
            <h3 style="font-family:var(--font-b);font-size:14px">${c.name}</h3>
            ${c.description ? `<p class="muted" style="font-size:12px;margin-top:4px">${c.description}</p>` : ''}
            <button class="btn btn-outline" style="margin-top:10px;padding:6px 12px;font-size:11px;color:#f87171;border-color:rgba(248,113,113,.4)" onclick="deleteCat('${c.id}')">Delete</button>
          </div>
        </div>`).join('')
    : '<p class="muted center" style="grid-column:1/-1;padding:30px">No categories yet.</p>';
}

window.deleteCat = async (id) => {
  if (!confirm('Delete this category?')) return;
  try { await window.api.deleteCategory(id); await refreshCats(); }
  catch (e) { alert(e.message); }
};

async function refreshProducts() {
  cachedProds = await window.api.listProducts();
  setStatus(`${cachedProds.length} product${cachedProds.length === 1 ? '' : 's'}`);
  if (!cachedProds.length) {
    $('prod-list').innerHTML = '<div class="empty">No products yet. Click <strong>Add Product</strong>.</div>';
    return;
  }
  const groups = {};
  cachedProds.forEach((p) => { (groups[p.category || 'Uncategorized'] ||= []).push(p); });
  $('prod-list').innerHTML = Object.entries(groups).map(([cat, list]) => `
    <section style="margin-bottom:34px">
      <h2 style="font-family:var(--font-b);font-size:17px;border-bottom:1px solid var(--border);padding-bottom:8px;margin-bottom:14px">${cat}</h2>
      <div class="grid grid-4">
        ${list.map((p) => `
          <div class="admin-prod">
            <div class="img">${p.image ? `<img src="${p.image}" alt="">` : ''}</div>
            <div class="pad">
              <p style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:.1em">${p.category || ''}</p>
              <h3 style="font-family:var(--font-b);font-size:14px;margin-top:4px">${p.name}</h3>
              ${p.description ? `<p class="muted" style="font-size:11px;margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.description}</p>` : ''}
              <div style="display:flex;gap:6px;margin-top:10px">
                <button class="btn btn-outline" style="flex:1;padding:6px 10px;font-size:11px" onclick="editProd('${p.id}')">Edit</button>
                <button class="btn btn-outline" style="padding:6px 10px;font-size:11px;color:#f87171;border-color:rgba(248,113,113,.4)" onclick="delProd('${p.id}','${(p.name || '').replace(/'/g, "\\'")}')">🗑</button>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </section>
  `).join('');
}

window.editProd = (id) => {
  const p = cachedProds.find((x) => x.id === id); if (!p) return; openProdModal(p);
};
window.delProd = async (id, name) => {
  if (!confirm(`Delete "${name}"?`)) return;
  try { await window.api.deleteProduct(id); await refreshProducts(); } catch (e) { alert(e.message); }
};

function openProdModal(p) {
  editing = p || null;
  $('modal-title').textContent = p ? 'Edit Product' : 'Add Product';
  $('p-name').value = p?.name || '';
  $('p-desc').value = p?.description || '';
  $('p-cat').value = p?.category || (cachedCats[0]?.name || '');
  $('p-vlabel').value = p?.variant_label || '';
  $('p-variants').value = (p?.variants || []).join(', ');
  $('p-image').value = p?.image || '';
  $('p-preview').style.backgroundImage = p?.image ? `url(${p.image})` : '';
  showError('prod-err', '');
  $('prod-modal').style.display = 'flex';
}

async function saveProduct(e) {
  e.preventDefault();
  showError('prod-err', '');
  const variants = $('p-variants').value.split(',').map((s) => s.trim()).filter(Boolean);
  const payload = {
    name: $('p-name').value.trim(),
    description: $('p-desc').value.trim() || null,
    category: $('p-cat').value,
    variant_label: $('p-vlabel').value.trim() || (variants.length > 1 ? 'Option' : null),
    variants,
    image: $('p-image').value.trim() || null,
  };
  try {
    if (editing) await window.api.updateProduct(editing.id, payload);
    else await window.api.createProduct(payload);
    $('prod-modal').style.display = 'none';
    await refreshProducts();
  } catch (err) {
    showError('prod-err', err.message);
  }
}
