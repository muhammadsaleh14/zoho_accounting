# --- File: apps/backend/app/models/accounting.py ---

from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Date, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    zoho_contact_id = Column(String, unique=True, nullable=True) 
    trn = Column(String, nullable=True)
    address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    vendor_name_raw = Column(String, nullable=True) 
    
    date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    date_of_supply = Column(Date, nullable=True)
    
    amount = Column(Float, default=0.0)
    currency = Column(String, default="AED")
    currency_rate = Column(Float, default=1.0)
    tax_amount = Column(Float, default=0.0)
    tax_percentage = Column(Float, nullable=True)
    is_reverse_charge = Column(Boolean, default=False)
    
    invoice_number = Column(String, index=True, nullable=True)
    reference_number = Column(String, nullable=True) # Ensure this exists
    
    # VAT Compliance Fields
    supplier_trn = Column(String, nullable=True)
    supplier_address = Column(String, nullable=True)
    customer_trn = Column(String, nullable=True)
    customer_address = Column(String, nullable=True)
    
    # --- NEW: Store the AI Summary ---
    notes = Column(String, nullable=True)
    
    status = Column(String, default="review")
    category = Column(String, default="bill")
    image_url = Column(String, nullable=False)
    compliance_data = Column(JSON, nullable=True) 
    zoho_bill_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    vendor = relationship("Vendor", backref="invoices")
    line_items = relationship("LineItem", back_populates="invoice", cascade="all, delete-orphan")

class LineItem(Base):
    __tablename__ = "line_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    description = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    rate = Column(Float, default=0.0)
    tax_rate = Column(Float, nullable=True)
    tax_amount = Column(Float, nullable=True)
    is_reverse_charge = Column(Boolean, default=False)
    zoho_account_id = Column(String, nullable=True)
    invoice = relationship("Invoice", back_populates="line_items")
    account_guess = Column(String, nullable=True)

class BankStatement(Base):
    __tablename__ = "bank_statements"
    id = Column(Integer, primary_key=True, index=True)
    bank_name = Column(String, nullable=True)
    period_start = Column(Date, nullable=True)
    period_end = Column(Date, nullable=True)
    opening_balance = Column(Float, default=0.0)
    closing_balance = Column(Float, default=0.0)
    image_url = Column(String, nullable=False)
    status = Column(String, default="review")
    raw_transactions = Column(JSON, nullable=True)

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    zoho_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    account_type = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_synced = Column(DateTime(timezone=True), server_default=func.now())