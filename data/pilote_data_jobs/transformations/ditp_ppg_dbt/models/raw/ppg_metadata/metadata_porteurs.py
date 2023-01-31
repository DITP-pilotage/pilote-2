import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    porteurs = pd.read_csv(f'{ppg_metadata_views}/porteur/view_meta_porteur.csv')

    columns_type = {
        'porteur_id': 'str',
    }

    porteurs = porteurs.astype(columns_type)

    return porteurs
