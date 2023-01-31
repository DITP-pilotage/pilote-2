import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    ppgs = pd.read_csv(f'{ppg_metadata_views}/ppg/view_meta_ppg.csv')

    return ppgs
