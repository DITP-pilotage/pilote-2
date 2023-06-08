import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_ps = os.getenv('DUMP_DFAKTO_TEMP')
    ps_view_data_financials = pd.read_csv(
        f'{dump_dfakto_ps}/ps_view_data_financials.csv',
        sep=';',
    )

    ps_view_data_financials = ps_view_data_financials.rename(columns={
        "Maille territoriale Code": 'maille_territoriale_code',
        "Projet Structurant Name": 'projet_structurant_name',
        "Projet Structurant Code": 'projet_structurant_code',
        "Objectif": 'objectif',
        "Synthèse des résultats": 'synthese_des_resultats',
        "Difficultés rencontrées et risques anticipés": 'difficultes_rencontrees_et_risques_anticipes',
        "Dernières réalisations et suivi des décisions": 'dernieres_realisation_et_suivi_des_decisions',
        "Solutions proposées et prochaines étapes": 'solutions_proposees_et_prochaines_etapes',
        "Partenariats et moyens mobilisés": 'partenariats_et_moyens_mobilises',
        "Météo": 'meteo',
        "Taux d'avancement (en %)": 'taux_avancement',
        "Méthodologie du calcul du taux d'avancement": 'methodologie_du_calcul_du_taux_d_avancement',
        "Périmètre ministériel 1": 'perimetre_ministeriel_1',
        "Périmètre ministériel 2": 'perimetre_ministeriel_2',
        "Périmètre ministériel 3": 'perimetre_ministeriel_3',
        "Périmètre ministériel 4": 'perimetre_ministeriel_4',
        "Chefferie de projet": 'chefferie_de_projet',
        "Direction de l’administration porteuse du projet": 'direction_de_l_administration_porteuse_du_projet',
        "Co-porteur du projet": 'co_porteur_du_projet',
        "Objectif - date de mise à jour": 'objectif_date_de_mise_a_jour',
        "Synthèse des résultats - date de mise à jour": 'synthese_des_resultats_date_de_mise_a_jour',
        "Difficultés rencontrées et risques anticipés - date de mise ": 'difficultes_rencontrees_et_risques_anticipes_date_de_mise_a_jour',
        "Dernières réalisations et suivi des décisions - date de mise": 'dernieres_realisation_et_suivi_des_decisions_date_de_mise_a_jour',
        "Solutions proposées et prochaines étapes - date de mise à jo": 'solutions_proposees_et_prochaines_etapes_date_de_mise_a_jo',
        "Partenariats et moyens mobilisés - date de mise à jour": 'partenariats_et_moyens_mobilises_date_de_mise_a_jour',
        "Météo - date de mise à jour": 'meteo_date_de_mise_a_jour',
        "Taux d'avancement (en %) - date mise à jour": 'taux_avancement_date_de_mise_a_jour',
        "Périmètre ministériel 1 - date de mise à jour": 'perimetre_ministeriel_1_date_de_mise_a_jour',
        "Périmètre ministériel 2 - date de mise à jour": 'perimetre_ministeriel_2_date_de_mise_a_jour',
        "Périmètre ministériel 3 - date de mise à jour": 'perimetre_ministeriel_3_date_de_mise_a_jour',
        "Périmètre ministériel 4 - date de mise à jour": 'perimetre_ministeriel_4_date_de_mise_a_jour',
        "Chefferie de projet - date de mise à jour": 'chefferie_de_projet_date_de_mise_a_jour',
        "Direction de l’administration porteuse du projet - date de mi": 'direction_administration_porteuse_date_de_mise_a_jour',
        "Co-porteur du projet - date de mise à jour": 'co_porteur_du_projet_date_de_mise_a_jour'
    })

    columns_type = {
        'taux_avancement': 'float64',
        'chefferie_de_projet': 'object',
        'direction_de_l_administration_porteuse_du_projet': 'object',
        'co_porteur_du_projet': 'object',
        'objectif_date_de_mise_a_jour': 'datetime64[ns]',
        'synthese_des_resultats_date_de_mise_a_jour': 'datetime64[ns]',
        'difficultes_rencontrees_et_risques_anticipes_date_de_mise_a_jour': 'datetime64[ns]',
        'dernieres_realisation_et_suivi_des_decisions_date_de_mise_a_jour': 'datetime64[ns]',
        'solutions_proposees_et_prochaines_etapes_date_de_mise_a_jo': 'datetime64[ns]',
        'partenariats_et_moyens_mobilises_date_de_mise_a_jour': 'datetime64[ns]',
        'meteo_date_de_mise_a_jour': 'datetime64[ns]',
        'taux_avancement_date_de_mise_a_jour': 'datetime64[ns]',
        'perimetre_ministeriel_1_date_de_mise_a_jour': 'datetime64[ns]',
        'perimetre_ministeriel_2_date_de_mise_a_jour': 'datetime64[ns]',
        'perimetre_ministeriel_3_date_de_mise_a_jour': 'datetime64[ns]',
        'perimetre_ministeriel_4_date_de_mise_a_jour': 'datetime64[ns]',
        'chefferie_de_projet_date_de_mise_a_jour': 'datetime64[ns]',
        'direction_administration_porteuse_date_de_mise_a_jour': 'datetime64[ns]',
        'co_porteur_du_projet_date_de_mise_a_jour': 'datetime64[ns]'
    }

    ps_view_data_financials = ps_view_data_financials.astype(columns_type)


    return ps_view_data_financials
