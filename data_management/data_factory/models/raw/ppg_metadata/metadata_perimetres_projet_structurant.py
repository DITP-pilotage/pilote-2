import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    perimetres_ps = pd.read_csv(
        f'{ppg_metadata_views}/perimetre/mapping_per_pst.csv',
        sep=';'
    )

    return perimetres_ps
