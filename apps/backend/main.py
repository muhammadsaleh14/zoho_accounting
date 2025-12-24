from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Import the new router
from app.api.v1 import accounting, documents, sync

app = FastAPI(title="Zoho Accounting AI")

# CORS (Allow Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

# Static Files (For viewing images)
os.makedirs("uploads", exist_ok=True)
app.mount("/images", StaticFiles(directory="uploads"), name="images")


# Register Routers
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(sync.router, prefix="/api/v1/sync", tags=["Sync"]) # <--- Register it
app.include_router(accounting.router, prefix="/api/v1/accounting", tags=["Accounting"]) # <--- Register

@app.get("/")
def read_root():
    return {"status": "Backend V2 is running", "db": "PostgreSQL Connected"}