from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, cards, invites, library_shares, shares, stores, users

app = FastAPI(title="CardApp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cards.router)
app.include_router(stores.router)
app.include_router(shares.router)
app.include_router(library_shares.router)
app.include_router(invites.router)
app.include_router(users.router)


@app.on_event("startup")
def on_startup():
    # MVP: crea le tabelle direttamente dai modelli.
    # Da sostituire con Alembic non appena servono migrazioni incrementali.
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    return {"status": "ok"}
