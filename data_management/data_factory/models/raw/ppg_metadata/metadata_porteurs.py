import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    porteurs = pd.read_csv(f'{ppg_metadata_views}/porteur/view_meta_porteur.csv')

    columns_type = {
        'porteur_id': 'str',
    }

    nb_porteur_directeur_null = pd.isnull(porteurs[["porteur_directeur"]]).sum().sum()
    # Check no porteur_directeur is null 
    assert nb_porteur_directeur_null == 0, "porteur_directeur should not be null. Found "+str(nb_porteur_directeur_null)

    
    porteurs = porteurs.astype(columns_type)

    return porteurs
