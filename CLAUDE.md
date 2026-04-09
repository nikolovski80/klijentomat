# CLAUDE.md — Klijentomat AI Radnici
## Instrukcije za Claude Code (terminal)

> Ovaj fajl čita Claude Code u terminalu. Sadrži sve što treba da zna o projektu.

---

## ŠTA JE PROJEKAT

Klijentomat je multi-tenant SaaS platforma koja srpskim firmama daje AI radnike:
- **Tehničar** — scraping firmi po lokaciji (Google Places API)
- **Komercijalista** — HTML email kampanje + AI pisanje + follow-up
- **Šefica** — koordinacija, izveštaji, WhatsApp, multi-user
- **Glasnogovornik** — automatsko skupljanje Google recenzija
- (i više addona u budućnosti)

---

## TECH STACK

| Sloj | Tehnologija |
|---|---|
| Backend | FastAPI + Python 3.11 |
| Baza | PostgreSQL 16 |
| Cache/Queue | Redis 7 |
| Async taskovi | Celery |
| Frontend | React 18 + TypeScript + Vite |
| Stil | Tailwind CSS |
| Auth | JWT (python-jose) |
| ORM | SQLAlchemy 2.0 + Alembic |
| Deploy | Docker + Docker Compose → Railway |

---

## ARHITEKTURA — MULTI-TENANT

SVAKI klijent (firma) je jedan **tenant**. Sve tabele imaju `tenant_id`.
Middleware automatski čita `tenant_id` iz JWT tokena i filtrira podatke.
Tenant nikad ne vidi podatke drugog tenanta.

---

## FOLDER STRUKTURA

```
klijentomat/
  CLAUDE.md              ← ovaj fajl (čitaj uvek prvo)
  PROGRESS.md            ← status taskova (ažuriraj posle svakog sprinta)
  .env.example           ← sve potrebne env varijable
  docker-compose.yml     ← cela infrastruktura

  backend/
    app/
      main.py            ← FastAPI app, CORS, middleware
      api/v1/            ← svi endpointi
        auth.py          ← register, login, refresh, me
        leads.py         ← CRUD + scraping
        campaigns.py     ← kampanje + AI pisanje + slanje
        knowledge.py     ← mozak firme (baza znanja)
        reviews.py       ← glasnogovornik
        tracking.py      ← open/click/unsubscribe pixeli
        integrations.py  ← Gmail, Calendar, WhatsApp
      core/
        config.py        ← Settings klasa (pydantic-settings)
        database.py      ← SQLAlchemy engine, session
        security.py      ← JWT, password hash
        deps.py          ← FastAPI dependencies (get_db, get_current_tenant)
      models/            ← SQLAlchemy modeli (jedna klasa = jedna tabela)
        tenant.py
        user.py
        lead.py
        campaign.py
        knowledge.py
        email_log.py
        review.py
      schemas/           ← Pydantic sheme (request/response)
      services/          ← biznis logika (ne u rutama!)
        scraper.py       ← Google Places API
        mailer.py        ← SendGrid slanje
        ai_writer.py     ← OpenAI GPT pisanje mejla
        tracker.py       ← tracking piksel logika
        reviewer.py      ← review request flow
      tasks/             ← Celery async taskovi
        scraping.py
        email_send.py
        followup.py
    requirements.txt
    Dockerfile
    alembic.ini
    alembic/versions/

  frontend/
    src/
      pages/
        Auth/            ← Login, Register
        Dashboard/       ← Glavni pregled, KPI
        Tehnicar/        ← Scraper + leads tabela
        Komercijalista/  ← Kampanje + editor
        Mozak/           ← Baza znanja forma
        Izvestaj/        ← Analitika
        Podesavanja/     ← Plan, integracije, profil
      components/
        shared/          ← Button, Input, Table, Modal...
        layout/          ← Sidebar, Topbar, Layout wrapper
      hooks/             ← useAuth, useLeads, useCampaigns...
      services/          ← API pozivi (axios instance)
        api.ts           ← axios sa base URL i JWT interceptor
        leads.ts
        campaigns.ts
        knowledge.ts
      store/             ← Zustand state (auth, tenant)
    index.html
    vite.config.ts
    tailwind.config.ts
    package.json

  infrastructure/
    nginx.conf
    docker-compose.prod.yml
```

---

## REDOSLED IZGRADNJE (Sprinti)

### SPRINT 0 — Infrastruktura ✅ = gotovo, 🔄 = u toku, ⬜ = TODO

