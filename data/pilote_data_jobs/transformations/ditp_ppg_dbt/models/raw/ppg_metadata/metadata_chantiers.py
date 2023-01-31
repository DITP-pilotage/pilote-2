import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    chantiers = pd.read_csv(f'{ppg_metadata_views}/chantier/view_meta_chantier.csv')

    columns_type = {
        'ch_code': 'object',
        'ch_descr': 'object',
    }

    chantiers = chantiers.astype(columns_type)

    return chantiers
