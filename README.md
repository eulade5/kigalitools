# Amazing Tools Company — Static Website

Pure HTML / CSS / Vanilla JavaScript. No build step. Connects to Supabase
for products, categories, image upload, and admin management.

## Project structure
```
index.html            Home page
products.html         Catalog with category filter
admin/index.html      Admin login + dashboard
admin/admin.js        Admin logic
css/style.css         All styles (luxury black + gold theme)
js/config.js          Supabase URL / anon key / WhatsApp number
js/supabase-client.js Supabase loader + data API
js/cart.js            Quote basket (localStorage) + WhatsApp message
js/main.js            Home page renderers
js/products-page.js   Catalog renderer + filters
assets/               Logo, hero & category images
SUPABASE_SETUP.sql    Database + storage setup
vercel.json           Vercel config (clean URLs)
```

## 1. Run the SQL
Open your Supabase project → **SQL Editor** → paste `SUPABASE_SETUP.sql` → **Run**.
This creates the `categories` and `products` tables, RLS policies, and the
public `product-images` storage bucket.

## 2. Create the admin user
Supabase → **Authentication → Users → Add user**.
Use any email + password, tick **Auto Confirm User**.

(Optional) lock the dashboard to a single email by setting
`ADMIN_EMAIL` in `js/config.js`.

## 3. Run locally
Just open `index.html` in a browser, or serve with any static server:
```
npx serve .
```

## 4. Deploy on Vercel
1. Push the project to GitHub.
2. On Vercel: **New Project → Import** the repo.
3. Framework preset: **Other** (no build step).
4. Root directory: `/`.
5. Output directory: `./` (default).
6. Deploy.

No environment variables required — public Supabase keys are in `js/config.js`.

## 5. Use the admin
- Visit `/admin/`
- Sign in with the user you created
- Add categories first, then products
- Upload product images directly from your computer
- Products and categories appear instantly on the site

## 6. WhatsApp quotation system
Visitors browse products → tap **Add to Quote** → open the basket →
**Request Quote on WhatsApp** opens WhatsApp prefilled with the items.
Phone number is configured in `js/config.js` (`WHATSAPP_NUMBER`).
