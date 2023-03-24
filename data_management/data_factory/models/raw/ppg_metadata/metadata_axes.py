import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    axes = pd.read_csv(f'{ppg_metadata_views}/axe/view_meta_axe.csv')

    return axes
