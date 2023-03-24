import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_models = os.getenv('PPG_METADATA_MODELS')
    chantier_meteos = pd.read_csv(f'{ppg_metadata_models}/chantier/ref_chantier_meteo.csv')

    return chantier_meteos
