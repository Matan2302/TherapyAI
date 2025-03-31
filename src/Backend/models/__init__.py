# models/__init__.py

# Import all model classes so they get registered with SQLAlchemy's metadata
from .Patient import Patient
from .Session import Session
from .Therapist import Therapist
from .TherapistPatient import TherapistPatient
from .TherapistLogin import TherapistLogin  # assuming you have this model too
from .TherapistPatient import TherapistPatient  # assuming you have this model too

#TODO: model the database and add the relationships between the models
