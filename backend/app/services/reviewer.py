"""
S4-01/S4-03/S4-04: Slanje zahteva za Google recenzije putem emaila.
"""
import urllib.parse
from app.services.mailer import send_email


def _build_review_link(lead) -> str:
    """Generiši Google review link za lead."""
    # Ako lead ima Google Place ID, koristi direktni link
    if hasattr(lead, "google_place_id") and lead.google_place_id:
        return f"https://search.google.com/local/writereview?placeid={lead.google_place_id}"
    # Fallback: Google pretraga za firmu
    query = urllib.parse.quote(f"{lead.company_name} recenzije")
    return f"https://www.google.com/search?q={query}"


def _build_review_email_html(lead, tenant, review_link: str) -> str:
    """Kreiraj HTML email za review request."""
    company_name = tenant.name if hasattr(tenant, "name") else "Naša firma"
    return f"""
    <!DOCTYPE html>
    <html lang="sr">
    <head><meta charset="UTF-8"></head>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
      <h2>Poštovani iz {lead.company_name},</h2>
      <p>Nadam se da ste zadovoljni saradnjom sa <strong>{company_name}</strong>.</p>
      <p>Vaše mišljenje nam je izuzetno važno. Molimo Vas da ostavite recenziju na Google — to nam pomaže da unapredimo naše usluge i pomognemo drugim firmama da nas pronađu.</p>
      <p style="text-align:center;margin:30px 0;">
        <a href="{review_link}"
           style="background:#4285F4;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Ostavi Google recenziju
        </a>
      </p>
      <p style="color:#888;font-size:12px;">Ovo je automatska poruka. Ukoliko ne želite da primate ovakve emailove, slobodno odgovorite na ovu poruku.</p>
    </body>
    </html>
    """


async def send_review_request(lead, tenant, platform: str = "google") -> bool:
    """
    Pošalji email zahtev za recenziju lead-u.

    Args:
        lead: Lead objekat (mora imati email, company_name)
        tenant: Tenant objekat
        platform: Platforma za recenziju ("google")

    Returns:
        True ako je email uspešno poslat
    """
    if not lead.email:
        return False

    review_link = _build_review_link(lead)
    html_body = _build_review_email_html(lead, tenant, review_link)

    from_email = getattr(tenant, "from_email", None)
    # Fallback na settings
    if not from_email:
        from app.core.config import settings
        from_email = settings.SENDGRID_FROM_EMAIL

    from app.core.config import settings as s
    from_name = tenant.name if hasattr(tenant, "name") else s.SENDGRID_FROM_NAME

    return await send_email(
        to_email=lead.email,
        to_name=lead.company_name,
        from_email=from_email,
        from_name=from_name,
        subject=f"Ostavite recenziju za {from_name}",
        html_body=html_body,
    )
