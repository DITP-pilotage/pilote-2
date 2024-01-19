import pandas as pd
import os


def model(dbt, session):

    # Forcer le type de ces colonnes
    columns_type = {
        'detail_projet_annuel_perf': 'str',
        'contact_technique': 'str',
        'commentaire': 'str'
    }

    return pd\
        .read_csv(f"{os.getenv('PPG_METADATA_VIEWS')}/indicateur/view_meta_indicateur_complementaire.csv", keep_default_na=False)\
        .astype(columns_type)
