# backend/app/db/base.py

# Import the Base class
from app.db.base_class import Base

# Import all models here so Alembic can discover them
from app.models.accounting import Vendor, Invoice, LineItem, BankStatement