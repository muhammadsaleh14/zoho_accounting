from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Date, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

# 1. MASTER DATA: VENDORS
# We cache Zoho vendors here and store "Draft" vendors created by AI
class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    
    # If null, it means it's a "New/Draft" vendor not yet in Zoho
    zoho_contact_id = Column(String, unique=True, nullable=True) 
    
    trn = Column(String, nullable=True)
    address = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 2. TRANSACTION HEADER: INVOICES / BILLS
class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    
    # Link to our local Vendor table (optional, because AI might not match one yet)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    
    # Snapshot data (What the AI actually saw on the PDF)
    vendor_name_raw = Column(String, nullable=True) 
    
    date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    
    # Financials
    amount = Column(Float, default=0.0)
    currency = Column(String, default="AED")
    tax_amount = Column(Float, default=0.0)
    
    invoice_number = Column(String, index=True, nullable=True)
    
    # Workflow
    status = Column(String, default="review") # review, approved, rejected, synced
    category = Column(String, default="bill") # bill, invoice, bank_statement
    
    # File Storage
    image_url = Column(String, nullable=False)
    
    # AI Metadata (JSONB is perfect for flexible data like checklists)
    compliance_data = Column(JSON, nullable=True) 
    
    # Zoho Sync Status
    zoho_bill_id = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    vendor = relationship("Vendor", backref="invoices")
    line_items = relationship("LineItem", back_populates="invoice", cascade="all, delete-orphan")

# 3. TRANSACTION DETAILS: LINE ITEMS
class LineItem(Base):
    __tablename__ = "line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    
    description = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    rate = Column(Float, default=0.0)
    
    # Accounting Coding
    zoho_account_id = Column(String, nullable=True) # e.g. "45002 - Meals"
    
    invoice = relationship("Invoice", back_populates="line_items")

# 4. BANKING: STATEMENTS (Separate structure)
class BankStatement(Base):
    __tablename__ = "bank_statements"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Meta
    bank_name = Column(String, nullable=True)
    period_start = Column(Date, nullable=True)
    period_end = Column(Date, nullable=True)
    
    opening_balance = Column(Float, default=0.0)
    closing_balance = Column(Float, default=0.0)
    
    image_url = Column(String, nullable=False)
    status = Column(String, default="review")
    
    # Store transactions as JSON for now (simpler than a separate table for raw feed)
    # structure: [{date, desc, amount}, ...]
    raw_transactions = Column(JSON, nullable=True)
    
    # ... (Existing Vendor, Invoice, LineItem classes) ...

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    
    # Zoho Fields
    zoho_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True) # e.g. "6001"
    account_type = Column(String, nullable=True) # e.g. "Expense", "Cost of Goods Sold"
    
    # Meta
    is_active = Column(Boolean, default=True)
    last_synced = Column(DateTime(timezone=True), server_default=func.now())