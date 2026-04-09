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
| S1-02 | Onboarding wizard frontend | ⬜ | |
| S1-03 | File upload | ⬜ | |
| S1-04 | Gmail OAuth2 | ⬜ | |
| S1-05 | Google Calendar OAuth2 | ⬜ | |
| S1-06 | Stripe | ⬜ | |

## SPRINT 2 — Tehničar
| ID | Task | Status | Napomena |
|---|---|---|---|
| S2-01 | Google Places API | ⬜ | |
| S2-02 | Celery scraping task | ⬜ | |
| S2-03 | Lead CRUD | ⬜ | |
| S2-04 | Lead tabela frontend | ⬜ | |
| S2-05 | CSV uvoz/izvoz | ⬜ | |
| S2-06 | Duplikat detekcija | ⬜ | |
| S2-07 | Upozorenja dashboard | ⬜ | |

## SPRINT 3 — Komercijalista
| ID | Task | Status | Napomena |
|---|---|---|---|
| S3-01 | SendGrid | ⬜ | |
| S3-02 | Email editor | ⬜ | |
| S3-03 | GPT pisanje | ⬜ | |
| S3-04 | Kampanja CRUD | ⬜ | |
| S3-05 | Zakazano slanje | ⬜ | |
| S3-06 | Tracking piksel | ⬜ | |
| S3-07 | Click tracking | ⬜ | |
| S3-08 | Unsubscribe GDPR | ⬜ | |
| S3-09 | Auto followup | ⬜ | |
| S3-10 | Kampanje statistike | ⬜ | |

## SPRINT 4 — Glasnogovornik
| ID | Task | Status | Napomena |
|---|---|---|---|
| S4-01 | WhatsApp API | ⬜ | |
| S4-02 | Review trigger | ⬜ | |
| S4-03 | Review šabloni | ⬜ | |
| S4-04 | Google link gen | ⬜ | |
| S4-05 | Čekanje + podsednik | ⬜ | |
| S4-06 | Review dashboard | ⬜ | |

## SPRINT 5 — Poliranje
| ID | Task | Status | Napomena |
|---|---|---|---|
| S5-01 | Dashboard KPI | ⬜ | |
| S5-02 | PWA | ⬜ | |
| S5-03 | Mobile responsive | ⬜ | |
| S5-04 | Sentry | ⬜ | |
| S5-05 | Rate limiting | ⬜ | |
| S5-06 | Landing page | ⬜ | |
| S5-07 | Pilot klijenti | ⬜ | |

---
Poslednje ažuriranje: S1-01 završen (2026-04-09)
Napomena: deps.py import bug popravljen (app.models.user/tenant → app.models)
