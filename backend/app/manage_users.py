"""CLI interattiva per creare e gestire gli utenti di CardApp.

Uso (dal container backend/app):
    python -m app.manage_users
"""

import getpass
import sys

from app.database import Base, SessionLocal, engine
from app.models import User
from app.security import hash_password


def list_users(db) -> None:
    users = db.query(User).order_by(User.email).all()
    if not users:
        print("Nessun utente presente.")
        return
    print(f"{'Email':<35} {'Nome':<20} Creato il")
    print("-" * 70)
    for u in users:
        created = u.created_at.strftime("%Y-%m-%d") if u.created_at else "-"
        print(f"{u.email:<35} {(u.display_name or '-'):<20} {created}")


def prompt_password(label: str = "Password") -> str:
    while True:
        pw = getpass.getpass(f"{label} (min. 8 caratteri): ")
        if len(pw) < 8:
            print("Troppo corta, riprova.")
            continue
        confirm = getpass.getpass("Conferma: ")
        if pw != confirm:
            print("Le due password non coincidono, riprova.")
            continue
        return pw


def create_user(db) -> None:
    email = input("Email: ").strip().lower()
    if not email:
        print("Email obbligatoria.")
        return
    if db.query(User).filter(User.email == email).first():
        print(f"Esiste gia' un utente con email {email}.")
        return

    display_name = input("Nome visualizzato (opzionale): ").strip() or None
    password = prompt_password()

    user = User(email=email, hashed_password=hash_password(password), display_name=display_name)
    db.add(user)
    db.commit()
    print(f"Utente '{email}' creato.")


def change_password(db) -> None:
    email = input("Email dell'utente: ").strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print("Utente non trovato.")
        return

    password = prompt_password("Nuova password")
    user.hashed_password = hash_password(password)
    db.commit()
    print(f"Password aggiornata per '{email}'.")


def delete_user(db) -> None:
    email = input("Email dell'utente da eliminare: ").strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print("Utente non trovato.")
        return

    confirm = input(
        f"Confermi l'eliminazione di '{email}'? Le sue carte (non condivise) andranno perse. "
        "Scrivi 'si' per confermare: "
    )
    if confirm.strip().lower() != "si":
        print("Annullato.")
        return

    db.delete(user)
    db.commit()
    print(f"Utente '{email}' eliminato.")


MENU = """
=== CardApp - gestione utenti ===
1) Elenca utenti
2) Crea nuovo utente
3) Cambia password
4) Elimina utente
0) Esci
"""

ACTIONS = {
    "1": list_users,
    "2": create_user,
    "3": change_password,
    "4": delete_user,
}


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        while True:
            print(MENU)
            choice = input("Scelta: ").strip()
            if choice == "0":
                break
            action = ACTIONS.get(choice)
            if not action:
                print("Scelta non valida.")
                continue
            try:
                action(db)
            except Exception as exc:  # noqa: BLE001 - CLI: mostra e continua
                db.rollback()
                print(f"Errore: {exc}")
    finally:
        db.close()


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\nUscita.")
        sys.exit(0)
