from sqlalchemy import Column, Integer, String
from database import Base

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    Adminusername = Column(String, unique=True, index=True)
    AdminPassword = Column(String)
