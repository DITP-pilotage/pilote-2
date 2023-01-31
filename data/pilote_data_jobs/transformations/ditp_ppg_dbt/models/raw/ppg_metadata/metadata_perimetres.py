import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    perimetres = pd.read_csv(f'{ppg_metadata_views}/perimetre/view_meta_perimetre.csv')

    columns_type = {
        'perimetre_id': 'str',
        'per_nom': 'str',
        'per_short': 'str',
        'per_picto': 'str',
        'per_porteur_id': 'str',
        'per_porteur_name_short': 'str',
    }

    perimetres = perimetres.astype(columns_type)

    return perimetres

