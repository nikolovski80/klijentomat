"""
S3-02: OpenAI GPT-4o-mini za generisanje email sadržaja na srpskom.
"""
from openai import AsyncOpenAI
from app.core.config import settings

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


SYSTEM_PROMPT = """Ti si asistent koji piše poslovne email poruke za srpske firme.
Pišeš formalne, profesionalne emailove na srpskom jeziku.
Tone treba da bude uljudan, direktan i ubedljiv.
Uvek vrati JSON objekat sa ključevima "subject" i "body_html".
"body_html" treba da bude validan HTML za email (bez <html>/<body> tagova, samo sadržaj).
"""


async def generate_email(
    industry: str,
    tone: str = "formalan",
    knowledge_context: str = "",
    lead_company_name: str = "",
) -> dict:
    """
    Generiše email koristeći GPT-4o-mini.

    Args:
        industry: Delatnost ciljne firme (npr. "automehaničari")
        tone: Ton pisanja — "formalan", "prijatan", "ubedljiv"
        knowledge_context: Informacije o firmi tenanta iz Knowledge baze
        lead_company_name: Naziv ciljne firme (za personalizaciju)

    Returns:
        {"subject": str, "body_html": str}
    """
    if not settings.OPENAI_API_KEY:
        return {
            "subject": "Poslovna ponuda",
            "body_html": "<p>Poštovani,<br><br>Kontaktiramo Vas u vezi sa poslovnom saradnjom.<br><br>S poštovanjem</p>",
        }

    company_info = ""
    if knowledge_context:
        company_info = f"\n\nInformacije o našoj firmi:\n{knowledge_context}"

    lead_info = ""
    if lead_company_name:
        lead_info = f"\n\nEmail upućuješ firmi: {lead_company_name}"

    user_prompt = f"""Napiši poslovni email za firme u delatnosti: {industry}.
Ton pisanja: {tone}.{company_info}{lead_info}

Email treba da:
1. Ima profesionalni uvod
2. Jasno predstavi šta nudimo i zašto je to korisno
3. Ima poziv na akciju (npr. kontakt za razgovor)
4. Bude kratak (3-4 paragrafa)

Vrati SAMO JSON objekat: {{"subject": "...", "body_html": "..."}}"""

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        import json
        content = response.choices[0].message.content
        result = json.loads(content)
        return {
            "subject": result.get("subject", "Poslovna ponuda"),
            "body_html": result.get("body_html", "<p>Sadržaj emaila</p>"),
        }
    except Exception:
        return {
            "subject": "Poslovna ponuda",
            "body_html": "<p>Poštovani,<br><br>Kontaktiramo Vas u vezi sa poslovnom saradnjom.<br><br>S poštovanjem</p>",
        }
