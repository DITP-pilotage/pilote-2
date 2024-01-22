import pandas as pd
import os


def model(dbt, session):
    return pd.read_csv(f"{os.getenv('PPG_METADATA_SEEDS')}/rapport_import_mesure_indicateur.csv")
