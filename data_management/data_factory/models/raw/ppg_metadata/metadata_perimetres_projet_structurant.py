import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    perimetres_ps = pd.read_csv(
        f'{ppg_metadata_views}/perimetre_ps/mapping_perimetres_projets_structurants_ppg.csv',
        sep=';'
    )

    return perimetres_ps
