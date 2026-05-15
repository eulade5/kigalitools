// Loads the Supabase JS client from CDN and exposes window.sb
(function(){
  const s = document.createElement('script');
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  s.onload = () => {
    const c = window.APP_CONFIG;
    window.sb = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY);
    document.dispatchEvent(new Event('sb-ready'));
  };
  document.head.appendChild(s);
})();

// Helper: wait for sb
window.onSb = function(fn){
  if(window.sb) return fn(window.sb);
  document.addEventListener('sb-ready', () => fn(window.sb), {once:true});
};

// Data layer
window.api = {
  async listCategories(){
    const { data, error } = await window.sb.from('categories').select('*').order('name');
    if(error) throw error; return data || [];
  },
  async listProducts(){
    const { data, error } = await window.sb.from('products').select('*').order('created_at',{ascending:false});
    if(error) throw error; return data || [];
  },
  async createProduct(p){ const { data, error } = await window.sb.from('products').insert(p).select().single(); if(error) throw error; return data; },
  async updateProduct(id,p){ const { data, error } = await window.sb.from('products').update(p).eq('id',id).select().single(); if(error) throw error; return data; },
  async deleteProduct(id){ const { error } = await window.sb.from('products').delete().eq('id',id); if(error) throw error; },
  async createCategory(c){ const { data, error } = await window.sb.from('categories').insert(c).select().single(); if(error) throw error; return data; },
  async deleteCategory(id){ const { error } = await window.sb.from('categories').delete().eq('id',id); if(error) throw error; },
  async uploadImage(file){
    const ext = (file.name.split('.').pop()||'jpg').toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error } = await window.sb.storage.from(window.APP_CONFIG.PRODUCT_BUCKET).upload(path, file, { upsert:false, contentType:file.type });
    if(error) throw error;
    const { data } = window.sb.storage.from(window.APP_CONFIG.PRODUCT_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
};
