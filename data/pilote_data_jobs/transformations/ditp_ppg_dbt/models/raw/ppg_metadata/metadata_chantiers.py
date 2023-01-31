import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    chantiers = pd.read_csv(f'{ppg_metadata_views}/chantier/view_meta_chantier.csv')

    columns_type = {
        'chantier_id': 'str',
        'ch_code': 'str',
        'ch_descr': 'str',
        'ch_nom': 'str',
        'ch_dp': 'str',
        'ch_ppg': 'str',
        'ch_perseverant': 'str',
        'porteur_shorts_noDAC': 'str',
        'porteur_ids_noDAC': 'str',
        'porteur_shorts_DAC': 'str',
        'porteur_ids_DAC': 'str',
        'ch_per': 'str',
        'ch_dp_mail': 'str',
    }

    chantiers = chantiers.astype(columns_type)

    return chantiers
