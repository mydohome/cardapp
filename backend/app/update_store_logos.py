"""Cerca e aggiorna i negozi/loghi in base alle carte che gli utenti hanno
davvero aggiunto, invece del solo catalogo statico di seed_stores.py.

Per ogni carta senza negozio assegnato:
1. Prova prima il fuzzy match testuale contro il catalogo gia' noto (stesso
   usato per l'OCR in recognition.py) - copre il caso in cui il negozio
   esiste gia' ma la carta e' stata creata prima o senza passare dalla
   ricerca negozio nel form.
2. Se non trova nulla, prova a indovinare un dominio dal nome della carta
   (ripulito dalle parole tipiche "fidaty/card/club/...") e verifica con una
   richiesta HTTP se il dominio esiste davvero, creando un nuovo negozio nel
   catalogo con la favicon di Google se sì.

Non è una vera "ricerca sul web" (non c'è un motore di ricerca integrato):
è un'euristica sul nome, verificata con una richiesta di rete reale prima
di creare qualunque cosa, pensata per i tanti nomi di catena a una parola
sola (es. "Esselunga Fidaty" -> esselunga.it). Non crea mai un negozio se il
dominio candidato non risponde.

Uso: docker compose exec app python -m app.update_store_logos
Schedulato automaticamente una volta a settimana da app.logo_update_scheduler.
"""

import re
from collections import defaultdict

import requests

from app.database import Base, SessionLocal, engine
from app.models import Card, Store
from app.recognition import match_store
from app.seed_stores import _google_favicon

# Parole tipiche dei nomi di carte fedelta' che non fanno parte del brand:
# rimosse prima di provare a indovinare un dominio.
_NOISE_WORDS = {
    "fidaty", "card", "carta", "fedelta", "loyalty", "club", "plus", "family",
    "points", "point", "member", "app", "bonus", "premium", "gold", "vip", "insieme",
}

_CANDIDATE_TLDS = ("it", "com")
_REQUEST_TIMEOUT = 5


def _slugify(label: str) -> str:
    words = re.findall(r"[a-zA-Z]+", label.lower())
    words = [w for w in words if w not in _NOISE_WORDS]
    return words[0] if words else ""


def _domain_reachable(domain: str) -> bool:
    try:
        resp = requests.head(f"https://{domain}", timeout=_REQUEST_TIMEOUT, allow_redirects=True)
        return resp.status_code < 500
    except requests.RequestException:
        return False


def _discover_store(label: str) -> Store | None:
    slug = _slugify(label)
    if len(slug) < 3:
        return None
    for tld in _CANDIDATE_TLDS:
        domain = f"{slug}.{tld}"
        if _domain_reachable(domain):
            return Store(
                name=label.strip().title(),
                aliases=slug,
                logo_url=_google_favicon(domain),
                category=None,
            )
    return None


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        unmatched = db.query(Card).filter(Card.store_id.is_(None)).all()
        if not unmatched:
            print("[update_store_logos] Nessuna carta senza negozio associato.")
            return

        by_label: dict[str, list[Card]] = defaultdict(list)
        for card in unmatched:
            by_label[card.label.strip().lower()].append(card)

        created = 0
        linked = 0
        for cards in by_label.values():
            label = cards[0].label
            store = match_store(db, label)
            if not store:
                store = _discover_store(label)
                if store:
                    db.add(store)
                    db.flush()  # serve lo store.id per collegare le carte qui sotto
                    created += 1
                    print(f"[update_store_logos] Nuovo negozio scoperto: '{store.name}' -> {store.logo_url}")
            if store:
                for card in cards:
                    card.store_id = store.id
                    linked += 1

        db.commit()
        print(f"[update_store_logos] Completato: {created} negozi creati, {linked} carte collegate.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
