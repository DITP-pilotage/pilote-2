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
    # On ignore les chantiers qui ne doivent pas être publiés
    chantiers_publies = chantiers[~chantiers['ch_state'].isin(['NON_PUBLIE'])]

    return chantiers_publies