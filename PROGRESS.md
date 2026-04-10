# PROGRESS.md — Klijentomat Task Tracker

> Ažuriraj posle svakog završenog taska.
> Format: ✅ DONE | 🔄 IN PROGRESS | ⬜ TODO | ❌ BLOKIRANO

---

## SPRINT 0 — Infrastruktura
| ID | Task | Status | Napomena |
|---|---|---|---|
| S0-01 | docker-compose.yml | ✅ | |
| S0-02 | FastAPI main.py skeleton | ✅ | |
| S0-03 | core/config.py | ✅ | |
| S0-04 | core/database.py | ✅ | |
| S0-05 | core/security.py | ✅ | |
| S0-06 | core/deps.py | ✅ | |
| S0-07 | SQLAlchemy modeli + Alembic | ✅ | |
| S0-08 | api/v1/auth.py | ✅ | |
| S0-09 | React skeleton + Vite + Tailwind | ✅ | |
| S0-10 | React routing + Layout + Login | ✅ | |
| S0-11 | .env.example | ✅ | |
| S0-12 | requirements.txt + package.json | ✅ | |

## SPRINT 1 — Mozak Firme
| ID | Task | Status | Napomena |
|---|---|---|---|
| S1-01 | Knowledge model + CRUD API | ✅ | schemas, service, 4 endpointa, MozakPage frontend |
| S1-02 | Onboarding wizard frontend | ✅ | 5 koraka (Firma→Branding→Usluge→FAQ→Završetak), Zustand flag, ruta guard |
| S1-03 | File upload | ⬜ | |
| S1-04 | Gmail OAuth2 | ⬜ | |
| S1-05 | Google Calendar OAuth2 | ⬜ | |
| S1-06 | Stripe | ⬜ | |

## SPRINT 2 — Tehničar
| ID | Task | Status | Napomena |
|---|---|---|---|
| S2-01 | Google Places API | ✅ | services/scraper.py — Text Search + Place Details, httpx async |
| S2-02 | Celery scraping task | ✅ | tasks/scraping.py — Redis status tracking, bulk insert |
| S2-03 | Lead CRUD | ✅ | api/v1/leads.py — GET/POST/PUT/DELETE/PATCH status, paginacija, filteri |
| S2-04 | Lead tabela frontend | ✅ | TehnicarPage.tsx — Tab Pretraga + Tab Kontakti |
| S2-05 | CSV uvoz/izvoz | ✅ | POST /leads/import, GET /leads/export (StreamingResponse) |
| S2-06 | Duplikat detekcija | ✅ | Dedup po (tenant_id, email) i (tenant_id, company_name) |
| S2-07 | Upozorenja dashboard | ✅ | DashboardPage.tsx — draft kampanje upozorenja |

## SPRINT 3 — Komercijalista
| ID | Task | Status | Napomena |
|---|---|---|---|
| S3-01 | SendGrid | ✅ | services/mailer.py — HTTP API, tracking pixel inject |
| S3-02 | Email editor | ✅ | KomercijalistaPage.tsx — HTML textarea |
| S3-03 | GPT pisanje | ✅ | services/ai_writer.py — GPT-4o-mini, knowledge kontekst |
| S3-04 | Kampanja CRUD | ✅ | api/v1/campaigns.py — puni CRUD + AI write endpoint |
| S3-05 | Zakazano slanje | ✅ | tasks/email_send.py — Celery task, rate limit 0.1s |
| S3-06 | Tracking piksel | ✅ | tracking.py — open tracking + pixel |
| S3-07 | Click tracking | ✅ | tracking.py — redirect na lead website |
| S3-08 | Unsubscribe GDPR | ✅ | tracking.py — HTML potvrda, is_unsubscribed = True |
| S3-09 | Auto followup | ✅ | tasks/followup.py — Celery beat, svakih sat vremena |
| S3-10 | Kampanje statistike | ✅ | KomercijalistaPage.tsx — Tab Statistike, open/click rate |

## SPRINT 4 — Glasnogovornik
| ID | Task | Status | Napomena |
|---|---|---|---|
| S4-01 | WhatsApp API | ⬜ | Nije implementirano u ovom sprintu |
| S4-02 | Review trigger | ✅ | api/v1/reviews.py — POST /reviews/trigger/{lead_id} |
| S4-03 | Review šabloni | ✅ | services/reviewer.py — HTML email sa Google review linkom |
| S4-04 | Google link gen | ✅ | reviewer.py — place_id link ili search fallback |
| S4-05 | Čekanje + podsednik | ⬜ | Reminder scheduled task nije implementiran |
| S4-06 | Review dashboard | ✅ | GET /reviews, GET /reviews/stats |

## SPRINT 5 — Poliranje
| ID | Task | Status | Napomena |
|---|---|---|---|
| S5-01 | Dashboard KPI | ✅ | DashboardPage.tsx — pravi API pozivi za sve KPI |
| S5-02 | PWA | ⬜ | |
| S5-03 | Mobile responsive | ⬜ | |
| S5-04 | Sentry | ⬜ | |
| S5-05 | Rate limiting | ⬜ | |
| S5-06 | Landing page | ⬜ | |
| S5-07 | Pilot klijenti | ⬜ | |

---
Poslednje ažuriranje: Sprint 2+3+4 završeni (2026-04-10)
