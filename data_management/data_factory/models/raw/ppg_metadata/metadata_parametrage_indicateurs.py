import pandas as pd
import os


def model(dbt, session):
    config_calcul = os.getenv('PPG_METADATA_CONFIG_CALCUL')
    parametrage_indicateurs = pd.read_csv(f'{config_calcul}/calculs_params.csv')

    return parametrage_indicateurs
