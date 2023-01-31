import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    porteurs = pd.read_csv(f'{ppg_metadata_views}/porteur/view_meta_porteur.csv')

    columns_type = {
        'porteur_id': 'int16',
        'porteur_short': 'str',
        'porteur_name': 'str',
        'porteur_desc': 'str',
        'porteur_type_id': 'int16',
        'porteur_type_short': 'str',
        'porteur_type_name': 'str',
        'porteur_directeur': 'str',
        'porteur_name_short': 'str',
    }

    porteurs = porteurs.astype(columns_type)

    return porteurs
