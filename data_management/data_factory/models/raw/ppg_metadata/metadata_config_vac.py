import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_CONFIG_CALCUL')
    config_vac = pd.read_csv(f'{ppg_metadata_views}/config-vac.csv')

    return config_vac
