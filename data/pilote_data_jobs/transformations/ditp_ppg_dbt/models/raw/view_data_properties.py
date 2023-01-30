import pandas as pd
import os


def model(dbt, session):
    dump_dfakto_rp_views_data = os.getenv('DUMP_DFAKTO_RP_VIEWS_DATA')
    my_sql_model_df = pd.read_csv(
        f'{dump_dfakto_rp_views_data}/rp_view_data_properties.csv',
        sep=';'
    )

    my_sql_model_df = my_sql_model_df.rename(columns={
        "Réforme Code": 'reforme_code',
        "Région Code": 'region_code',
        "Académie Code": 'departement_code',
        "Département Code": 'academie_code',
        "Objectifs de la réforme": 'objectifs_de_la_reforme',
        "Synthèse des résultats": 'synthese_des_resultats',
        "Difficultés rencontrées et risques anticipés": 'difficultes_rencontrees_et_risques_anticipes',
        "Solutions proposées et prochaines étapes": 'solutions_proposees_et_prochaines_etapes',
        "Un exemple concret de réussite liée à la réforme": 'un_exemple_concret_de_reussite_liee_a_la_reforme',
        "Dernières réalisations et suivi des décisions": 'dernieres_realisations_et_suivi_des_decisions',
        "Météo": 'meteo',
        "Météo - date de mise à jour": 'meteo_date_de_mise_a_jour',
        "Méthodologie de renseignement de la météo": 'methodologie_de_renseignement_de_la_meteo',
        "Chef de Projet National": 'chef_de_projet_national',
        "Chef de Projet National - date de mise à jour": 'chef_de_projet_national_date_de_mise_a_jour',
        "Equipe Projet donnée qualitative - UTILISATEURS": 'equipe_projet_donnee_qualitative_utilisateurs',
        "Equipe Projet donnée qualitative - GROUPE": 'equipe_projet_donnee_qualitative_groupe',
        "Equipe Projet donnée quantitative - UTILISATEURS": 'equipe_projet_donnee_quantitative_utilisateurs',
        "DAC": 'dac',
        "Accès en consultation - UTILISATEURS": 'acces_en_consultation_utilisateurs',
        "Contexte Local": 'contexte_local',
        "Feuille de Route": 'feuille_de_route',
        "Référent local - GROUPE": 'referent_local_groupe',
        "Réforme Name": 'reforme_name',
        "Objectifs de la réforme - date de mise à jour": 'objectifs_de_la_reforme_date_de_mise_a_jour',
        "Synthèse des résultats - date de mise à jour": 'synthese_des_resultats_date_de_mise_a_jour',
        "Difficultés rencontrées et risques anticipés - date de mise ": 'difficultes_rencontrees_et_risques_anticipes_date_de_mise',
        "Solutions proposées et prochaines étapes - date de mise à jo": 'solutions_proposees_et_prochaines_etapes_date_de_mise_a_jo',
        "Un exemple concret de réussite liée à la réforme - date de ": 'un_exemple_concret_de_reussite_liee_a_la_reforme_date_de',
        "Dernières réalisations et suivi des décisions - date de mise": 'dernieres_realisations_et_suivi_des_decisions_date_de_mise',
        "Méthodologie de renseignement de la météo - date de mise à ": 'methodologie_de_renseignement_de_la_meteo_date_de_mise_a',
        "Equipe Projet donnée qualitative - UTILISATEURS - date de mise": 'equipe_projet_donnee_qualitative_utilisateurs_date_de_mise',
        "Equipe Projet donnée qualitative - GROUPE - date de mise à jo": 'equipe_projet_donnee_qualitative_groupe_date_de_mise_a_jo',
        "Equipe Projet donnée quantitative - UTILISATEURS - date de mis": 'equipe_projet_donnee_quantitative_utilisateurs_date_de_mis',
        "DAC - date de mise à jour": 'dac_date_de_mise_a_jour',
        "Accès en consultation - UTILISATEURS - date de mise à jour": 'acces_en_consultation_utilisateurs_date_de_mise_a_jour',
        "Contexte Local - date de mise à jour": 'contexte_local_date_de_mise_a_jour',
        "Feuille de Route - date de mise à jour": 'feuille_de_route_date_de_mise_a_jour',
        "Référent local - GROUPE - date de mise à jour": 'referent_local_groupe_date_de_mise_a_jour',
    })









































    return my_sql_model_df
