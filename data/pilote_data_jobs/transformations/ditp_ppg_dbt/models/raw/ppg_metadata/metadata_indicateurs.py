import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    indicateurs = pd.read_csv(f'{ppg_metadata_views}/indicateur/view_meta_indicateur.csv')
    print(indicateurs.head())

    columns_type = {
        'indic_parent_indic': 'object',
    }

    indicateurs = indicateurs.astype(columns_type)
    print(indicateurs.head())

    return indicateurs
