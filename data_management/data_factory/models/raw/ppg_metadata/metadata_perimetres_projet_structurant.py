import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PRIVATE_DATA')
    perimetres_ps = pd.read_csv(
        f'{ppg_metadata_views}/mapping_perimetres_projets_structurants_ppg.csv',
        sep=';'
    )

    return perimetres_ps
