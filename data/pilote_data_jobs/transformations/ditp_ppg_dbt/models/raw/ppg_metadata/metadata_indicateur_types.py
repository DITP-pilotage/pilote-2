import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_models = os.getenv('PPG_METADATA_MODELS')
    indicateur_types = pd.read_csv(f'{ppg_metadata_models}/indicateur/ref_indic_type.csv')

    return indicateur_types
