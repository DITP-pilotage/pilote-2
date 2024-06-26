import pandas as pd
import os


def model(dbt, session):
    ppg_metadata_views = os.getenv('PPG_METADATA_VIEWS')
    chantiers = pd.read_csv(f'{ppg_metadata_views}/chantier/view_meta_chantier.csv')

    columns_type = {
        'chantier_id': 'string',
        'ch_code': 'string',
        'ch_descr': 'string',
        'ch_nom': 'string',
        'ch_dp': 'string',
        'ch_ppg': 'string',
        'ch_perseverant': 'string',
        'porteur_shorts_noDAC': 'string',
        'porteur_ids_noDAC': 'string',
        'porteur_shorts_DAC': 'string',
        'porteur_ids_DAC': 'string',
        'ch_per': 'string',
        'ch_dp_mail': 'string',
        'ch_territo': 'boolean',
        'engagement_short': 'string',
        'ch_hidden_pilote': 'boolean',
        'ch_saisie_ate': 'string',
        'ch_state': 'string',
        'zg_applicable': 'string',
        'maille_applicable': 'string'
    }

    chantiers = chantiers.astype(columns_type)
    # On ignore les chantiers qui ne doivent pas être publiés
    chantiers_publies = chantiers[~chantiers['ch_state'].isin(['NON_PUBLIE'])]

    return chantiers_publies
