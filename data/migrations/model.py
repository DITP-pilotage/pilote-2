from sqlalchemy import Column, Index
from sqlalchemy.dialects.postgresql import VARCHAR, TIMESTAMP, DATE, BOOLEAN, FLOAT, TEXT, INTEGER, ARRAY, CHAR
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()
metadata = Base.metadata


class MetadataChantier(Base):
    __tablename__ = 'metadata_chantier'
    __table_args__ = {"schema": "raw_data"}

    chantier_id = Column(VARCHAR(7), primary_key=True)
    ch_code = Column(VARCHAR(255))
    ch_descr = Column(VARCHAR(255))
    ch_nom = Column(VARCHAR(255), nullable=False)
    ch_ppg = Column(VARCHAR(7), nullable=False)
    ch_perseverant = Column(VARCHAR(7))
    porteur_shorts_noDAC = Column(VARCHAR(255), nullable=False)
    porteur_ids_noDAC = Column(VARCHAR(255), nullable=False)
    porteur_shorts_DAC = Column(VARCHAR(255))
    porteur_ids_DAC = Column(VARCHAR(255))
    ch_per = Column(VARCHAR(255), nullable=False)


class MetadataPerimetre(Base):
    __tablename__ = 'metadata_perimetre'
    __table_args__ = {"schema": "raw_data"}

    perimetre_id = Column(VARCHAR(7), primary_key=True)
    per_nom = Column(VARCHAR(255))
    per_short = Column(VARCHAR(255))
    per_picto = Column(VARCHAR(255))


class MetadataIndicateur(Base):
    __tablename__ = 'metadata_indicateur'
    __table_args__ = {"schema": "raw_data"}

    indic_id = Column(VARCHAR(7), primary_key=True)
    indic_parent_indic = Column(VARCHAR(7))
    indic_parent_ch = Column(VARCHAR(7), nullable=False)
    indic_nom = Column(VARCHAR(255), nullable=False)
    indic_descr = Column(TEXT)
    indic_is_perseverant = Column(BOOLEAN)
    indic_is_phare = Column(BOOLEAN)
    indic_is_baro = Column(BOOLEAN)
    indic_type = Column(VARCHAR(31), nullable=True)
