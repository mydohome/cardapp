"""Esegue update_store_logos.run() a intervalli regolari (di default una
volta a settimana), pensato per girare come processo container a lunga vita
(servizio "logo-updater" in docker-compose), non per invocazione singola -
per quella usa direttamente "python -m app.update_store_logos".

A differenza del backup (che usa cron per un orario fisso, es. sempre
domenica alle 3:00), qui l'intervallo e' relativo all'avvio del container:
un riavvio del container fa slittare il prossimo giro. Va benissimo per un
refresh "circa settimanale" dei loghi, che non ha bisogno di un orario
preciso, ed evita di dover installare ed configurare cron in questa immagine
solo per questo.
"""

import os
import time
from datetime import datetime, timezone

from app import update_store_logos

INTERVAL_HOURS = float(os.environ.get("LOGO_UPDATE_INTERVAL_HOURS", "168"))  # 168h = 1 settimana


def run():
    interval_seconds = INTERVAL_HOURS * 3600
    while True:
        print(f"[logo-updater] Avvio aggiornamento loghi ({datetime.now(timezone.utc).isoformat()})")
        try:
            update_store_logos.run()
        except Exception as exc:  # non deve mai far morire il loop
            print(f"[logo-updater] Errore durante l'aggiornamento: {exc}")
        print(f"[logo-updater] Prossimo aggiornamento tra {INTERVAL_HOURS:.0f} ore")
        time.sleep(interval_seconds)


if __name__ == "__main__":
    run()
