"""Popola il catalogo negozi con le principali catene italiane.

I loghi vengono presi da Clearbit Logo API (https://logo.clearbit.com/<dominio>),
un servizio pubblico gratuito che restituisce il logo ufficiale di un'azienda
a partire dal suo dominio: non ospitiamo noi le immagini, solo un link.

Uso: docker compose exec backend python -m app.seed_stores
(oppure "app" al posto di "backend" nel deploy dietro NPM)
"""

from app.database import Base, SessionLocal, engine
from app.models import Store


def _clearbit_logo(domain: str) -> str:
    return f"https://logo.clearbit.com/{domain}"


SEED_STORES = [
    {"name": "Esselunga", "aliases": "esselunga,fidaty", "category": "supermercato", "logo_url": _clearbit_logo("esselunga.it")},
    {"name": "Coop", "aliases": "coop,socio coop", "category": "supermercato", "logo_url": _clearbit_logo("e-coop.it")},
    {"name": "Conad", "aliases": "conad,carta insieme", "category": "supermercato", "logo_url": _clearbit_logo("conad.it")},
    {"name": "Ikea", "aliases": "ikea,ikea family", "category": "arredamento", "logo_url": _clearbit_logo("ikea.it")},
    {"name": "Decathlon", "aliases": "decathlon", "category": "sport", "logo_url": _clearbit_logo("decathlon.it")},
    {"name": "Carrefour", "aliases": "carrefour", "category": "supermercato", "logo_url": _clearbit_logo("carrefour.it")},
    {"name": "Lidl", "aliases": "lidl,lidl plus", "category": "supermercato", "logo_url": _clearbit_logo("lidl.it")},
    {"name": "Eurospin", "aliases": "eurospin", "category": "supermercato", "logo_url": _clearbit_logo("eurospin.it")},
    {"name": "Autogrill", "aliases": "autogrill,mymo", "category": "ristorazione", "logo_url": _clearbit_logo("autogrill.com")},
    {"name": "OVS", "aliases": "ovs", "category": "abbigliamento", "logo_url": _clearbit_logo("ovs.it")},
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
            elif not store.logo_url and entry.get("logo_url"):
                # Aggiorna solo se manca il logo: non sovrascrive personalizzazioni manuali.
                store.logo_url = entry["logo_url"]
                updated += 1
        db.commit()
        print(f"Seed completato: {created} negozi creati, {updated} aggiornati col logo.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
