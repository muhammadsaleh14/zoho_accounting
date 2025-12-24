# backend/app/db/base_class.py
from typing import Any
from sqlalchemy.ext.declarative import as_declarative, declared_attr

@as_declarative()
class Base:
    id: Any
    __name__: str

    # Generate __tablename__ automatically from class name
    # e.g., class UserProfile -> table 'user_profile'
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()