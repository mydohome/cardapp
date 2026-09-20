"""Popola il catalogo negozi con le principali catene italiane.

I loghi sono la favicon del sito ufficiale di ciascun negozio quando la
serve al percorso classico (https://<dominio>/favicon.ico); per i siti che
non ce l'hanno li' o bloccano richieste anonime, usiamo il servizio favicon
di Google (che scopre l'icona vera a prescindere dal percorso). I negozi del
primo blocco sono verificati uno per uno con curl reale; quelli aggiunti dopo
per ampliare il catalogo usano di default il servizio Google (piu' tollerante)
ma non sono ancora stati confermati con curl - se un logo non compare, va
verificato dal server e corretto qui (il seed si auto-corregge da solo al
prossimo riavvio). Clearbit Logo API (usata in precedenza) e' stata ritirata
senza preavviso.

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
    # --- Supermercati / discount (verificati con curl reale dal server dell'utente) ---
    {"name": "Esselunga", "aliases": "esselunga,fidaty", "category": "supermercato", "logo_url": _favicon("esselunga.it")},
    {"name": "Coop", "aliases": "coop,socio coop", "category": "supermercato", "logo_url": _google_favicon("coop.it")},
    {"name": "Conad", "aliases": "conad,carta insieme", "category": "supermercato", "logo_url": _favicon("conad.it")},
    {"name": "Carrefour", "aliases": "carrefour", "category": "supermercato", "logo_url": _favicon("carrefour.it")},
    {"name": "Lidl", "aliases": "lidl,lidl plus", "category": "supermercato", "logo_url": _google_favicon("lidl.it")},
    {"name": "Eurospin", "aliases": "eurospin", "category": "supermercato", "logo_url": _favicon("eurospin.it")},
    # --- Nuove insegne aggiunte per ampliare il catalogo: logo_url non ancora
    # verificato con curl reale (rete del sandbox di sviluppo bloccata verso
    # domini esterni arbitrari) - si usa il servizio favicon di Google perche'
    # storicamente si e' rivelato il piu' tollerante verso siti che bloccano
    # richieste anonime dirette. Se un logo non compare, va verificato con curl
    # dal server (stessa procedura gia' usata per Coop/Ikea/Decathlon/ecc.) e
    # corretto qui: al prossimo riavvio il seed si auto-corregge da solo. ---
    {"name": "Ikea", "aliases": "ikea,ikea family", "category": "arredamento", "logo_url": _google_favicon("ikea.it")},
    {"name": "Decathlon", "aliases": "decathlon", "category": "sport", "logo_url": _google_favicon("decathlon.it")},
    {"name": "Autogrill", "aliases": "autogrill,mymo", "category": "ristorazione", "logo_url": _google_favicon("autogrill.com")},
    {"name": "OVS", "aliases": "ovs", "category": "abbigliamento", "logo_url": _favicon("ovs.it")},
    {"name": "Pam Panorama", "aliases": "pam,panorama,pam local,pam card", "category": "supermercato", "logo_url": _google_favicon("pampanorama.it")},
    {"name": "Bennet", "aliases": "bennet,bennet card", "category": "supermercato", "logo_url": _google_favicon("bennet.com")},
    {"name": "Famila", "aliases": "famila", "category": "supermercato", "logo_url": _google_favicon("famila.it")},
    {"name": "MD", "aliases": "md,md discount", "category": "supermercato", "logo_url": _google_favicon("mdspa.it")},
    {"name": "In's Mercato", "aliases": "in's,ins mercato", "category": "supermercato", "logo_url": _google_favicon("insmercato.it")},
    {"name": "Todis", "aliases": "todis", "category": "supermercato", "logo_url": _google_favicon("todis.it")},
    {"name": "Despar", "aliases": "despar,eurospar,interspar", "category": "supermercato", "logo_url": _google_favicon("despar.it")},
    {"name": "Crai", "aliases": "crai", "category": "supermercato", "logo_url": _google_favicon("crai-supermercati.it")},
    {"name": "Coin", "aliases": "coin,coin excellence", "category": "abbigliamento", "logo_url": _google_favicon("coin.it")},
    {"name": "H&M", "aliases": "hm,h&m,h&m member", "category": "abbigliamento", "logo_url": _google_favicon("hm.com")},
    {"name": "MediaWorld", "aliases": "mediaworld,mediaworld club", "category": "elettronica", "logo_url": _google_favicon("mediaworld.it")},
    {"name": "Unieuro", "aliases": "unieuro,unieuro club", "category": "elettronica", "logo_url": _google_favicon("unieuro.it")},
    {"name": "Trony", "aliases": "trony", "category": "elettronica", "logo_url": _google_favicon("trony.it")},
    {"name": "Euronics", "aliases": "euronics", "category": "elettronica", "logo_url": _google_favicon("euronics.it")},
    {"name": "Leroy Merlin", "aliases": "leroy merlin,leroymerlin", "category": "bricolage", "logo_url": _google_favicon("leroymerlin.it")},
    {"name": "Bricoman", "aliases": "bricoman", "category": "bricolage", "logo_url": _google_favicon("bricoman.it")},
    {"name": "Bricofer", "aliases": "bricofer", "category": "bricolage", "logo_url": _google_favicon("bricofer.it")},
    {"name": "Acqua & Sapone", "aliases": "acqua e sapone,as card", "category": "profumeria", "logo_url": _google_favicon("acquaesapone.it")},
    {"name": "Tigotà", "aliases": "tigota,tigotà card", "category": "profumeria", "logo_url": _google_favicon("tigota.it")},
    {"name": "LloydsFarmacia", "aliases": "lloyds,lloydsfarmacia", "category": "farmacia", "logo_url": _google_favicon("lloydsfarmacia.it")},
    {"name": "NaturaSì", "aliases": "naturasi,natura si", "category": "supermercato", "logo_url": _google_favicon("naturasi.it")},
    {"name": "La Feltrinelli", "aliases": "feltrinelli,lafeltrinelli", "category": "libreria", "logo_url": _google_favicon("lafeltrinelli.it")},
    {"name": "Mondadori Store", "aliases": "mondadori,mondadori piu", "category": "libreria", "logo_url": _google_favicon("mondadoristore.it")},
    {"name": "UCI Cinemas", "aliases": "uci,uci cinemas", "category": "cinema", "logo_url": _google_favicon("ucicinemas.it")},
    {"name": "The Space Cinema", "aliases": "space cinema,thespacecinema", "category": "cinema", "logo_url": _google_favicon("thespacecinema.it")},
    {"name": "Douglas", "aliases": "douglas", "category": "profumeria", "logo_url": _google_favicon("douglas.it")},
    {"name": "Kiko Milano", "aliases": "kiko,kiko fan", "category": "profumeria", "logo_url": _google_favicon("kikocosmetics.com")},
    {"name": "Sephora", "aliases": "sephora,beauty pass", "category": "profumeria", "logo_url": _google_favicon("sephora.it")},
    {"name": "Eni", "aliases": "eni,eni enjoy", "category": "carburante", "logo_url": _google_favicon("eni.com")},
    {"name": "Q8", "aliases": "q8,q8easy", "category": "carburante", "logo_url": _google_favicon("q8.it")},
    {"name": "IP", "aliases": "ip,ip club,italiana petroli", "category": "carburante", "logo_url": _google_favicon("ip-com.it")},
    {"name": "Elite", "aliases": "elite,supermercati elite,superelite", "category": "supermercato", "logo_url": _google_favicon("superelite.it")},
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
