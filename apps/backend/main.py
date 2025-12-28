from fastapi import FastAPI, Request  # <-- Add Request here
from fastapi.exceptions import RequestValidationError  # <-- Add this entire line
from fastapi.responses import JSONResponse  # <-- Add this entire line
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

# Import the new router
from app.api.v1 import accounting, documents, sync

app = FastAPI(title="Zoho Accounting AI")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Get the raw body to see what the frontend actually sent
    body = await request.body()
    print(f"\n❌ 422 VALIDATION ERROR:")
    print(f"URL: {request.url}")
    print(f"Body Received: {body.decode('utf-8')}")
    print(f"Missing/Wrong Fields: {exc.errors()}\n")
    
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": body.decode('utf-8')},
    )

# --- CONFIGURATION ---
# UPDATE THIS WITH YOUR CURRENT NGROK URL
BASE_URL = "http://localhost:8000"  # e.g., "https://abcd1234.ngrok.io"
# BASE_URL = "https://polemoniaceous-disclamatory-brett.ngrok-free.dev"
# --- 1. CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

os.makedirs("uploads", exist_ok=True)
app.mount("/images", StaticFiles(directory="uploads"), name="images")


# Register Routers
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(sync.router, prefix="/api/v1/sync", tags=["Sync"]) # <--- Register it
app.include_router(accounting.router, prefix="/api/v1/accounting", tags=["Accounting"]) # <--- Register

@app.get("/")
def read_root():
    return {"status": "Backend V2 is running", "db": "PostgreSQL Connected"}
