import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    zones = pd.read_csv(f'{ppg_metadata_views}/zone/view_meta_zone.csv')

    return zones
