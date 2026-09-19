"""CLI interattiva per creare e gestire gli utenti di CardApp.

Uso (dal container backend/app):
    python -m app.manage_users
"""

import getpass
import re
import sys

from app.database import Base, SessionLocal, engine
from app.models import User
from app.schemas import USERNAME_PATTERN
from app.security import hash_password

USERNAME_RE = re.compile(USERNAME_PATTERN)


def list_users(db) -> None:
    users = db.query(User).order_by(User.username).all()
    if not users:
        print("Nessun utente presente.")
        return
    print(f"{'Username':<20} {'Nome':<20} {'Email':<30} Creato il")
    print("-" * 90)
    for u in users:
        created = u.created_at.strftime("%Y-%m-%d") if u.created_at else "-"
        print(f"{u.username:<20} {(u.display_name or '-'):<20} {(u.email or '-'):<30} {created}")


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


def prompt_username(db, label: str = "Username") -> str | None:
    username = input(f"{label} (3-32 caratteri, lettere/cifre/punto/underscore/trattino): ").strip()
    if not USERNAME_RE.match(username):
        print("Username non valido.")
        return None
    if db.query(User).filter(User.username == username).first():
        print(f"Esiste gia' un utente con username '{username}'.")
        return None
    return username


def create_user(db) -> None:
    username = prompt_username(db)
    if not username:
        return

    email = input("Email (opzionale): ").strip().lower() or None
    if email and db.query(User).filter(User.email == email).first():
        print(f"Esiste gia' un utente con email {email}.")
        return

    display_name = input("Nome visualizzato (opzionale): ").strip() or None
    password = prompt_password()

    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        display_name=display_name,
    )
    db.add(user)
    db.commit()
    print(f"Utente '{username}' creato.")


def _find_user(db) -> User | None:
    username = input("Username: ").strip()
    user = db.query(User).filter(User.username == username).first()
    if not user:
        print("Utente non trovato.")
        return None
    return user


def change_password(db) -> None:
    user = _find_user(db)
    if not user:
        return

    password = prompt_password("Nuova password")
    user.hashed_password = hash_password(password)
    db.commit()
    print(f"Password aggiornata per '{user.username}'.")


def delete_user(db) -> None:
    user = _find_user(db)
    if not user:
        return

    confirm = input(
        f"Confermi l'eliminazione di '{user.username}'? Le sue carte (non condivise) andranno perse. "
        "Scrivi 'si' per confermare: "
    )
    if confirm.strip().lower() != "si":
        print("Annullato.")
        return

    username = user.username
    db.delete(user)
    db.commit()
    print(f"Utente '{username}' eliminato.")


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
