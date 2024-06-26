import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_models = os.getenv('PPG_METADATA_MODELS')
    chantier_meteos = pd.read_csv(f'{ppg_metadata_models}/chantier/ref_chantier_meteo.csv')

    columns_type = {
        'ch_meteo_id': 'string',
        'ch_meteo_name': 'string',
        'ch_meteo_descr': 'string',
        'ch_meteo_name_dfakto': 'string'
    }

    return chantier_meteos.astype(columns_type)
