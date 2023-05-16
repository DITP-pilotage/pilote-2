import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_CONFIG_CALCUL')
    parametrage_indicateurs = pd.read_csv(f'{ppg_metadata_views}/calculs_params-sample.csv')

    return parametrage_indicateurs
