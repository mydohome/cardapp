"""Popola il catalogo negozi con le principali catene italiane.

I loghi sono la favicon del sito ufficiale di ciascun negozio quando la
serve al percorso classico (https://<dominio>/favicon.ico); per i siti che
non ce l'hanno li' o bloccano richieste anonime, usiamo il servizio favicon
di Google (che scopre l'icona vera a prescindere dal percorso). Verificato
uno per uno con curl reale prima di scegliere quale usare per ogni negozio -
Clearbit Logo API (usata in precedenza) e' stata ritirata senza preavviso.

Uso: docker compose exec backend python -m app.seed_stores
(oppure "app" al posto di "backend" nel deploy dietro NPM)
"""

from app.database import Base, SessionLocal, engine
from app.models import Store


def _favicon(domain: str) -> str:
    return f"https://{domain}/favicon.ico"


def _google_favicon(domain: str) -> str:
    return f"https://www.google.com/s2/favicons?domain={domain}&sz=128"


def _is_auto_generated(url: str | None) -> bool:
    """True se il logo_url attuale sembra generato da una versione precedente
    di questo script (incluso il vecchio Clearbit, ormai ritirato) - in tal
    caso e' sicuro sovrascriverlo. Un logo_url impostato a mano dall'admin
    non corrisponde a nessuno di questi pattern e resta intoccato."""
    if not url:
        return True
    return "/favicon.ico" in url or "google.com/s2/favicons" in url or "logo.clearbit.com" in url


SEED_STORES = [
    {"name": "Esselunga", "aliases": "esselunga,fidaty", "category": "supermercato", "logo_url": _favicon("esselunga.it")},
    {"name": "Coop", "aliases": "coop,socio coop", "category": "supermercato", "logo_url": _google_favicon("coop.it")},
    {"name": "Conad", "aliases": "conad,carta insieme", "category": "supermercato", "logo_url": _favicon("conad.it")},
    {"name": "Ikea", "aliases": "ikea,ikea family", "category": "arredamento", "logo_url": _google_favicon("ikea.it")},
    {"name": "Decathlon", "aliases": "decathlon", "category": "sport", "logo_url": _google_favicon("decathlon.it")},
    {"name": "Carrefour", "aliases": "carrefour", "category": "supermercato", "logo_url": _favicon("carrefour.it")},
    {"name": "Lidl", "aliases": "lidl,lidl plus", "category": "supermercato", "logo_url": _google_favicon("lidl.it")},
    {"name": "Eurospin", "aliases": "eurospin", "category": "supermercato", "logo_url": _favicon("eurospin.it")},
    {"name": "Autogrill", "aliases": "autogrill,mymo", "category": "ristorazione", "logo_url": _google_favicon("autogrill.com")},
    {"name": "OVS", "aliases": "ovs", "category": "abbigliamento", "logo_url": _favicon("ovs.it")},
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        created = updated = 0
        for entry in SEED_STORES:
            store = db.query(Store).filter(Store.name == entry["name"]).first()
            if not store:
                db.add(Store(**entry))
                created += 1
            elif entry.get("logo_url") and _is_auto_generated(store.logo_url):
                store.logo_url = entry["logo_url"]
                updated += 1
        db.commit()
        print(f"Seed completato: {created} negozi creati, {updated} aggiornati col logo.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
