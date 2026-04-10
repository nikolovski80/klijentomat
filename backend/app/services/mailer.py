"""
S3-01: SendGrid email slanje putem HTTP API-ja (bez Python SDK).
"""
import httpx
from app.core.config import settings

SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"


def _inject_tracking_pixel(html_body: str, tracking_token: str) -> str:
    """Umetni tracking piksel i unsubscribe link u HTML email."""
    pixel_url = f"{settings.TRACKING_BASE_URL}/api/v1/track/open/{tracking_token}"
    unsub_url = f"{settings.TRACKING_BASE_URL}/api/v1/track/unsubscribe/{tracking_token}"

    pixel_img = f'<img src="{pixel_url}" width="1" height="1" style="display:none" alt="" />'
    unsub_link = (
        f'<p style="font-size:11px;color:#888;margin-top:20px;">'
        f'Ako ne želite više da primate naše poruke, '
        f'<a href="{unsub_url}">odjavite se ovde</a>.</p>'
    )

    # Ubaci piksel pre </body> ako postoji, inače na kraj
    if "</body>" in html_body.lower():
        idx = html_body.lower().rfind("</body>")
        html_body = html_body[:idx] + pixel_img + unsub_link + html_body[idx:]
    else:
        html_body = html_body + pixel_img + unsub_link

    return html_body


async def send_email(
    to_email: str,
    to_name: str,
    from_email: str,
    from_name: str,
    subject: str,
    html_body: str,
    tracking_token: str | None = None,
) -> bool:
    """
    Pošalji email putem SendGrid HTTP API-ja.
    Vraća True ako je uspešno, False inače.
    """
    if not settings.SENDGRID_API_KEY:
        return False

    if tracking_token:
        html_body = _inject_tracking_pixel(html_body, tracking_token)

    payload = {
        "personalizations": [
            {
                "to": [{"email": to_email, "name": to_name}],
                "subject": subject,
            }
        ],
        "from": {"email": from_email, "name": from_name},
        "content": [{"type": "text/html", "value": html_body}],
        "tracking_settings": {
            "click_tracking": {"enable": False},  # Koristimo sopstveni tracking
            "open_tracking": {"enable": False},
        },
    }

    headers = {
        "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(SENDGRID_API_URL, json=payload, headers=headers)
            return resp.status_code in (200, 202)
    except Exception:
        return False
