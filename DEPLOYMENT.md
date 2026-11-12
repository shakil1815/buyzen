# Deploying BuyZen to GitHub + Vercel

This guide takes the project from your laptop to a live `https://buyzen.vercel.app`
(or your own domain) in about 20 minutes.

---

## 1. Push the code to GitHub

The project already is a git repository with clean commits, so you only need to
create the remote and push.

### 1.1 Create the repository

1. Go to <https://github.com/new> while signed in.
2. **Repository name:** `buyzen`
3. **Visibility:** Private (recommended while it is your own business) or Public.
4. Do **not** tick "Add a README" — the project already has one.
5. Click **Create repository**.

### 1.2 Connect and push

```bash
cd C:\Users\shaki\ecommerce-store

# 1. point at your new (empty) GitHub repo
git remote add origin https://github.com/<YOUR-USERNAME>/buyzen.git

# 2. make sure the branch is called main
git branch -M main

# 3. push everything
git push -u origin main
```

If Git asks for credentials, use a **Personal Access Token** (GitHub → Settings →
Developer settings → Personal access tokens → *Fine-grained tokens* → grant
`Contents: Read and write` for this repo) as the password, or install the
[GitHub CLI](https://cli.github.com) and run `gh auth login` once.

Check: <https://github.com/<YOUR-USERNAME>/buyzen> now shows your code.

---

## 2. Prepare the database (important for Vercel)

The project uses **SQLite locally** because it needs zero setup. Vercel's
serverless filesystem is read-only, so a production deployment needs a hosted
**PostgreSQL** database. The data model uses nothing SQLite-specific, so the
switch is two lines.

### 2.1 Get a free hosted Postgres

Any of these work and have a free tier:

| Provider | Steps |
| -------- | ----- |
| **Neon** | <https://console.neon.tech> → create project → *Connection string* → copy the `postgresql://...` URL |
| **Supabase** | <https://supabase.com/dashboard> → *New project* → *Connect* → *Session pooler* URI |
| **Railway** | <https://railway.app> → New project → *Add PostgreSQL* → Variables → `DATABASE_URL` |

### 2.2 Switch the datasource

In `prisma/schema.prisma` change the datasource block:

```prisma
datasource db {
  provider = "postgresql"   // was: sqlite
  url      = env("DATABASE_URL")
}
```

Then create the Postgres migration and push it to GitHub:

```bash
# point your machine at the hosted database
# (Windows PowerShell)
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST/dbname?sslmode=require"

# create the migration + apply it
npx prisma migrate dev --name postgres

# make sure the app still runs locally against Postgres
npm run db:seed
```

Commit the generated migration folder:

```bash
git add -A
git commit -m "Switch datasource to PostgreSQL for production"
git push
```

> Want to keep using SQLite locally? Keep a second schema file
> (`prisma/schema.sqlite.prisma`) and swap it with
> `npx prisma migrate dev --schema prisma/schema.sqlite.prisma`. Never run
> `migrate dev` against a hosted database — use `migrate deploy`.

---

## 3. Deploy to Vercel

1. Go to <https://vercel.com/signup> and sign up with your GitHub account.
2. Click **Add New… → Project**.
3. **Import** the `buyzen` repository you just pushed.
4. Vercel detects **Next.js** automatically — keep the preset and click
   **Continue**.

### 3.1 Environment variables

In the project settings → **Environment Variables**, add these for
**Production** (and **Preview** if you want previews seeded):

| Name | Value | Required |
| ---- | ----- | -------- |
| `DATABASE_URL` | your `postgresql://…` URL | ✅ |
| `AUTH_SECRET` | a long random string (see below) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` (after you add the domain) | recommended |
| `USD_TO_BDT_RATE` | `120` | optional |
| `OPENAI_API_KEY` | OpenAI key — enables the hosted AI assistant | optional |
| `OPENAI_MODEL` | `gpt-4o-mini` | optional |
| `STRIPE_SECRET_KEY` | Stripe secret key | optional |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | optional |

Generate a strong session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3.2 Build command

Settings → **Build & Development Settings → Build Command**:

```
prisma migrate deploy && prisma generate && next build
```

`prisma migrate deploy` applies the committed migrations to the hosted database
on every deploy, and `prisma generate` produces the client Vercel needs.

### 3.3 Deploy

Click **Deploy**. The first build takes 2–4 minutes. When it finishes you get a
URL like `https://buyzen.vercel.app`.

### 3.4 Seed the production database (optional but recommended)

Run the seed **from your machine**, pointing at the hosted database:

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST/dbname?sslmode=require"
npm run db:seed
```

This creates the demo catalogue, the admin account and the coupon codes.
If you would rather start empty, skip the seed — but then create your first
admin by inserting a row with `role = "SUPER_ADMIN"` (bcrypt hash of your
password) or temporarily run the seed and delete the demo orders.

### 3.5 Custom domain

Settings → **Domains** → *Add* → enter `buyzen.com` (or any domain you own) and
follow the DNS instructions. Then update `NEXT_PUBLIC_SITE_URL` to the new URL
and redeploy so links, sitemap and Stripe redirects use the right origin.

---

## 4. After the deploy — a checklist

- [ ] `https://your-domain.com` loads and the logo shows.
- [ ] Header settings → switch **language** to বাংলা and **currency** to ৳ — both
      persist across pages.
- [ ] Switch the theme to **Dark** — it is applied before first paint (no flash).
- [ ] Sign in at `/login` with `admin@buyzen.com` / `admin12345` and **change the
      password** immediately (Settings → customers → your own row → block/unblock
      is not a password change; use the reset flow in your own deployment).
- [ ] Open `/admin` — revenue, orders, customers and charts show your real data.
- [ ] `/admin/roles` — confirm the role matrix matches your team.
- [ ] `/admin/settings` — set the real contact email, phone, address, social
      links, shipping flat rate, free-shipping threshold and tax rate.
- [ ] `/admin/content` — write the real About / Privacy / Terms / Return policy
      pages (they are editable without touching code).
- [ ] `/admin/marketing` — create your own coupons, banners and flash sales.
- [ ] Replace the demo product photography: `npm run fetch:photos` refreshes the
      Wikimedia images, or drop your own files into `public/products/photos/` and
      update the `image`/`gallery` columns from `/admin/products`.

---

## 5. Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| `Error: P1001 Can't reach database server` | Wrong `DATABASE_URL` or the DB is paused | Copy the connection string again; wake the DB (Neon/Supabase pause when idle) |
| `Error: P3005 database schema is not empty` | Used `migrate dev` on the hosted DB | Use `prisma migrate deploy` (build command above) |
| Admin page redirects to `/login` | Session cookie missing | Check `AUTH_SECRET` is set and identical in Preview/Production |
| Images 404 | Photos not committed | `git add public/products && git commit && git push` |
| `Module not found: @prisma/client` | Client not generated on Vercel | Keep `prisma generate` in the build command, or add `"postinstall": "prisma generate"` to `package.json` |
| Currency stuck on USD | Cookie cleared | The header switcher stores it in the `sf_currency` cookie |

---

## 6. Ongoing workflow

```bash
git add -A
git commit -m "Describe your change"
git push                # Vercel redeploys automatically
```

Vercel gives you a preview deployment for every pull request, so open a branch,
push it and review the preview URL before merging to `main`.

## 7. Keeping the demo data fresh

```bash
npm run db:seed          # reset catalogue + demo accounts (keeps photos)
npm run fetch:photos     # refresh the real product photography
npm run verify           # typecheck + lint + production build
npm run e2e              # browser test of the shopping journey
npm run e2e:admin-platform   # browser test of the admin platform
```
