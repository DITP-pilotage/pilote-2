import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    indicateurs = pd.read_csv(f'{ppg_metadata_views}/indicateur/view_meta_indicateur.csv')

    columns_type = {
        'indic_id': 'str',
        'indic_parent_indic': 'str',
        'indic_parent_ch': 'str',
        'indic_nom': 'str',
        'indic_descr': 'str',
        'indic_is_perseverant': 'bool',
        'indic_is_phare': 'bool',
        'indic_is_baro': 'bool',
        'indic_type': 'str',
        'indic_source': 'str',
        'indic_source_url': 'str',
    }

    indicateurs = indicateurs.astype(columns_type)

    return indicateurs