| ID | Task | Status |
|---|---|---|
| S0-01 | docker-compose.yml (postgres, redis, backend, frontend, nginx) | ⬜ |
| S0-02 | FastAPI main.py skeleton + health check | ⬜ |
| S0-03 | core/config.py — Settings sa env varijablama | ⬜ |
| S0-04 | core/database.py — SQLAlchemy setup | ⬜ |
| S0-05 | core/security.py — JWT + bcrypt | ⬜ |
| S0-06 | core/deps.py — get_db, get_current_user, get_tenant | ⬜ |
| S0-07 | Svi SQLAlchemy modeli + Alembic migracija | ⬜ |
| S0-08 | api/v1/auth.py — register, login, refresh, me | ⬜ |
| S0-09 | React skeleton + Vite + Tailwind | ⬜ |
| S0-10 | React routing + Layout + Login stranica | ⬜ |
| S0-11 | .env.example sa svim varijablama | ⬜ |
| S0-12 | requirements.txt + package.json | ⬜ |

### SPRINT 1 — Mozak Firme
| ID | Task | Status |
|---|---|---|
| S1-01 | Knowledge model + CRUD API | ⬜ |
| S1-02 | Onboarding wizard (5 koraka) frontend | ⬜ |
| S1-03 | File upload (logo, dokumenti) | ⬜ |
| S1-04 | Gmail OAuth2 | ⬜ |
| S1-05 | Google Calendar OAuth2 | ⬜ |
| S1-06 | Stripe subscription + setup fee | ⬜ |

### SPRINT 2 — Tehničar
| ID | Task | Status |
|---|---|---|
| S2-01 | Google Places API wrapper | ⬜ |
| S2-02 | Celery scraping task + job status | ⬜ |
| S2-03 | Lead model CRUD + filteri | ⬜ |
| S2-04 | Lead tabela frontend + search | ⬜ |
| S2-05 | CSV uvoz/izvoz | ⬜ |
| S2-06 | Duplikat detekcija | ⬜ |
| S2-07 | Upozorenja dashboard | ⬜ |

### SPRINT 3 — Komercijalista
| ID | Task | Status |
|---|---|---|
| S3-01 | SendGrid integracija | ⬜ |
| S3-02 | HTML email template editor | ⬜ |
| S3-03 | GPT AI pisanje mejla | ⬜ |
| S3-04 | Kampanja CRUD | ⬜ |
| S3-05 | Zakazano slanje (Celery beat) | ⬜ |
| S3-06 | Tracking piksel (open) | ⬜ |
| S3-07 | Click tracking | ⬜ |
| S3-08 | Unsubscribe (GDPR) | ⬜ |
| S3-09 | Auto followup | ⬜ |
| S3-10 | Kampanje statistike frontend | ⬜ |

### SPRINT 4 — Glasnogovornik
| ID | Task | Status |
|---|---|---|
| S4-01 | WhatsApp Business API | ⬜ |
| S4-02 | Review request trigger | ⬜ |
| S4-03 | Review šabloni (mail + WA) | ⬜ |
| S4-04 | Google recenzija link generator | ⬜ |
| S4-05 | Podesivo čekanje + podsednik | ⬜ |
| S4-06 | Review dashboard | ⬜ |

### SPRINT 5 — Poliranje
| ID | Task | Status |
|---|---|---|
| S5-01 | Glavni dashboard KPI + grafici | ⬜ |
| S5-02 | PWA manifest + service worker | ⬜ |
| S5-03 | Mobile responsive | ⬜ |
| S5-04 | Sentry error tracking | ⬜ |
| S5-05 | Rate limiting | ⬜ |
| S5-06 | Pricing + landing page | ⬜ |
| S5-07 | Pilot (3 klijenta — automehaničari BG) | ⬜ |

---

## PRAVILA KODIRANJA

1. **Uvek čitaj ovaj fajl pre početka rada**
2. **Posle svakog završenog taska ažuriraj PROGRESS.md**
3. Multi-tenant: svaki DB query mora imati `.filter(Model.tenant_id == tenant_id)`
4. Nikad biznis logiku u rutama — ide u `services/`
5. Nikad direktno env varijable — koristi `settings` iz `core/config.py`
6. Svaki endpoint mora imati Pydantic request/response shemu
7. Async svuda gde je moguće (`async def`)
8. Celery za sve što traje duže od 2 sekunde

---

## ENV VARIJABLE (potrebne za rad)

Pogledaj `.env.example` za kompletnu listu.
Minimalno za Sprint 0:
- `DATABASE_URL`
- `REDIS_URL`
- `SECRET_KEY`
- `OPENAI_API_KEY`
- `SENDGRID_API_KEY`
- `GOOGLE_PLACES_API_KEY`

---

## DEPLOYMENT

### Railway (razvoj + rani klijenti)
```bash
# Instaliraj Railway CLI
npm install -g @railway/cli

# Login
railway login

# Poveži projekat
railway link

# Deploy
railway up
```

### Hetzner (produkcija, 20+ klijenata)
```bash
# Na serveru
git pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## KORISNI LINKOVI
- Railway dashboard: https://railway.app/dashboard
- SendGrid: https://app.sendgrid.com
- OpenAI: https://platform.openai.com
- Google Cloud Console: https://console.cloud.google.com
- Stripe: https://dashboard.stripe.com
