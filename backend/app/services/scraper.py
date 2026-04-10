"""
S2-01: Google Places API scraper
Koristi Text Search + Place Details za detaljne podatke.
"""
import httpx
from app.core.config import settings

PLACES_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"


async def _get_place_details(client: httpx.AsyncClient, place_id: str) -> dict:
    """Dohvati detalje za jedan place (telefon, website)."""
    resp = await client.get(
        PLACES_DETAILS_URL,
        params={
            "place_id": place_id,
            "fields": "name,formatted_phone_number,website,formatted_address",
            "key": settings.GOOGLE_PLACES_API_KEY,
        },
    )
    resp.raise_for_status()
    data = resp.json()
    result = data.get("result", {})
    return {
        "phone": result.get("formatted_phone_number"),
        "website": result.get("website"),
        "address": result.get("formatted_address"),
    }


async def search_places(
    address: str,
    radius_m: int,
    industry: str,
    max_results: int = 50,
) -> list[dict]:
    """
    Pretraži firme na Google Places API-ju i vrati listu leadova.

    Vraća: [{company_name, email, phone, address, city, website, source, google_place_id}]
    """
    if not settings.GOOGLE_PLACES_API_KEY:
        return []

    results: list[dict] = []
    next_page_token: str | None = None

    async with httpx.AsyncClient(timeout=30.0) as client:
        while len(results) < max_results:
            params: dict = {
                "query": f"{industry} {address}",
                "radius": radius_m,
                "key": settings.GOOGLE_PLACES_API_KEY,
            }
            if next_page_token:
                params = {"pagetoken": next_page_token, "key": settings.GOOGLE_PLACES_API_KEY}

            resp = await client.get(PLACES_TEXT_SEARCH_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

            places = data.get("results", [])
            for place in places:
                if len(results) >= max_results:
                    break
                place_id = place.get("place_id")
                raw_address = place.get("formatted_address", "")
                # Izvuci grad iz adrese (poslednji deo pre poslednje zareze)
                city = _extract_city(raw_address)

                # Dohvati detalje
                details = {}
                if place_id:
                    try:
                        details = await _get_place_details(client, place_id)
                    except Exception:
                        pass

                results.append({
                    "company_name": place.get("name", ""),
                    "email": None,  # Google Places ne daje email
                    "phone": details.get("phone") or place.get("formatted_phone_number"),
                    "address": details.get("address") or raw_address,
                    "city": city,
                    "website": details.get("website"),
                    "source": "google_places",
                    "google_place_id": place_id,
                })

            next_page_token = data.get("next_page_token")
            if not next_page_token or not places:
                break

    return results


def _extract_city(formatted_address: str) -> str | None:
    """Pokuša da izvuče grad iz formatted_address."""
    if not formatted_address:
        return None
    parts = [p.strip() for p in formatted_address.split(",")]
    # Tipičan format: "Ulica br, Grad, Zemlja"
    if len(parts) >= 2:
        return parts[-2]
    return parts[0] if parts else None
