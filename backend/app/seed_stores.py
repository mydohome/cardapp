"""Popola il catalogo negozi con le principali catene italiane.

I loghi sono la favicon del sito ufficiale di ciascun negozio
(https://<dominio>/favicon.ico): nessuna dipendenza da servizi di terzi che
possono sparire (era successo con Clearbit Logo API, ritirata senza preavviso).

Uso: docker compose exec backend python -m app.seed_stores
(oppure "app" al posto di "backend" nel deploy dietro NPM)
"""

from app.database import Base, SessionLocal, engine
from app.models import Store

# Servizio ormai ritirato (logo.clearbit.com non risolve piu'): se un negozio
# ha ancora un logo_url con questo prefisso, va sostituito anche se "presente".
_RETIRED_LOGO_PREFIX = "https://logo.clearbit.com/"


def _favicon(domain: str) -> str:
    return f"https://{domain}/favicon.ico"


SEED_STORES = [
    {"name": "Esselunga", "aliases": "esselunga,fidaty", "category": "supermercato", "logo_url": _favicon("esselunga.it")},
    {"name": "Coop", "aliases": "coop,socio coop", "category": "supermercato", "logo_url": _favicon("e-coop.it")},
    {"name": "Conad", "aliases": "conad,carta insieme", "category": "supermercato", "logo_url": _favicon("conad.it")},
    {"name": "Ikea", "aliases": "ikea,ikea family", "category": "arredamento", "logo_url": _favicon("ikea.it")},
    {"name": "Decathlon", "aliases": "decathlon", "category": "sport", "logo_url": _favicon("decathlon.it")},
    {"name": "Carrefour", "aliases": "carrefour", "category": "supermercato", "logo_url": _favicon("carrefour.it")},
    {"name": "Lidl", "aliases": "lidl,lidl plus", "category": "supermercato", "logo_url": _favicon("lidl.it")},
    {"name": "Eurospin", "aliases": "eurospin", "category": "supermercato", "logo_url": _favicon("eurospin.it")},
    {"name": "Autogrill", "aliases": "autogrill,mymo", "category": "ristorazione", "logo_url": _favicon("autogrill.com")},
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
            elif entry.get("logo_url") and (
                not store.logo_url or store.logo_url.startswith(_RETIRED_LOGO_PREFIX)
            ):
                # Aggiorna se manca il logo o se punta al vecchio servizio
                # Clearbit ormai ritirato: non tocca un logo_url personalizzato a mano.
                store.logo_url = entry["logo_url"]
                updated += 1
        db.commit()
        print(f"Seed completato: {created} negozi creati, {updated} aggiornati col logo.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
