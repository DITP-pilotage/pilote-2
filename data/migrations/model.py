from sqlalchemy import Column, Index, DateTime
from sqlalchemy.dialects.postgresql import VARCHAR, TIMESTAMP, DATE, BOOLEAN, FLOAT, TEXT, INTEGER, ARRAY, CHAR
from sqlalchemy.ext.declarative import declarative_base

SCHEMA_RAW_DATA = 'raw_data'

Base = declarative_base()
metadata = Base.metadata


class MetadataChantier(Base):
    __tablename__ = 'metadata_chantier'
    __table_args__ = {'schema': SCHEMA_RAW_DATA}

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
    ch_dp = Column(VARCHAR(255))


class MetadataPerimetre(Base):
    __tablename__ = 'metadata_perimetre'
    __table_args__ = {'schema': SCHEMA_RAW_DATA}

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
    # TODO: indic_type sera surement not nullable dans le futur


class MetadataZone(Base):
    __tablename__ = 'metadata_zone'
    __table_args__ = {'schema': SCHEMA_RAW_DATA}

    zone_id = Column(VARCHAR(15), primary_key=True)
    nom = Column(VARCHAR(255))
    zone_code = Column(VARCHAR(7), nullable=False)
    zone_type = Column(VARCHAR(15), nullable=False)
    zone_parent = Column(VARCHAR(255))
    # TODO: nom sera surement not nullable dans le futur


class IndicateurType(Base):
    __tablename__ = 'indicateur_type'
    __table_args__ = {'schema': SCHEMA_RAW_DATA}

    indic_type_id = Column(TEXT, primary_key=True)
    indic_type_name = Column(TEXT, nullable=False)
    indic_type_descr = Column(TEXT, nullable=False)
    indic_type_rank = Column(TEXT, nullable=False)


class FactProgressIndicateur(Base):
    __tablename__ = 'fact_progress_indicateur'
    __table_args__ = {'schema': SCHEMA_RAW_DATA}

    tree_node_id = Column(VARCHAR(32), primary_key=True)
    effect_id = Column(VARCHAR(255), primary_key=True)
    period_id = Column(INTEGER, primary_key=True)
    tag_applied = Column(VARCHAR(255), nullable=False)
    valeur_initiale = Column(FLOAT)
    valeur_actuelle = Column(FLOAT)
    valeur_cible = Column(FLOAT)
    progress = Column(FLOAT)
    bounded_progress = Column(FLOAT)
    date_valeur_initiale = Column(DATE)
    date_valeur_actuelle = Column(DATE)
    date_valeur_cible = Column(DATE)
    snapshot_date = Column(DateTime, nullable=False)


class DimTreeNodes(Base):
    __tablename__ = 'dim_tree_nodes'
    __table_args__ = {'schema': SCHEMA_RAW_DATA}

    tree_node_id = Column(VARCHAR(32), primary_key=True)
    tree_node_parent_id = Column(VARCHAR(32))
    structure_id = Column(VARCHAR(32), nullable=False)
    maturity_id = Column(VARCHAR(32), nullable=False)
    tree_node_name = Column(VARCHAR(255), nullable=False)
    tree_node_code = Column(VARCHAR(15), nullable=False)
    tree_node_status = Column(VARCHAR(15), nullable=False)
    tree_node_last_synchronization_date = Column(DateTime)
    tree_node_last_update_properties_date = Column(DateTime, nullable=False)
    tree_node_last_update_scorecard_date = Column(DateTime)
    tree_node_last_scorecard_update_by_anybody_date = Column(DateTime)
    tree_node_last_update_children_date = Column(DateTime)
    tree_node_currency = Column(VARCHAR(3))
    snapshot_date = Column(DateTime, nullable=False)


class FactProgressChantier(Base):
    __tablename__ = 'fact_progress_chantier'
    __table_args__ = {'schema': SCHEMA_RAW_DATA}

    tree_node_id = Column(VARCHAR(32), primary_key=True)
    period_id = Column(INTEGER, nullable=False)
    progress = Column(FLOAT, nullable=False)
    bounded_progress = Column(FLOAT, nullable=False)
    is_representative = Column(BOOLEAN, nullable=False)
    snapshot_date = Column(DateTime, nullable=False)


class DimStructures(Base):
    __tablename__ = 'dim_structures'
    __table_args__ = {'schema': SCHEMA_RAW_DATA}

    structure_id = Column(VARCHAR(32), primary_key=True)
    top_level_id = Column(VARCHAR(32), nullable=False)
    structure_name = Column(VARCHAR(15), nullable=False)
    structure_is_part_of_update_period = Column(BOOLEAN, nullable=False)
    structure_scorecard_frequency = Column(VARCHAR(7))
    structure_is_hidden = Column(BOOLEAN, nullable=False)
    structure_has_correction = Column(BOOLEAN, nullable=False)
    structure_level = Column(INTEGER, nullable=False)
    snapshot_date = Column(DateTime, nullable=False)


class MetadataPorteur(Base):
    __tablename__ = 'metadata_porteur'
    __table_args__ = {'schema': SCHEMA_RAW_DATA}

    porteur_id = Column(VARCHAR(4), primary_key=True)
    porteur_short = Column(VARCHAR(15), nullable=False)
    porteur_name = Column(VARCHAR(255))
    porteur_desc = Column(VARCHAR(255))
    porteur_type_id = Column(VARCHAR(2))
    porteur_type_short = Column(VARCHAR(5))
    porteur_type_name = Column(VARCHAR(255))
    porteur_directeur = Column(VARCHAR(255))
    porteur_name_short = Column(VARCHAR(255))


class MetadataAxe(Base):
    __tablename__ = 'metadata_axe'
    __table_args__ = {'schema': SCHEMA_RAW_DATA}

    axe_id = Column(TEXT, primary_key=True)
    axe_short = Column(TEXT)
    axe_name = Column(TEXT)
    axe_desc = Column(TEXT)

class MetadataPPG(Base):
    __tablename__ = 'metadata_ppg'
    __table_args__ = {'schema': SCHEMA_RAW_DATA}

    ppg_id = Column(TEXT, primary_key=True)
    ppg_axe = Column(TEXT, nullable=False)
    ppg_code = Column(TEXT)
    ppg_desc = Column(TEXT)
    ppg_nom = Column(TEXT, nullable=False)
    porteur_shorts = Column(TEXT)
    porteur_ids = Column(TEXT)
