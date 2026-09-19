"""Popola il catalogo negozi con le principali catene italiane.

Uso: docker compose exec backend python -m app.seed_stores
"""

from app.database import Base, SessionLocal, engine
from app.models import Store

SEED_STORES = [
    {"name": "Esselunga", "aliases": "esselunga,fidaty", "category": "supermercato"},
    {"name": "Coop", "aliases": "coop,socio coop", "category": "supermercato"},
    {"name": "Conad", "aliases": "conad,carta insieme", "category": "supermercato"},
    {"name": "Ikea", "aliases": "ikea,ikea family", "category": "arredamento"},
    {"name": "Decathlon", "aliases": "decathlon", "category": "sport"},
    {"name": "Carrefour", "aliases": "carrefour", "category": "supermercato"},
    {"name": "Lidl", "aliases": "lidl,lidl plus", "category": "supermercato"},
    {"name": "Eurospin", "aliases": "eurospin", "category": "supermercato"},
    {"name": "Autogrill", "aliases": "autogrill,mymo", "category": "ristorazione"},
    {"name": "OVS", "aliases": "ovs", "category": "abbigliamento"},
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for entry in SEED_STORES:
            if not db.query(Store).filter(Store.name == entry["name"]).first():
                db.add(Store(**entry))
        db.commit()
        print(f"Seed completato: {len(SEED_STORES)} negozi verificati/inseriti.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
