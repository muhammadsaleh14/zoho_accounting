# apps/backend/app/core/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Zoho Accounting AI"
    DATABASE_URL: str
    
    # Toggle this to False when you want to use Real DB / Zoho / Gemini
    DEMO_MODE: bool = False 

    # Existing Keys
    GOOGLE_API_KEY: str | None = None
    ZOHO_CLIENT_ID: str | None = None
    ZOHO_CLIENT_SECRET: str | None = None
    ZOHO_REFRESH_TOKEN: str | None = None
    ZOHO_ORG_ID: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()