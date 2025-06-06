# models/__init__.py

# Import all model classes so they get registered with SQLAlchemy's metadata
from .Patient import Patient
from .Session import Session
from .Therapist import Therapist
from .TherapistLogin import TherapistLogin  # assuming you have this model too

#TODO: model thesrc.Backend.database and add the relationships between the models
