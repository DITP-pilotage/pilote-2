-- Création des tables temporaires.
--  Les données des tables sources ('incremental') sont en effet supprimées lors de la mise à jour par dbt
--  On copie donc les données dans ces tables temporaires.

CREATE TABLE public.commentaire_tmp AS SELECT * FROM public.commentaire;
CREATE TABLE public.synthese_des_resultats_tmp AS SELECT * FROM public.synthese_des_resultats;
CREATE TABLE public.decision_strategique_tmp AS SELECT * FROM public.decision_strategique;
CREATE TABLE public.objectif_tmp AS SELECT * FROM public.objectif;
