# Klijentomat — AI Tim Radnika

## 🚀 Quick Start (lokalno)

```bash
# 1. Kloniraj repo
git clone https://github.com/tvoj-username/klijentomat.git
cd klijentomat

# 2. Kopiraj env varijable i popuni ih
cp .env.example .env
# Otvori .env i popuni: SECRET_KEY, DATABASE_URL, OPENAI_API_KEY itd.

# 3. Pokreni sve
docker-compose up -d

# 4. Pokreni migracije
docker-compose exec backend alembic upgrade head

# 5. Otvori browser
# Frontend: http://localhost:3000
# Backend docs: http://localhost:8000/docs
```

---

## 📋 Gde šta radiš

| Gde | Za šta |
|---|---|
| **Ovaj chat (Claude.ai)** | Planiranje, arhitektura, novi moduli, odluke |
| **Terminal (Claude Code)** | Pisanje koda, sprint po sprint |
| **Railway dashboard** | Deploy, logovi, env varijable |
| **PROGRESS.md** | Praćenje taskova — ažuriraj posle svakog sprinta |
| **CLAUDE.md** | Instrukcije za Claude Code — uvek prvo pročitaj |

---

## 🏗️ Trenutni status

- ✅ **Sprint 0** — Infrastruktura (skeleton gotov)
- ⬜ **Sprint 1** — Mozak Firme
- ⬜ **Sprint 2** — Tehničar
- ⬜ **Sprint 3** — Komercijalista
- ⬜ **Sprint 4** — Glasnogovornik
- ⬜ **Sprint 5** — Poliranje + Launch

---

## 🔑 API ključevi koje trebaš nabaviti

| Servis | Gde | Za sprint |
|---|---|---|
| OpenAI | platform.openai.com | S3 |
| SendGrid | app.sendgrid.com | S3 |
| Google Places | console.cloud.google.com | S2 |
| Google OAuth | console.cloud.google.com | S1 |
| WhatsApp Meta | developers.facebook.com | S4 |
| Stripe | dashboard.stripe.com | S1 |

---

## 🚢 Deploy na Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Dodaj env varijable u Railway dashboard → Variables.
