import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_models = os.getenv('PPG_METADATA_MODELS')
    zonegroup = pd.read_csv(f'{ppg_metadata_models}/zone/ref_zone_group.csv')

    return zonegroup
