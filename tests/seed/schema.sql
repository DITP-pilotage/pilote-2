--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA public;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

ALTER SCHEMA public OWNER TO postgres;

--
-- Name: raw_data; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA raw_data;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA raw_data;


ALTER SCHEMA raw_data OWNER TO postgres;

--
-- Name: application_accessible; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.application_accessible AS ENUM (
    'PILOTE',
    'PILOTE_EVAL',
    'PILOTE_EVAL_PILOTAGE'
);


ALTER TYPE public.application_accessible OWNER TO postgres;

--
-- Name: etape_evaluation_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.etape_evaluation_enum AS ENUM (
    'AUTO_EVALUATION',
    'CONSOLIDATION',
    'INSTRUCTION'
);


ALTER TYPE public.etape_evaluation_enum OWNER TO postgres;

--
-- Name: maille; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.maille AS ENUM (
    'nat',
    'dept',
    'reg'
);


ALTER TYPE public.maille OWNER TO postgres;

--
-- Name: type_ate; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_ate AS ENUM (
    'ate',
    'hors_ate_deconcentre',
    'hors_ate_centralise'
);


ALTER TYPE public.type_ate OWNER TO postgres;

--
-- Name: type_critere; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_critere AS ENUM (
    'COMMUNICATION',
    'FEUILLE_DE_ROUTE',
    'SERVICES_PUBLICS',
    'SIMPLIFICATION'
);


ALTER TYPE public.type_critere OWNER TO postgres;

--
-- Name: type_decision_strategique; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_decision_strategique AS ENUM (
    'suivi_des_decisions'
);


ALTER TYPE public.type_decision_strategique OWNER TO postgres;

--
-- Name: type_evenement; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_evenement AS ENUM (
    'VALEUR_CREEE',
    'VALEUR_MODIFIEE',
    'VALEUR_HISTORISEE',
    'PROPOSITION_VALEUR_CREEE',
    'PROPOSITION_VALEUR_MODIFIEE',
    'PROPOSITION_VALEUR_SUPPRIMEE',
    'PROPOSITION_VALEUR_REFUSEE',
    'PROPOSITION_VALEUR_ACCUSEE_RECEPTION',
    'PROPOSITION_VALEUR_ACCEPTEE',
    'PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE',
    'PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE',
    'PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION'
);


ALTER TYPE public.type_evenement OWNER TO postgres;

--
-- Name: type_objectif; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_objectif AS ENUM (
    'notre_ambition',
    'deja_fait',
    'a_faire'
);


ALTER TYPE public.type_objectif OWNER TO postgres;

--
-- Name: type_statut; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_statut AS ENUM (
    'BROUILLON',
    'PUBLIE',
    'ARCHIVE',
    'SUPPRIME'
);


ALTER TYPE public.type_statut OWNER TO postgres;

--
-- Name: type_statut_indicateur; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_statut_indicateur AS ENUM (
    'PUBLIE',
    'SUPPRIME'
);


ALTER TYPE public.type_statut_indicateur OWNER TO postgres;

--
-- Name: type_statut_proposition; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_statut_proposition AS ENUM (
    'EN_COURS',
    'RETIREE',
    'ANNULEE',
    'ACCEPTEE_VIA_IMPORT',
    'TRAITEE_VIA_IMPORT',
    'IGNOREE_VIA_IMPORT'
);


ALTER TYPE public.type_statut_proposition OWNER TO postgres;

--
-- Name: type_tendance; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_tendance AS ENUM (
    'HAUSSE',
    'BAISSE',
    'STAGNATION'
);


ALTER TYPE public.type_tendance OWNER TO postgres;

--
-- Name: type_valeur; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_valeur AS ENUM (
    'VALEUR_AVANCEMENT',
    'VALEUR_CIBLE',
    'VALEUR_INITIALE'
);


ALTER TYPE public.type_valeur OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: metadata_indicateurs; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_indicateurs (
    indic_id text NOT NULL,
    indic_parent_indic text,
    indic_parent_ch text NOT NULL,
    indic_nom text NOT NULL,
    indic_nom_baro text,
    indic_descr text,
    indic_descr_baro text,
    indic_is_perseverant boolean,
    indic_is_phare boolean,
    indic_is_baro boolean,
    indic_type text,
    indic_source text,
    indic_source_url text,
    indic_methode_calcul text,
    indic_unite text,
    indic_hidden_pilote boolean,
    indic_schema text,
    zg_applicable text,
    indic_territorialise boolean,
    mailles text
);


ALTER TABLE raw_data.metadata_indicateurs OWNER TO postgres;

--
-- Name: metadata_parametrage_indicateurs; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_parametrage_indicateurs (
    indic_id text NOT NULL,
    vi_dept_from text,
    vi_dept_op text,
    va_dept_from text,
    va_dept_op text,
    vc_dept_from text,
    vc_dept_op text,
    vi_reg_from text,
    vi_reg_op text,
    va_reg_from text,
    va_reg_op text,
    vc_reg_from text,
    vc_reg_op text,
    vi_nat_from text,
    vi_nat_op text,
    va_nat_from text,
    va_nat_op text,
    vc_nat_from text,
    vc_nat_op text,
    param_vaca_decumul_from text,
    param_vaca_partition_date text,
    param_vaca_op text,
    param_vacg_decumul_from text,
    param_vacg_partition_date text,
    param_vacg_op text,
    tendance text,
    poids_pourcent_dept_declaree double precision,
    poids_pourcent_nat_declaree double precision,
    poids_pourcent_reg_declaree double precision,
    poids_pourcent_eval_dept_declaree double precision,
    poids_pourcent_eval_nat_declaree double precision,
    poids_pourcent_eval_reg_declaree double precision
);


ALTER TABLE raw_data.metadata_parametrage_indicateurs OWNER TO postgres;

--
-- Name: stg_ppg_metadata__indicateurs; Type: VIEW; Schema: raw_data; Owner: postgres
--

CREATE VIEW raw_data.stg_ppg_metadata__indicateurs AS
 WITH source AS (
         SELECT metadata_indicateurs.indic_id,
            metadata_indicateurs.indic_parent_indic,
            metadata_indicateurs.indic_parent_ch,
            metadata_indicateurs.indic_nom,
            metadata_indicateurs.indic_nom_baro,
            metadata_indicateurs.indic_descr,
            metadata_indicateurs.indic_descr_baro,
            metadata_indicateurs.indic_is_perseverant,
            metadata_indicateurs.indic_is_phare,
            metadata_indicateurs.indic_is_baro,
            metadata_indicateurs.indic_type,
            metadata_indicateurs.indic_source,
            metadata_indicateurs.indic_source_url,
            metadata_indicateurs.indic_methode_calcul,
            metadata_indicateurs.indic_unite,
            metadata_indicateurs.indic_hidden_pilote,
            metadata_indicateurs.indic_schema,
            metadata_indicateurs.zg_applicable,
            metadata_indicateurs.indic_territorialise,
            metadata_indicateurs.mailles
           FROM raw_data.metadata_indicateurs
        ), renamed AS (
         SELECT source.indic_id AS id,
            source.indic_parent_indic AS indicateur_parent_id,
            source.indic_parent_ch AS chantier_id,
            source.indic_nom AS nom,
            source.indic_nom_baro AS nom_barometre,
            source.indic_descr AS description,
            source.indic_descr_baro AS description_barometre,
            source.indic_is_perseverant AS est_perseverant,
            source.indic_is_phare AS est_phare,
            source.indic_is_baro AS est_barometre,
            source.indic_type AS indicateur_type_id,
            source.indic_source AS source,
            source.indic_source_url AS source_url,
            source.indic_methode_calcul AS mode_de_calcul,
            source.indic_unite AS unite,
            source.indic_schema AS schema_validata,
            source.indic_hidden_pilote AS est_cache_dans_pilote,
            source.zg_applicable AS zone_groupe_applicable,
            source.indic_territorialise AS est_territorialise,
                CASE
                    WHEN source.indic_territorialise THEN source.mailles
                    ELSE 'NAT'::text
                END AS maille_la_plus_fine
           FROM source
        )
 SELECT id,
    indicateur_parent_id,
    chantier_id,
    nom,
    nom_barometre,
    description,
    description_barometre,
    est_perseverant,
    est_phare,
    est_barometre,
    indicateur_type_id,
    source,
    source_url,
    mode_de_calcul,
    unite,
    schema_validata,
    est_cache_dans_pilote,
    zone_groupe_applicable,
    est_territorialise,
    maille_la_plus_fine
   FROM renamed;


ALTER VIEW raw_data.stg_ppg_metadata__indicateurs OWNER TO postgres;

--
-- Name: stg_ppg_metadata__parametrage_indicateurs; Type: VIEW; Schema: raw_data; Owner: postgres
--

CREATE VIEW raw_data.stg_ppg_metadata__parametrage_indicateurs AS
 WITH source AS (
         SELECT metadata_parametrage_indicateurs.indic_id,
            metadata_parametrage_indicateurs.vi_dept_from,
            metadata_parametrage_indicateurs.vi_dept_op,
            metadata_parametrage_indicateurs.va_dept_from,
            metadata_parametrage_indicateurs.va_dept_op,
            metadata_parametrage_indicateurs.vc_dept_from,
            metadata_parametrage_indicateurs.vc_dept_op,
            metadata_parametrage_indicateurs.vi_reg_from,
            metadata_parametrage_indicateurs.vi_reg_op,
            metadata_parametrage_indicateurs.va_reg_from,
            metadata_parametrage_indicateurs.va_reg_op,
            metadata_parametrage_indicateurs.vc_reg_from,
            metadata_parametrage_indicateurs.vc_reg_op,
            metadata_parametrage_indicateurs.vi_nat_from,
            metadata_parametrage_indicateurs.vi_nat_op,
            metadata_parametrage_indicateurs.va_nat_from,
            metadata_parametrage_indicateurs.va_nat_op,
            metadata_parametrage_indicateurs.vc_nat_from,
            metadata_parametrage_indicateurs.vc_nat_op,
            metadata_parametrage_indicateurs.param_vaca_decumul_from,
            metadata_parametrage_indicateurs.param_vaca_partition_date,
            metadata_parametrage_indicateurs.param_vaca_op,
            metadata_parametrage_indicateurs.param_vacg_decumul_from,
            metadata_parametrage_indicateurs.param_vacg_partition_date,
            metadata_parametrage_indicateurs.param_vacg_op,
            metadata_parametrage_indicateurs.tendance,
            metadata_parametrage_indicateurs.poids_pourcent_dept_declaree,
            metadata_parametrage_indicateurs.poids_pourcent_nat_declaree,
            metadata_parametrage_indicateurs.poids_pourcent_reg_declaree,
            metadata_parametrage_indicateurs.poids_pourcent_eval_dept_declaree,
            metadata_parametrage_indicateurs.poids_pourcent_eval_nat_declaree,
            metadata_parametrage_indicateurs.poids_pourcent_eval_reg_declaree
           FROM raw_data.metadata_parametrage_indicateurs
        ), renamed AS (
         SELECT source.indic_id AS indicateur_id,
            source.vi_dept_from,
            source.vi_dept_op,
            source.va_dept_from,
            source.va_dept_op,
            source.vc_dept_from,
            source.vc_dept_op,
            source.vi_reg_from,
            source.vi_reg_op,
            source.va_reg_from,
            source.va_reg_op,
            source.vc_reg_from,
            source.vc_reg_op,
            source.vi_nat_from,
            source.vi_nat_op,
            source.va_nat_from,
            source.va_nat_op,
            source.vc_nat_from,
            source.vc_nat_op,
            split_part(source.param_vaca_decumul_from, '::'::text, 1) AS decumule_vaa_par,
            to_date(NULLIF(split_part(source.param_vaca_decumul_from, '::'::text, 2), ''::text), 'YYYY-MM-DD'::text) AS decumule_vaa_depuis,
            split_part(source.param_vaca_partition_date, '::'::text, 1) AS partitionne_vaca_par,
                CASE
                    WHEN (length(split_part(source.param_vaca_partition_date, '::'::text, 2)) > 2) THEN to_date(NULLIF(split_part(source.param_vaca_partition_date, '::'::text, 2), ''::text), 'YYYY-MM-DD'::text)
                    ELSE NULL::date
                END AS partitionne_vaca_depuis,
                CASE
                    WHEN ((length(split_part(source.param_vaca_partition_date, '::'::text, 2)) > 0) AND (length(split_part(source.param_vaca_partition_date, '::'::text, 2)) <= 2)) THEN (split_part(source.param_vaca_partition_date, '::'::text, 2))::integer
                    ELSE NULL::integer
                END AS partitionne_vaca_nombre_de_mois,
            source.param_vaca_op AS vaca_operation,
            split_part(source.param_vacg_decumul_from, '::'::text, 1) AS decumule_vag_par,
            to_date(NULLIF(split_part(source.param_vacg_decumul_from, '::'::text, 2), ''::text), 'YYYY-MM-DD'::text) AS decumule_vag_depuis,
            split_part(source.param_vacg_partition_date, '::'::text, 1) AS partitionne_vacg_par,
                CASE
                    WHEN (length(split_part(source.param_vacg_partition_date, '::'::text, 2)) > 2) THEN to_date(NULLIF(split_part(source.param_vacg_partition_date, '::'::text, 2), ''::text), 'YYYY-MM-DD'::text)
                    ELSE NULL::date
                END AS partitionne_vacg_depuis,
                CASE
                    WHEN ((length(split_part(source.param_vacg_partition_date, '::'::text, 2)) > 0) AND (length(split_part(source.param_vacg_partition_date, '::'::text, 2)) <= 2)) THEN (split_part(source.param_vacg_partition_date, '::'::text, 2))::integer
                    ELSE NULL::integer
                END AS partitionne_vacg_nombre_de_mois,
            source.param_vacg_op AS vacg_operation,
            source.poids_pourcent_dept_declaree,
            source.poids_pourcent_reg_declaree,
            source.poids_pourcent_nat_declaree,
            source.tendance
           FROM source
        )
 SELECT indicateur_id,
    vi_dept_from,
    vi_dept_op,
    va_dept_from,
    va_dept_op,
    vc_dept_from,
    vc_dept_op,
    vi_reg_from,
    vi_reg_op,
    va_reg_from,
    va_reg_op,
    vc_reg_from,
    vc_reg_op,
    vi_nat_from,
    vi_nat_op,
    va_nat_from,
    va_nat_op,
    vc_nat_from,
    vc_nat_op,
    decumule_vaa_par,
    decumule_vaa_depuis,
    partitionne_vaca_par,
    partitionne_vaca_depuis,
    partitionne_vaca_nombre_de_mois,
    vaca_operation,
    decumule_vag_par,
    decumule_vag_depuis,
    partitionne_vacg_par,
    partitionne_vacg_depuis,
    partitionne_vacg_nombre_de_mois,
    vacg_operation,
    poids_pourcent_dept_declaree,
    poids_pourcent_reg_declaree,
    poids_pourcent_nat_declaree,
    tendance
   FROM renamed;


ALTER VIEW raw_data.stg_ppg_metadata__parametrage_indicateurs OWNER TO postgres;

--
-- Name: stg_ppg_metadata__chantiers; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.stg_ppg_metadata__chantiers (
    id text,
    code double precision,
    description text,
    nom text,
    ppg_id text,
    id_chantier_perseverant text,
    est_territorialise boolean,
    nom_engagement text,
    est_cache_dans_pilote boolean,
    ate text,
    statut text,
    zone_groupe_applicable text,
    ministeres_ids text[],
    ministeres_polygrammes text[],
    directeurs_administration_centrale_polygrammes text[],
    directeurs_administration_centrale_ids text[],
    perimetre_ids text[],
    directeurs_projet_noms text[],
    directeurs_projet_mails text[],
    maille_applicable_declaree text[],
    replicate_val_reg_to text,
    replicate_val_nat_to text,
    ch_cible_attendue boolean,
    maille_pilotage text,
    conseiller_mail text,
    maille_applicable text[]
);


ALTER TABLE raw_data.stg_ppg_metadata__chantiers OWNER TO postgres;

--
-- Name: stg_ppg_metadata__engagement; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.stg_ppg_metadata__engagement (
    engagement_id bigint,
    engagement_short text,
    engagement_name text
);


ALTER TABLE raw_data.stg_ppg_metadata__engagement OWNER TO postgres;

--
-- Name: indicateur_territoire; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.indicateur_territoire (
    id text NOT NULL,
    chantier_id text NOT NULL,
    maille public.maille NOT NULL,
    territoire_code text NOT NULL,
    code_insee text NOT NULL,
    zone_id text NOT NULL,
    valeur_cible_mandat double precision,
    taux_avancement_mandat double precision,
    date_valeur_initiale date,
    valeur_initiale double precision,
    territoire_nom text,
    date_valeur_cible_mandat date,
    est_applicable boolean,
    ponderation_zone_declaree double precision,
    ponderation_zone_reel double precision,
    est_a_jour boolean,
    prochaine_date_maj date,
    prochaine_date_maj_jours integer,
    tendance text,
    prochaine_date_valeur_actuelle date,
    evolution_avancement jsonb,
    date_valeur_actuelle_mandat date,
    valeur_actuelle_mandat double precision,
    taux_avancement_mandat_proposition double precision,
    ponderation_zone_declaree_eval double precision,
    ponderation_zone_reel_eval double precision
);


ALTER TABLE public.indicateur_territoire OWNER TO postgres;

--
-- Name: stg_ppg_metadata__zones; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.stg_ppg_metadata__zones (
    id text,
    nom text,
    code_insee text,
    maille text,
    zone_parent text,
    zone_parent_id text[]
);


ALTER TABLE raw_data.stg_ppg_metadata__zones OWNER TO postgres;

--
-- Name: indicateur_territoire_valeur_evenement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.indicateur_territoire_valeur_evenement (
    id uuid NOT NULL,
    indic_id text NOT NULL,
    territoire_code text NOT NULL,
    type_evenement public.type_evenement NOT NULL,
    type_valeur public.type_valeur NOT NULL,
    date_valeur date NOT NULL,
    valeur double precision,
    donnees_complementaires jsonb NOT NULL,
    date_creation timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ordre integer NOT NULL,
    date_modification timestamp(3) without time zone NOT NULL,
    id_auteur_modification uuid NOT NULL,
    correlation_id uuid NOT NULL
);


ALTER TABLE public.indicateur_territoire_valeur_evenement OWNER TO postgres;

--
-- Name: territoire; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.territoire (
    code text NOT NULL,
    nom text NOT NULL,
    nom_affiche text NOT NULL,
    maille public.maille NOT NULL,
    code_insee text NOT NULL,
    code_parent text,
    zone_id text NOT NULL
);


ALTER TABLE public.territoire OWNER TO postgres;

--
-- Name: stg_ppg_metadata__zonegroup_unnest; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.stg_ppg_metadata__zonegroup_unnest (
    zone_group_id text,
    child_zone_id text
);


ALTER TABLE raw_data.stg_ppg_metadata__zonegroup_unnest OWNER TO postgres;

--
-- Name: mesure_indicateur; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.mesure_indicateur (
    date_import timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    indic_id text NOT NULL,
    metric_date text NOT NULL,
    metric_type text NOT NULL,
    metric_value text NOT NULL,
    zone_id text NOT NULL,
    id uuid NOT NULL,
    rapport_id uuid
);


ALTER TABLE raw_data.mesure_indicateur OWNER TO postgres;

--
-- Name: stg_ppg_metadata__porteurs; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.stg_ppg_metadata__porteurs (
    id text,
    acronyme text,
    nom text,
    description text,
    porteur_type_id bigint,
    porteur_type_acronyme text,
    porteur_type_nom text,
    directeur text,
    nom_court text,
    icone text
);


ALTER TABLE raw_data.stg_ppg_metadata__porteurs OWNER TO postgres;

--
-- Name: habilitation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.habilitation (
    utilisateur_id uuid NOT NULL,
    scope_code text NOT NULL,
    territoires text[],
    perimetres text[],
    chantiers text[]
);


ALTER TABLE public.habilitation OWNER TO postgres;

--
-- Name: utilisateur; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilisateur (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    profil_code text NOT NULL,
    date_modification timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fonction text,
    date_creation timestamp(3) without time zone NOT NULL,
    auteur_id_creation uuid,
    auteur_id_modification uuid,
    date_desactivation timestamp(3) without time zone,
    date_visualisation_video_accueil timestamp(3) without time zone,
    date_inscription_infolettre timestamp(3) without time zone,
    date_visualisation_popup_infolettre timestamp(3) without time zone,
    applications_accessibles public.application_accessible[]
);


ALTER TABLE public.utilisateur OWNER TO postgres;

--
-- Name: rapport_import_mesure_indicateur; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rapport_import_mesure_indicateur (
    id uuid NOT NULL,
    date_creation timestamp with time zone NOT NULL,
    utilisateur_email text NOT NULL,
    est_valide boolean DEFAULT false NOT NULL
);


ALTER TABLE public.rapport_import_mesure_indicateur OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: axe; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.axe (
    id text NOT NULL,
    nom text NOT NULL,
    a_supprimer boolean DEFAULT true NOT NULL
);


ALTER TABLE public.axe OWNER TO postgres;

--
-- Name: chantier_evaluation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chantier_evaluation (
    id text NOT NULL,
    code_insee text NOT NULL,
    maille public.maille NOT NULL,
    territoire_code text NOT NULL,
    zone_id text NOT NULL,
    taux_avancement double precision,
    date_calcul date NOT NULL,
    jalon integer DEFAULT 2025 NOT NULL
);


ALTER TABLE public.chantier_evaluation OWNER TO postgres;

--
-- Name: chantier_identite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chantier_identite (
    id text NOT NULL,
    nom text NOT NULL,
    perimetre_ids text[],
    directeurs_administration_centrale text[],
    directions_administration_centrale text[],
    ministeres text[],
    ministeres_acronymes text[],
    directeurs_projet text[],
    axe text DEFAULT 'non renseigné'::text NOT NULL,
    ppg text DEFAULT 'non renseignée'::text NOT NULL,
    directeurs_projet_mails text[],
    est_barometre boolean,
    est_territorialise boolean,
    ate public.type_ate,
    possede_taux_avancement_departemental boolean,
    possede_taux_avancement_regional boolean,
    possede_meteo_departemental boolean,
    possede_meteo_regional boolean,
    statut public.type_statut DEFAULT 'PUBLIE'::public.type_statut NOT NULL,
    cible_attendue boolean DEFAULT true NOT NULL,
    a_supprimer boolean DEFAULT true NOT NULL,
    mailles_applicables public.maille[],
    conseiller_mail text
);


ALTER TABLE public.chantier_identite OWNER TO postgres;

--
-- Name: chantier_territoire; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chantier_territoire (
    id text NOT NULL,
    territoire_code text NOT NULL,
    code_insee text NOT NULL,
    maille public.maille NOT NULL,
    zone_id text NOT NULL,
    taux_avancement_mandat double precision,
    date_taux_avancement_mandat date,
    territoire_nom text,
    meteo text DEFAULT 'NON_RENSEIGNEE'::text,
    taux_avancement_mandat_valeur_precedente double precision,
    est_applicable boolean,
    responsables_locaux text[],
    coordinateurs_territoriaux text[],
    responsables_locaux_mails text[],
    coordinateurs_territoriaux_mails text[],
    derniere_maj_date_qualitative date,
    tendance public.type_tendance,
    tendance_int_index double precision,
    ecart double precision,
    meteo_int_index double precision,
    donnees_maille_source public.maille,
    date_taux_avancement_mandat_valeur_precedente date,
    nombre_propositions_valeur_actuelle integer DEFAULT 0 NOT NULL,
    nombre_propositions_valeur_actuelle_ponderee integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.chantier_territoire OWNER TO postgres;

--
-- Name: chantier_territoire_jalon; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chantier_territoire_jalon (
    id text NOT NULL,
    code_insee text NOT NULL,
    maille public.maille NOT NULL,
    territoire_code text NOT NULL,
    zone_id text NOT NULL,
    jalon integer NOT NULL,
    taux_avancement double precision,
    date_taux_avancement date,
    taux_avancement_eval double precision
);


ALTER TABLE public.chantier_territoire_jalon OWNER TO postgres;

--
-- Name: commentaire; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commentaire (
    chantier_id text NOT NULL,
    type text NOT NULL,
    contenu text NOT NULL,
    date timestamp without time zone NOT NULL,
    maille text NOT NULL,
    code_insee text NOT NULL,
    id text NOT NULL,
    auteur_id uuid,
    territoire_code text NOT NULL
);


ALTER TABLE public.commentaire OWNER TO postgres;

--
-- Name: datajobs_execution; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.datajobs_execution (
    id uuid,
    derniere_date_execution timestamp with time zone
);


ALTER TABLE public.datajobs_execution OWNER TO postgres;

--
-- Name: decision_strategique; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.decision_strategique (
    id text NOT NULL,
    type public.type_decision_strategique NOT NULL,
    contenu text NOT NULL,
    date timestamp without time zone NOT NULL,
    chantier_id text NOT NULL,
    auteur_id uuid
);


ALTER TABLE public.decision_strategique OWNER TO postgres;

--
-- Name: erreur_validation_fichier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.erreur_validation_fichier (
    id uuid NOT NULL,
    nom text NOT NULL,
    cellule text NOT NULL,
    message text NOT NULL,
    nom_du_champ text NOT NULL,
    numero_de_ligne integer NOT NULL,
    position_de_ligne integer NOT NULL,
    position_du_champ integer NOT NULL,
    rapport_id uuid NOT NULL
);


ALTER TABLE public.erreur_validation_fichier OWNER TO postgres;

--
-- Name: etape_evaluation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.etape_evaluation (
    id uuid NOT NULL,
    fiche_evaluation_id uuid NOT NULL,
    type public.etape_evaluation_enum NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    read_only boolean DEFAULT false NOT NULL,
    criteres_valides boolean DEFAULT false,
    objectifs_valides boolean DEFAULT false
);


ALTER TABLE public.etape_evaluation OWNER TO postgres;

--
-- Name: evaluation_critere; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evaluation_critere (
    id uuid NOT NULL,
    etape_evaluation_id uuid NOT NULL,
    critere_id uuid NOT NULL,
    auteur_id uuid NOT NULL,
    note integer,
    commentaire text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    annexe text DEFAULT ''::text NOT NULL,
    date_traitement timestamp(3) without time zone
);


ALTER TABLE public.evaluation_critere OWNER TO postgres;

--
-- Name: evaluation_objectif; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evaluation_objectif (
    id uuid NOT NULL,
    etape_evaluation_id uuid NOT NULL,
    objectif_id uuid NOT NULL,
    auteur_id uuid NOT NULL,
    note integer,
    commentaire text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    annexe text DEFAULT ''::text NOT NULL,
    date_traitement timestamp(3) without time zone
);


ALTER TABLE public.evaluation_objectif OWNER TO postgres;

--
-- Name: fiche_evaluation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fiche_evaluation (
    id uuid NOT NULL,
    jalon integer NOT NULL,
    etape_courante public.etape_evaluation_enum NOT NULL,
    rattachement_code text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.fiche_evaluation OWNER TO postgres;

--
-- Name: gestion_contenu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gestion_contenu (
    nom_variable_contenu text NOT NULL,
    valeur_variable_contenu text NOT NULL
);


ALTER TABLE public.gestion_contenu OWNER TO postgres;

--
-- Name: historisation_modification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historisation_modification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_objet_modifie text NOT NULL,
    utilisateur_nom text,
    type_de_modification text NOT NULL,
    date_de_modification text NOT NULL,
    table_modifie_id text NOT NULL,
    ancienne_valeur jsonb,
    nouvelle_valeur jsonb,
    id_auteur uuid
);


ALTER TABLE public.historisation_modification OWNER TO postgres;

--
-- Name: indicateur_evaluation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.indicateur_evaluation (
    id text NOT NULL,
    chantier_id text NOT NULL,
    territoire_code text NOT NULL,
    code_insee text NOT NULL,
    maille public.maille NOT NULL,
    zone_id text NOT NULL,
    taux_avancement double precision,
    ponderation_declaree double precision NOT NULL,
    ponderation_reelle double precision NOT NULL,
    date_calcul date NOT NULL,
    jalon integer DEFAULT 2025 NOT NULL
);


ALTER TABLE public.indicateur_evaluation OWNER TO postgres;

--
-- Name: indicateur_identite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.indicateur_identite (
    id text NOT NULL,
    nom text NOT NULL,
    chantier_id text NOT NULL,
    type_id text,
    type_nom text,
    est_barometre boolean,
    est_phare boolean,
    description text,
    source text,
    mode_de_calcul text,
    unite_mesure text,
    a_supprimer boolean DEFAULT true NOT NULL,
    dernier_import_date_indic date,
    periodicite text,
    delai_disponibilite integer,
    parent_id text,
    responsables_donnees_mails text[],
    mailles_applicables public.maille[],
    maille_nat_agregee boolean DEFAULT false NOT NULL,
    maille_reg_agregee boolean DEFAULT false NOT NULL,
    statut public.type_statut_indicateur DEFAULT 'PUBLIE'::public.type_statut_indicateur NOT NULL
);


ALTER TABLE public.indicateur_identite OWNER TO postgres;

--
-- Name: indicateur_territoire_jalon; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.indicateur_territoire_jalon (
    id text NOT NULL,
    territoire_code text NOT NULL,
    code_insee text NOT NULL,
    maille public.maille NOT NULL,
    jalon integer NOT NULL,
    zone_id text NOT NULL,
    date_valeur_cible date,
    taux_avancement double precision,
    valeur_cible double precision,
    date_valeur_actuelle date,
    valeur_actuelle double precision,
    taux_avancement_proposition double precision
);


ALTER TABLE public.indicateur_territoire_jalon OWNER TO postgres;

--
-- Name: indicateur_territoire_valeur_evenement_taux_avancement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.indicateur_territoire_valeur_evenement_taux_avancement (
    evenement_id uuid,
    indic_id text,
    territoire_code text,
    date_valeur date,
    ta_indic_id uuid,
    taux_avancement_jalon numeric,
    taux_avancement_mandat numeric
);


ALTER TABLE public.indicateur_territoire_valeur_evenement_taux_avancement OWNER TO postgres;

--
-- Name: instruction_critere; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.instruction_critere (
    id uuid NOT NULL,
    critere_id uuid NOT NULL,
    rattachement_utilisateur_etape_jalon_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.instruction_critere OWNER TO postgres;

--
-- Name: instruction_objectif; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.instruction_objectif (
    id uuid NOT NULL,
    objectif_id uuid NOT NULL,
    rattachement_utilisateur_etape_jalon_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.instruction_objectif OWNER TO postgres;

--
-- Name: mesure_indicateur_temporaire; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mesure_indicateur_temporaire (
    id uuid NOT NULL,
    indic_id text,
    zone_id text,
    metric_date text,
    metric_type text,
    metric_value text,
    rapport_id uuid NOT NULL,
    date_import timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.mesure_indicateur_temporaire OWNER TO postgres;

--
-- Name: ministere; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ministere (
    id text NOT NULL,
    nom text NOT NULL,
    icone text,
    a_supprimer boolean DEFAULT true NOT NULL,
    acronyme text NOT NULL
);


ALTER TABLE public.ministere OWNER TO postgres;

--
-- Name: nouveaute; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nouveaute (
    id text NOT NULL,
    contenu text NOT NULL,
    date_creation timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version text NOT NULL,
    date text NOT NULL
);


ALTER TABLE public.nouveaute OWNER TO postgres;

--
-- Name: objectif; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.objectif (
    id text NOT NULL,
    type public.type_objectif NOT NULL,
    contenu text NOT NULL,
    date timestamp without time zone NOT NULL,
    chantier_id text NOT NULL,
    auteur_id uuid
);


ALTER TABLE public.objectif OWNER TO postgres;

--
-- Name: perimetre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.perimetre (
    id text NOT NULL,
    nom text NOT NULL,
    ministere text,
    ministere_id text,
    a_supprimer boolean DEFAULT true NOT NULL
);


ALTER TABLE public.perimetre OWNER TO postgres;

--
-- Name: ppg; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ppg (
    id text NOT NULL,
    nom text NOT NULL,
    a_supprimer boolean DEFAULT true NOT NULL
);


ALTER TABLE public.ppg OWNER TO postgres;

--
-- Name: profil; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profil (
    code text NOT NULL,
    nom text NOT NULL,
    a_acces_tous_chantiers boolean DEFAULT false NOT NULL,
    a_acces_tous_chantiers_territorialises boolean DEFAULT false NOT NULL,
    a_acces_tous_les_territoires_lecture boolean DEFAULT false NOT NULL,
    a_acces_tous_les_territoires_saisie_commentaire boolean DEFAULT false NOT NULL,
    a_acces_tous_les_territoires_saisie_indicateur boolean DEFAULT false NOT NULL,
    peut_modifier_les_utilisateurs boolean DEFAULT false NOT NULL,
    peut_saisir_des_commentaires boolean DEFAULT false NOT NULL,
    a_access_aux_chantiers_brouillons boolean DEFAULT false NOT NULL,
    a_acces_a_tous_les_chantiers_utilisateurs boolean DEFAULT false NOT NULL,
    a_acces_a_tous_les_territoires_utilisateurs boolean DEFAULT false NOT NULL,
    a_acces_tous_les_chantiers_saisie_commentaire boolean DEFAULT false NOT NULL
);


ALTER TABLE public.profil OWNER TO postgres;

--
-- Name: proposition_valeur_actuelle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proposition_valeur_actuelle (
    id uuid NOT NULL,
    indic_id text NOT NULL,
    valeur_actuelle_proposee double precision NOT NULL,
    territoire_code text NOT NULL,
    date_valeur_actuelle timestamp without time zone,
    id_auteur_modification uuid NOT NULL,
    date_proposition timestamp without time zone,
    motif_proposition text NOT NULL,
    source_donnee_methode_calcul text NOT NULL,
    statut public.type_statut_proposition NOT NULL,
    date_modification_statut timestamp without time zone
);


ALTER TABLE public.proposition_valeur_actuelle OWNER TO postgres;

--
-- Name: rattachement_utilisateur_etape_jalon; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rattachement_utilisateur_etape_jalon (
    id uuid NOT NULL,
    etape public.etape_evaluation_enum NOT NULL,
    jalon integer NOT NULL,
    utilisateur_id uuid NOT NULL,
    rattachement_code text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.rattachement_utilisateur_etape_jalon OWNER TO postgres;

--
-- Name: referentiel_critere; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referentiel_critere (
    id uuid NOT NULL,
    libelle text NOT NULL,
    descriptif text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    type public.type_critere DEFAULT 'COMMUNICATION'::public.type_critere NOT NULL
);


ALTER TABLE public.referentiel_critere OWNER TO postgres;

--
-- Name: referentiel_objectif; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referentiel_objectif (
    id uuid NOT NULL,
    libelle text NOT NULL,
    descriptif text NOT NULL,
    jalon integer NOT NULL,
    rattachement_code text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    tutelle_id uuid,
    indicateur_cible text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.referentiel_objectif OWNER TO postgres;

--
-- Name: referentiel_rattachement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referentiel_rattachement (
    code text NOT NULL,
    libelle text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    groupe text NOT NULL,
    ordre integer NOT NULL
);


ALTER TABLE public.referentiel_rattachement OWNER TO postgres;

--
-- Name: referentiel_rattachement_groupe; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referentiel_rattachement_groupe (
    code text NOT NULL,
    libelle text NOT NULL,
    ordre integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.referentiel_rattachement_groupe OWNER TO postgres;

--
-- Name: referentiel_sous_critere; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referentiel_sous_critere (
    id uuid NOT NULL,
    libelle text NOT NULL,
    descriptif text NOT NULL,
    parent_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.referentiel_sous_critere OWNER TO postgres;

--
-- Name: referentiel_tutelle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referentiel_tutelle (
    id uuid NOT NULL,
    nom text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.referentiel_tutelle OWNER TO postgres;

--
-- Name: scope; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scope (
    code text NOT NULL,
    nom text NOT NULL
);


ALTER TABLE public.scope OWNER TO postgres;

--
-- Name: synthese_des_resultats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.synthese_des_resultats (
    id text NOT NULL,
    chantier_id text NOT NULL,
    maille text NOT NULL,
    code_insee text NOT NULL,
    meteo text,
    date_meteo timestamp without time zone,
    commentaire text,
    date_commentaire timestamp without time zone,
    auteur_id uuid,
    territoire_code text NOT NULL
);


ALTER TABLE public.synthese_des_resultats OWNER TO postgres;

--
-- Name: token_api_information; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.token_api_information (
    email text NOT NULL,
    date_creation text NOT NULL
);


ALTER TABLE public.token_api_information OWNER TO postgres;

--
-- Name: commentaires; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.commentaires (
    chantier_id text NOT NULL,
    maille text NOT NULL,
    code_insee text NOT NULL,
    date text NOT NULL,
    type text NOT NULL,
    contenu text,
    meteo text,
    date_meteo text,
    auteur_email text
);


ALTER TABLE raw_data.commentaires OWNER TO postgres;

--
-- Name: metadata_axes; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_axes (
    axe_id text,
    axe_short text,
    axe_name text,
    axe_desc double precision
);


ALTER TABLE raw_data.metadata_axes OWNER TO postgres;

--
-- Name: metadata_chantier_meteos; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_chantier_meteos (
    ch_meteo_id text,
    ch_meteo_name text,
    ch_meteo_descr text,
    ch_meteo_name_dfakto text
);


ALTER TABLE raw_data.metadata_chantier_meteos OWNER TO postgres;

--
-- Name: metadata_chantiers; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_chantiers (
    chantier_id text,
    ch_code double precision,
    ch_descr text,
    ch_nom text,
    ch_dp text,
    ch_ppg text,
    ch_perseverant text,
    "porteur_shorts_noDAC" text,
    "porteur_ids_noDAC" text,
    "porteur_shorts_DAC" text,
    "porteur_ids_DAC" text,
    ch_per text,
    ch_dp_mail text,
    ch_territo boolean,
    engagement_short text,
    ch_hidden_pilote double precision,
    ch_saisie_ate text,
    ch_state text,
    zg_applicable text,
    maille_applicable text,
    ch_cible_attendue boolean,
    replicate_val_reg_to text,
    replicate_val_nat_to text,
    conseiller_mail text
);


ALTER TABLE raw_data.metadata_chantiers OWNER TO postgres;

--
-- Name: metadata_engagement; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_engagement (
    engagement_id bigint,
    engagement_short text,
    engagement_name text,
    engagement_desc text
);


ALTER TABLE raw_data.metadata_engagement OWNER TO postgres;

--
-- Name: metadata_indicateur_types; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_indicateur_types (
    indic_type_id text,
    indic_type_name text,
    indic_type_descr text,
    indic_type_rank text
);


ALTER TABLE raw_data.metadata_indicateur_types OWNER TO postgres;

--
-- Name: metadata_indicateurs_complementaire; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_indicateurs_complementaire (
    indic_id text NOT NULL,
    reforme_prioritaire text,
    projet_annuel_perf boolean,
    detail_projet_annuel_perf text,
    periodicite text,
    delai_disponibilite integer,
    indic_territorialise boolean,
    frequence_territoriale text,
    mailles text,
    admin_source text,
    methode_collecte text,
    si_source text,
    donnee_ouverte boolean,
    modalites_donnee_ouverte text,
    resp_donnees text,
    resp_donnees_email text,
    contact_technique text,
    contact_technique_email text,
    commentaire text,
    couverture_temporelle text NOT NULL,
    maille_pilotage text NOT NULL,
    cible_attendue boolean DEFAULT true NOT NULL
);


ALTER TABLE raw_data.metadata_indicateurs_complementaire OWNER TO postgres;

--
-- Name: metadata_indicateurs_hidden; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_indicateurs_hidden (
    indic_id text NOT NULL,
    indic_parent_indic text,
    indic_parent_ch text NOT NULL,
    indic_nom text NOT NULL,
    indic_nom_baro text,
    indic_descr text,
    indic_descr_baro text,
    indic_is_perseverant boolean,
    indic_is_phare boolean,
    indic_is_baro boolean,
    indic_type text,
    indic_source text,
    indic_source_url text,
    indic_methode_calcul text,
    indic_unite text,
    indic_hidden_pilote boolean,
    indic_schema text,
    zg_applicable text
);


ALTER TABLE raw_data.metadata_indicateurs_hidden OWNER TO postgres;

--
-- Name: metadata_perimetres; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_perimetres (
    perimetre_id text,
    per_nom text,
    per_short text,
    per_picto double precision,
    per_porteur_id double precision,
    per_porteur_name_short text,
    per_top_dfakto text
);


ALTER TABLE raw_data.metadata_perimetres OWNER TO postgres;

--
-- Name: metadata_porteurs; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_porteurs (
    porteur_id bigint,
    porteur_short text,
    porteur_name text,
    porteur_desc text,
    porteur_type_id bigint,
    porteur_type_short text,
    porteur_type_name text,
    porteur_directeur text,
    porteur_name_short text,
    porteur_picto text
);


ALTER TABLE raw_data.metadata_porteurs OWNER TO postgres;

--
-- Name: metadata_ppgs; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_ppgs (
    ppg_id text,
    ppg_axe text,
    ppg_code text,
    ppg_desc text,
    ppg_nom text,
    porteur_shorts text,
    porteur_ids text
);


ALTER TABLE raw_data.metadata_ppgs OWNER TO postgres;

--
-- Name: metadata_zonegroup; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_zonegroup (
    zone_group_id text,
    zg_name text,
    zg_desc text,
    zg_zones text
);


ALTER TABLE raw_data.metadata_zonegroup OWNER TO postgres;

--
-- Name: metadata_zones; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.metadata_zones (
    zone_id text,
    nom text,
    zone_code text,
    zone_type text,
    zone_parent text
);


ALTER TABLE raw_data.metadata_zones OWNER TO postgres;

--
-- Name: stg_import_fichier__mesures_indicateurs; Type: VIEW; Schema: raw_data; Owner: postgres
--

CREATE VIEW raw_data.stg_import_fichier__mesures_indicateurs AS
 WITH source AS (
         SELECT mesure_indicateur.date_import,
            mesure_indicateur.indic_id,
            mesure_indicateur.metric_date,
            mesure_indicateur.metric_type,
            mesure_indicateur.metric_value,
            mesure_indicateur.zone_id,
            mesure_indicateur.id,
            mesure_indicateur.rapport_id
           FROM raw_data.mesure_indicateur
        ), renamed AS (
         SELECT source.id,
            source.indic_id AS indicateur_id,
            source.zone_id,
                CASE
                    WHEN (source.metric_date = '2023-06-31'::text) THEN to_date('2023-06-30'::text, 'YYYY-MM-DD'::text)
                    WHEN (source.metric_date ~~ '%/%/%'::text) THEN to_date(source.metric_date, 'DD/MM/YYYY'::text)
                    WHEN (source.metric_date ~~ '%-%-%'::text) THEN to_date(source.metric_date, 'YYYY-MM-DD'::text)
                    ELSE NULL::date
                END AS date_releve,
            source.metric_type AS type_mesure,
                CASE
                    WHEN (source.metric_value = 'null'::text) THEN NULL::numeric
                    WHEN (source.metric_value = 'undefined'::text) THEN NULL::numeric
                    WHEN (source.metric_value = ''::text) THEN NULL::numeric
                    ELSE (source.metric_value)::numeric
                END AS valeur,
            source.date_import
           FROM source
          WHERE (source.metric_value <> 'null'::text)
        )
 SELECT id,
    indicateur_id,
    zone_id,
    date_releve,
    type_mesure,
    valeur,
    date_import
   FROM renamed;


ALTER VIEW raw_data.stg_import_fichier__mesures_indicateurs OWNER TO postgres;

--
-- Name: stg_import_massif__commentaires; Type: VIEW; Schema: raw_data; Owner: postgres
--

CREATE VIEW raw_data.stg_import_massif__commentaires AS
 WITH source AS (
         SELECT commentaires.chantier_id,
            commentaires.maille,
            commentaires.code_insee,
            commentaires.date,
            commentaires.type,
            commentaires.contenu,
            commentaires.meteo,
            commentaires.date_meteo,
            commentaires.auteur_email
           FROM raw_data.commentaires
        ), renamed AS (
         SELECT source.chantier_id,
            source.type,
            source.contenu,
            to_date(source.date, 'DD/MM/YYYY'::text) AS date,
            NULL::text AS auteur,
            source.auteur_email,
            source.maille,
            (source.code_insee)::character varying AS code_insee,
            to_date(source.date_meteo, 'DD/MM/YYYY'::text) AS date_meteo,
            source.meteo
           FROM source
        )
 SELECT chantier_id,
    type,
    contenu,
    date,
    auteur,
    auteur_email,
    maille,
    code_insee,
    date_meteo,
    meteo
   FROM renamed;


ALTER VIEW raw_data.stg_import_massif__commentaires OWNER TO postgres;

--
-- Name: stg_ppg_metadata__axes; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.stg_ppg_metadata__axes (
    id text,
    nom_court text,
    nom text,
    description double precision
);


ALTER TABLE raw_data.stg_ppg_metadata__axes OWNER TO postgres;

--
-- Name: stg_ppg_metadata__chantier_meteos; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.stg_ppg_metadata__chantier_meteos (
    id text,
    nom text,
    description text,
    nom_dfakto text
);


ALTER TABLE raw_data.stg_ppg_metadata__chantier_meteos OWNER TO postgres;

--
-- Name: stg_ppg_metadata__indicateur_types; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.stg_ppg_metadata__indicateur_types (
    id text,
    nom text,
    description text,
    rang text
);


ALTER TABLE raw_data.stg_ppg_metadata__indicateur_types OWNER TO postgres;

--
-- Name: stg_ppg_metadata__perimetres; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.stg_ppg_metadata__perimetres (
    id text,
    nom text,
    polygramme text,
    pictogramme double precision,
    ministere_id text,
    ministere_nom text
);


ALTER TABLE raw_data.stg_ppg_metadata__perimetres OWNER TO postgres;

--
-- Name: stg_ppg_metadata__ppgs; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.stg_ppg_metadata__ppgs (
    id text,
    axe_id text,
    code text,
    description text,
    nom text,
    porteur_noms_court text[],
    porteur_ids text[]
);


ALTER TABLE raw_data.stg_ppg_metadata__ppgs OWNER TO postgres;

--
-- Name: stg_ppg_metadata__zones_unnest; Type: TABLE; Schema: raw_data; Owner: postgres
--

CREATE TABLE raw_data.stg_ppg_metadata__zones_unnest (
    zone_id text,
    zone_nom text,
    zone_code text,
    zone_type text,
    zone_id_parent text
);


ALTER TABLE raw_data.stg_ppg_metadata__zones_unnest OWNER TO postgres;

--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: axe axe_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.axe
    ADD CONSTRAINT axe_pkey PRIMARY KEY (id);


--
-- Name: chantier_evaluation chantier_evaluation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chantier_evaluation
    ADD CONSTRAINT chantier_evaluation_pkey PRIMARY KEY (id, territoire_code, jalon, date_calcul);


--
-- Name: chantier_identite chantier_identite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chantier_identite
    ADD CONSTRAINT chantier_identite_pkey PRIMARY KEY (id);


--
-- Name: chantier_territoire_jalon chantier_territoire_jalon_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chantier_territoire_jalon
    ADD CONSTRAINT chantier_territoire_jalon_pkey PRIMARY KEY (id, territoire_code, jalon);


--
-- Name: chantier_territoire chantier_territoire_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chantier_territoire
    ADD CONSTRAINT chantier_territoire_pkey PRIMARY KEY (id, territoire_code);


--
-- Name: commentaire commentaire_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentaire
    ADD CONSTRAINT commentaire_pkey PRIMARY KEY (id);


--
-- Name: decision_strategique decision_strategique_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decision_strategique
    ADD CONSTRAINT decision_strategique_pkey PRIMARY KEY (id);


--
-- Name: erreur_validation_fichier erreur_validation_fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.erreur_validation_fichier
    ADD CONSTRAINT erreur_validation_fichier_pkey PRIMARY KEY (id);


--
-- Name: etape_evaluation etape_evaluation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etape_evaluation
    ADD CONSTRAINT etape_evaluation_pkey PRIMARY KEY (id);


--
-- Name: evaluation_critere evaluation_critere_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluation_critere
    ADD CONSTRAINT evaluation_critere_pkey PRIMARY KEY (id);


--
-- Name: evaluation_objectif evaluation_objectif_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluation_objectif
    ADD CONSTRAINT evaluation_objectif_pkey PRIMARY KEY (id);


--
-- Name: fiche_evaluation fiche_evaluation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_evaluation
    ADD CONSTRAINT fiche_evaluation_pkey PRIMARY KEY (id);


--
-- Name: gestion_contenu gestion_contenu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gestion_contenu
    ADD CONSTRAINT gestion_contenu_pkey PRIMARY KEY (nom_variable_contenu);


--
-- Name: historisation_modification historisation_modification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historisation_modification
    ADD CONSTRAINT historisation_modification_pkey PRIMARY KEY (id);


--
-- Name: indicateur_evaluation indicateur_evaluation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_evaluation
    ADD CONSTRAINT indicateur_evaluation_pkey PRIMARY KEY (id, territoire_code, date_calcul);


--
-- Name: indicateur_identite indicateur_identite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_identite
    ADD CONSTRAINT indicateur_identite_pkey PRIMARY KEY (id);


--
-- Name: indicateur_territoire_jalon indicateur_territoire_jalon_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_territoire_jalon
    ADD CONSTRAINT indicateur_territoire_jalon_pkey PRIMARY KEY (id, territoire_code, jalon);


--
-- Name: indicateur_territoire indicateur_territoire_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_territoire
    ADD CONSTRAINT indicateur_territoire_pkey PRIMARY KEY (id, territoire_code);


--
-- Name: indicateur_territoire_valeur_evenement indicateur_territoire_valeur_evenement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_territoire_valeur_evenement
    ADD CONSTRAINT indicateur_territoire_valeur_evenement_pkey PRIMARY KEY (id);


--
-- Name: instruction_critere instruction_critere_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instruction_critere
    ADD CONSTRAINT instruction_critere_pkey PRIMARY KEY (id);


--
-- Name: instruction_objectif instruction_objectif_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instruction_objectif
    ADD CONSTRAINT instruction_objectif_pkey PRIMARY KEY (id);


--
-- Name: mesure_indicateur_temporaire mesure_indicateur_temporaire_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mesure_indicateur_temporaire
    ADD CONSTRAINT mesure_indicateur_temporaire_pkey PRIMARY KEY (id);


--
-- Name: ministere ministere_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ministere
    ADD CONSTRAINT ministere_pkey PRIMARY KEY (id);


--
-- Name: nouveaute nouveaute_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nouveaute
    ADD CONSTRAINT nouveaute_pkey PRIMARY KEY (id);


--
-- Name: objectif objectif_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.objectif
    ADD CONSTRAINT objectif_pkey PRIMARY KEY (id);


--
-- Name: perimetre perimetre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perimetre
    ADD CONSTRAINT perimetre_pkey PRIMARY KEY (id);


--
-- Name: ppg ppg_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ppg
    ADD CONSTRAINT ppg_pkey PRIMARY KEY (id);


--
-- Name: profil profil_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profil
    ADD CONSTRAINT profil_pkey PRIMARY KEY (code);


--
-- Name: proposition_valeur_actuelle proposition_valeur_actuelle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposition_valeur_actuelle
    ADD CONSTRAINT proposition_valeur_actuelle_pkey PRIMARY KEY (id);


--
-- Name: rapport_import_mesure_indicateur rapport_import_mesure_indicateur_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rapport_import_mesure_indicateur
    ADD CONSTRAINT rapport_import_mesure_indicateur_pkey PRIMARY KEY (id);


--
-- Name: rattachement_utilisateur_etape_jalon rattachement_utilisateur_etape_jalon_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rattachement_utilisateur_etape_jalon
    ADD CONSTRAINT rattachement_utilisateur_etape_jalon_pkey PRIMARY KEY (id);


--
-- Name: referentiel_critere referentiel_critere_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referentiel_critere
    ADD CONSTRAINT referentiel_critere_pkey PRIMARY KEY (id);


--
-- Name: referentiel_objectif referentiel_objectif_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referentiel_objectif
    ADD CONSTRAINT referentiel_objectif_pkey PRIMARY KEY (id);


--
-- Name: referentiel_rattachement_groupe referentiel_rattachement_groupe_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referentiel_rattachement_groupe
    ADD CONSTRAINT referentiel_rattachement_groupe_pkey PRIMARY KEY (code);


--
-- Name: referentiel_rattachement referentiel_rattachement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referentiel_rattachement
    ADD CONSTRAINT referentiel_rattachement_pkey PRIMARY KEY (code);


--
-- Name: referentiel_sous_critere referentiel_sous_critere_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referentiel_sous_critere
    ADD CONSTRAINT referentiel_sous_critere_pkey PRIMARY KEY (id);


--
-- Name: referentiel_tutelle referentiel_tutelle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referentiel_tutelle
    ADD CONSTRAINT referentiel_tutelle_pkey PRIMARY KEY (id);


--
-- Name: scope scope_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scope
    ADD CONSTRAINT scope_pkey PRIMARY KEY (code);


--
-- Name: synthese_des_resultats synthese_des_resultats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.synthese_des_resultats
    ADD CONSTRAINT synthese_des_resultats_pkey PRIMARY KEY (id);


--
-- Name: territoire territoire_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territoire
    ADD CONSTRAINT territoire_pkey PRIMARY KEY (code);


--
-- Name: token_api_information token_api_information_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_api_information
    ADD CONSTRAINT token_api_information_pkey PRIMARY KEY (email);


--
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id);


--
-- Name: commentaires commentaires_pkey; Type: CONSTRAINT; Schema: raw_data; Owner: postgres
--

ALTER TABLE ONLY raw_data.commentaires
    ADD CONSTRAINT commentaires_pkey PRIMARY KEY (chantier_id, code_insee, maille, type, date);


--
-- Name: mesure_indicateur mesure_indicateur_pkey; Type: CONSTRAINT; Schema: raw_data; Owner: postgres
--

ALTER TABLE ONLY raw_data.mesure_indicateur
    ADD CONSTRAINT mesure_indicateur_pkey PRIMARY KEY (id);


--
-- Name: metadata_indicateurs_complementaire metadata_indicateurs_complementaire_pkey; Type: CONSTRAINT; Schema: raw_data; Owner: postgres
--

ALTER TABLE ONLY raw_data.metadata_indicateurs_complementaire
    ADD CONSTRAINT metadata_indicateurs_complementaire_pkey PRIMARY KEY (indic_id);


--
-- Name: metadata_indicateurs_hidden metadata_indicateurs_hidden_pkey; Type: CONSTRAINT; Schema: raw_data; Owner: postgres
--

ALTER TABLE ONLY raw_data.metadata_indicateurs_hidden
    ADD CONSTRAINT metadata_indicateurs_hidden_pkey PRIMARY KEY (indic_id);


--
-- Name: metadata_indicateurs metadata_indicateurs_pkey; Type: CONSTRAINT; Schema: raw_data; Owner: postgres
--

ALTER TABLE ONLY raw_data.metadata_indicateurs
    ADD CONSTRAINT metadata_indicateurs_pkey PRIMARY KEY (indic_id);


--
-- Name: metadata_parametrage_indicateurs metadata_parametrage_indicateurs_pkey; Type: CONSTRAINT; Schema: raw_data; Owner: postgres
--

ALTER TABLE ONLY raw_data.metadata_parametrage_indicateurs
    ADD CONSTRAINT metadata_parametrage_indicateurs_pkey PRIMARY KEY (indic_id);


--
-- Name: 304ae3f4b9566f2df014741069929759; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "304ae3f4b9566f2df014741069929759" ON public.indicateur_territoire_valeur_evenement_taux_avancement USING btree (evenement_id);


--
-- Name: 34419569021a55db76ee4a93709c1ebf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "34419569021a55db76ee4a93709c1ebf" ON public.indicateur_territoire_valeur_evenement_taux_avancement USING btree (territoire_code);


--
-- Name: 62dc1492211769346aecbed4a41eded1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "62dc1492211769346aecbed4a41eded1" ON public.indicateur_territoire_valeur_evenement_taux_avancement USING btree (indic_id);


--
-- Name: etape_evaluation_fiche_evaluation_id_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX etape_evaluation_fiche_evaluation_id_type_key ON public.etape_evaluation USING btree (fiche_evaluation_id, type);


--
-- Name: evaluation_critere_etape_evaluation_id_critere_id_auteur_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX evaluation_critere_etape_evaluation_id_critere_id_auteur_id_key ON public.evaluation_critere USING btree (etape_evaluation_id, critere_id, auteur_id);


--
-- Name: evaluation_objectif_etape_evaluation_id_objectif_id_auteur__key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX evaluation_objectif_etape_evaluation_id_objectif_id_auteur__key ON public.evaluation_objectif USING btree (etape_evaluation_id, objectif_id, auteur_id);


--
-- Name: fiche_evaluation_rattachement_code_jalon_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX fiche_evaluation_rattachement_code_jalon_key ON public.fiche_evaluation USING btree (rattachement_code, jalon);


--
-- Name: habilitation_utilisateur_id_scope_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX habilitation_utilisateur_id_scope_code_key ON public.habilitation USING btree (utilisateur_id, scope_code);


--
-- Name: indicateur_identite_chantier_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX indicateur_identite_chantier_id_idx ON public.indicateur_identite USING btree (chantier_id);


--
-- Name: indicateur_territoire_chantier_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX indicateur_territoire_chantier_id_idx ON public.indicateur_territoire USING btree (chantier_id);


--
-- Name: indicateur_territoire_id_territoire_code_chantier_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX indicateur_territoire_id_territoire_code_chantier_id_idx ON public.indicateur_territoire USING btree (id, territoire_code, chantier_id);


--
-- Name: indicateur_territoire_jalon_id_territoire_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX indicateur_territoire_jalon_id_territoire_code_idx ON public.indicateur_territoire_jalon USING btree (id, territoire_code);


--
-- Name: indicateur_territoire_jalon_jalon_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX indicateur_territoire_jalon_jalon_idx ON public.indicateur_territoire_jalon USING btree (jalon);


--
-- Name: indicateur_territoire_territoire_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX indicateur_territoire_territoire_code_idx ON public.indicateur_territoire USING btree (territoire_code);


--
-- Name: indicateur_territoire_valeur_evenement_date_creation_ordre_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX indicateur_territoire_valeur_evenement_date_creation_ordre_idx ON public.indicateur_territoire_valeur_evenement USING btree (date_creation, ordre);


--
-- Name: indicateur_territoire_valeur_evenement_indic_id_territoire__idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX indicateur_territoire_valeur_evenement_indic_id_territoire__idx ON public.indicateur_territoire_valeur_evenement USING btree (indic_id, territoire_code, type_valeur);


--
-- Name: instruction_critere_critere_id_rattachement_utilisateur_eta_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX instruction_critere_critere_id_rattachement_utilisateur_eta_key ON public.instruction_critere USING btree (critere_id, rattachement_utilisateur_etape_jalon_id);


--
-- Name: instruction_objectif_objectif_id_rattachement_utilisateur_e_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX instruction_objectif_objectif_id_rattachement_utilisateur_e_key ON public.instruction_objectif USING btree (objectif_id, rattachement_utilisateur_etape_jalon_id);


--
-- Name: rattachement_utilisateur_etape_jalon_utilisateur_id_rattach_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX rattachement_utilisateur_etape_jalon_utilisateur_id_rattach_key ON public.rattachement_utilisateur_etape_jalon USING btree (utilisateur_id, rattachement_code, jalon, etape);


--
-- Name: utilisateur_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX utilisateur_email_key ON public.utilisateur USING btree (email);


--
-- Name: ix_raw_data_metadata_axes_axe_id; Type: INDEX; Schema: raw_data; Owner: postgres
--

CREATE INDEX ix_raw_data_metadata_axes_axe_id ON raw_data.metadata_axes USING btree (axe_id);


--
-- Name: ix_raw_data_metadata_chantier_meteos_ch_meteo_id; Type: INDEX; Schema: raw_data; Owner: postgres
--

CREATE INDEX ix_raw_data_metadata_chantier_meteos_ch_meteo_id ON raw_data.metadata_chantier_meteos USING btree (ch_meteo_id);


--
-- Name: ix_raw_data_metadata_chantiers_chantier_id; Type: INDEX; Schema: raw_data; Owner: postgres
--

CREATE INDEX ix_raw_data_metadata_chantiers_chantier_id ON raw_data.metadata_chantiers USING btree (chantier_id);


--
-- Name: ix_raw_data_metadata_engagement_engagement_id; Type: INDEX; Schema: raw_data; Owner: postgres
--

CREATE INDEX ix_raw_data_metadata_engagement_engagement_id ON raw_data.metadata_engagement USING btree (engagement_id);


--
-- Name: ix_raw_data_metadata_indicateur_types_indic_type_id; Type: INDEX; Schema: raw_data; Owner: postgres
--

CREATE INDEX ix_raw_data_metadata_indicateur_types_indic_type_id ON raw_data.metadata_indicateur_types USING btree (indic_type_id);


--
-- Name: ix_raw_data_metadata_perimetres_perimetre_id; Type: INDEX; Schema: raw_data; Owner: postgres
--

CREATE INDEX ix_raw_data_metadata_perimetres_perimetre_id ON raw_data.metadata_perimetres USING btree (perimetre_id);


--
-- Name: ix_raw_data_metadata_porteurs_porteur_id; Type: INDEX; Schema: raw_data; Owner: postgres
--

CREATE INDEX ix_raw_data_metadata_porteurs_porteur_id ON raw_data.metadata_porteurs USING btree (porteur_id);


--
-- Name: ix_raw_data_metadata_ppgs_ppg_id; Type: INDEX; Schema: raw_data; Owner: postgres
--

CREATE INDEX ix_raw_data_metadata_ppgs_ppg_id ON raw_data.metadata_ppgs USING btree (ppg_id);


--
-- Name: ix_raw_data_metadata_zonegroup_zone_group_id; Type: INDEX; Schema: raw_data; Owner: postgres
--

CREATE INDEX ix_raw_data_metadata_zonegroup_zone_group_id ON raw_data.metadata_zonegroup USING btree (zone_group_id);


--
-- Name: ix_raw_data_metadata_zones_zone_id; Type: INDEX; Schema: raw_data; Owner: postgres
--

CREATE INDEX ix_raw_data_metadata_zones_zone_id ON raw_data.metadata_zones USING btree (zone_id);


--
-- Name: chantier_evaluation chantier_evaluation_id_territoire_code_jalon_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chantier_evaluation
    ADD CONSTRAINT chantier_evaluation_id_territoire_code_jalon_fkey FOREIGN KEY (id, territoire_code, jalon) REFERENCES public.chantier_territoire_jalon(id, territoire_code, jalon) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chantier_evaluation chantier_evaluation_territoire_code_jalon_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chantier_evaluation
    ADD CONSTRAINT chantier_evaluation_territoire_code_jalon_fkey FOREIGN KEY (territoire_code, jalon) REFERENCES public.fiche_evaluation(rattachement_code, jalon) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chantier_territoire chantier_territoire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chantier_territoire
    ADD CONSTRAINT chantier_territoire_id_fkey FOREIGN KEY (id) REFERENCES public.chantier_identite(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chantier_territoire_jalon chantier_territoire_jalon_id_territoire_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chantier_territoire_jalon
    ADD CONSTRAINT chantier_territoire_jalon_id_territoire_code_fkey FOREIGN KEY (id, territoire_code) REFERENCES public.chantier_territoire(id, territoire_code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chantier_territoire chantier_territoire_territoire_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chantier_territoire
    ADD CONSTRAINT chantier_territoire_territoire_code_fkey FOREIGN KEY (territoire_code) REFERENCES public.territoire(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: commentaire commentaire_auteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentaire
    ADD CONSTRAINT commentaire_auteur_id_fkey FOREIGN KEY (auteur_id) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: commentaire commentaire_chantier_id_territoire_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentaire
    ADD CONSTRAINT commentaire_chantier_id_territoire_code_fkey FOREIGN KEY (chantier_id, territoire_code) REFERENCES public.chantier_territoire(id, territoire_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: decision_strategique decision_strategique_auteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decision_strategique
    ADD CONSTRAINT decision_strategique_auteur_id_fkey FOREIGN KEY (auteur_id) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: decision_strategique decision_strategique_chantier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decision_strategique
    ADD CONSTRAINT decision_strategique_chantier_id_fkey FOREIGN KEY (chantier_id) REFERENCES public.chantier_identite(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: erreur_validation_fichier erreur_validation_fichier_rapport_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.erreur_validation_fichier
    ADD CONSTRAINT erreur_validation_fichier_rapport_id_fkey FOREIGN KEY (rapport_id) REFERENCES public.rapport_import_mesure_indicateur(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: etape_evaluation etape_evaluation_fiche_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etape_evaluation
    ADD CONSTRAINT etape_evaluation_fiche_evaluation_id_fkey FOREIGN KEY (fiche_evaluation_id) REFERENCES public.fiche_evaluation(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: evaluation_critere evaluation_critere_auteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluation_critere
    ADD CONSTRAINT evaluation_critere_auteur_id_fkey FOREIGN KEY (auteur_id) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: evaluation_critere evaluation_critere_critere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluation_critere
    ADD CONSTRAINT evaluation_critere_critere_id_fkey FOREIGN KEY (critere_id) REFERENCES public.referentiel_critere(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: evaluation_critere evaluation_critere_etape_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluation_critere
    ADD CONSTRAINT evaluation_critere_etape_evaluation_id_fkey FOREIGN KEY (etape_evaluation_id) REFERENCES public.etape_evaluation(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: evaluation_objectif evaluation_objectif_auteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluation_objectif
    ADD CONSTRAINT evaluation_objectif_auteur_id_fkey FOREIGN KEY (auteur_id) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: evaluation_objectif evaluation_objectif_etape_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluation_objectif
    ADD CONSTRAINT evaluation_objectif_etape_evaluation_id_fkey FOREIGN KEY (etape_evaluation_id) REFERENCES public.etape_evaluation(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: evaluation_objectif evaluation_objectif_objectif_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluation_objectif
    ADD CONSTRAINT evaluation_objectif_objectif_id_fkey FOREIGN KEY (objectif_id) REFERENCES public.referentiel_objectif(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fiche_evaluation fiche_evaluation_rattachement_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_evaluation
    ADD CONSTRAINT fiche_evaluation_rattachement_code_fkey FOREIGN KEY (rattachement_code) REFERENCES public.referentiel_rattachement(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: habilitation habilitation_scope_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habilitation
    ADD CONSTRAINT habilitation_scope_code_fkey FOREIGN KEY (scope_code) REFERENCES public.scope(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: habilitation habilitation_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habilitation
    ADD CONSTRAINT habilitation_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: historisation_modification historisation_modification_id_auteur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historisation_modification
    ADD CONSTRAINT historisation_modification_id_auteur_fkey FOREIGN KEY (id_auteur) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: indicateur_evaluation indicateur_evaluation_chantier_id_territoire_code_date_cal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_evaluation
    ADD CONSTRAINT indicateur_evaluation_chantier_id_territoire_code_date_cal_fkey FOREIGN KEY (chantier_id, territoire_code, date_calcul, jalon) REFERENCES public.chantier_evaluation(id, territoire_code, date_calcul, jalon) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: indicateur_evaluation indicateur_evaluation_id_territoire_code_jalon_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_evaluation
    ADD CONSTRAINT indicateur_evaluation_id_territoire_code_jalon_fkey FOREIGN KEY (id, territoire_code, jalon) REFERENCES public.indicateur_territoire_jalon(id, territoire_code, jalon) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: indicateur_identite indicateur_identite_chantier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_identite
    ADD CONSTRAINT indicateur_identite_chantier_id_fkey FOREIGN KEY (chantier_id) REFERENCES public.chantier_identite(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: indicateur_territoire indicateur_territoire_chantier_id_territoire_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_territoire
    ADD CONSTRAINT indicateur_territoire_chantier_id_territoire_code_fkey FOREIGN KEY (chantier_id, territoire_code) REFERENCES public.chantier_territoire(id, territoire_code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: indicateur_territoire indicateur_territoire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_territoire
    ADD CONSTRAINT indicateur_territoire_id_fkey FOREIGN KEY (id) REFERENCES public.indicateur_identite(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: indicateur_territoire_jalon indicateur_territoire_jalon_id_territoire_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_territoire_jalon
    ADD CONSTRAINT indicateur_territoire_jalon_id_territoire_code_fkey FOREIGN KEY (id, territoire_code) REFERENCES public.indicateur_territoire(id, territoire_code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: indicateur_territoire indicateur_territoire_territoire_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_territoire
    ADD CONSTRAINT indicateur_territoire_territoire_code_fkey FOREIGN KEY (territoire_code) REFERENCES public.territoire(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: indicateur_territoire_valeur_evenement indicateur_territoire_valeur_evenement_id_auteur_modificat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_territoire_valeur_evenement
    ADD CONSTRAINT indicateur_territoire_valeur_evenement_id_auteur_modificat_fkey FOREIGN KEY (id_auteur_modification) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: indicateur_territoire_valeur_evenement indicateur_territoire_valeur_evenement_indic_id_territoire_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indicateur_territoire_valeur_evenement
    ADD CONSTRAINT indicateur_territoire_valeur_evenement_indic_id_territoire_fkey FOREIGN KEY (indic_id, territoire_code) REFERENCES public.indicateur_territoire(id, territoire_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: instruction_critere instruction_critere_critere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instruction_critere
    ADD CONSTRAINT instruction_critere_critere_id_fkey FOREIGN KEY (critere_id) REFERENCES public.referentiel_critere(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: instruction_critere instruction_critere_rattachement_utilisateur_etape_jalon_i_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instruction_critere
    ADD CONSTRAINT instruction_critere_rattachement_utilisateur_etape_jalon_i_fkey FOREIGN KEY (rattachement_utilisateur_etape_jalon_id) REFERENCES public.rattachement_utilisateur_etape_jalon(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: instruction_objectif instruction_objectif_objectif_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instruction_objectif
    ADD CONSTRAINT instruction_objectif_objectif_id_fkey FOREIGN KEY (objectif_id) REFERENCES public.referentiel_objectif(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: instruction_objectif instruction_objectif_rattachement_utilisateur_etape_jalon__fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instruction_objectif
    ADD CONSTRAINT instruction_objectif_rattachement_utilisateur_etape_jalon__fkey FOREIGN KEY (rattachement_utilisateur_etape_jalon_id) REFERENCES public.rattachement_utilisateur_etape_jalon(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mesure_indicateur_temporaire mesure_indicateur_temporaire_rapport_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mesure_indicateur_temporaire
    ADD CONSTRAINT mesure_indicateur_temporaire_rapport_id_fkey FOREIGN KEY (rapport_id) REFERENCES public.rapport_import_mesure_indicateur(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: objectif objectif_auteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.objectif
    ADD CONSTRAINT objectif_auteur_id_fkey FOREIGN KEY (auteur_id) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: objectif objectif_chantier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.objectif
    ADD CONSTRAINT objectif_chantier_id_fkey FOREIGN KEY (chantier_id) REFERENCES public.chantier_identite(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: perimetre perimetre_ministere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perimetre
    ADD CONSTRAINT perimetre_ministere_id_fkey FOREIGN KEY (ministere_id) REFERENCES public.ministere(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposition_valeur_actuelle proposition_valeur_actuelle_id_auteur_modification_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposition_valeur_actuelle
    ADD CONSTRAINT proposition_valeur_actuelle_id_auteur_modification_fkey FOREIGN KEY (id_auteur_modification) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: proposition_valeur_actuelle proposition_valeur_actuelle_indic_id_territoire_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposition_valeur_actuelle
    ADD CONSTRAINT proposition_valeur_actuelle_indic_id_territoire_code_fkey FOREIGN KEY (indic_id, territoire_code) REFERENCES public.indicateur_territoire(id, territoire_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rapport_import_mesure_indicateur rapport_import_mesure_indicateur_utilisateur_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rapport_import_mesure_indicateur
    ADD CONSTRAINT rapport_import_mesure_indicateur_utilisateur_email_fkey FOREIGN KEY (utilisateur_email) REFERENCES public.utilisateur(email) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rattachement_utilisateur_etape_jalon rattachement_utilisateur_etape_jalon_rattachement_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rattachement_utilisateur_etape_jalon
    ADD CONSTRAINT rattachement_utilisateur_etape_jalon_rattachement_code_fkey FOREIGN KEY (rattachement_code) REFERENCES public.referentiel_rattachement(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rattachement_utilisateur_etape_jalon rattachement_utilisateur_etape_jalon_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rattachement_utilisateur_etape_jalon
    ADD CONSTRAINT rattachement_utilisateur_etape_jalon_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: referentiel_objectif referentiel_objectif_rattachement_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referentiel_objectif
    ADD CONSTRAINT referentiel_objectif_rattachement_code_fkey FOREIGN KEY (rattachement_code) REFERENCES public.referentiel_rattachement(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: referentiel_objectif referentiel_objectif_tutelle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referentiel_objectif
    ADD CONSTRAINT referentiel_objectif_tutelle_id_fkey FOREIGN KEY (tutelle_id) REFERENCES public.referentiel_tutelle(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: referentiel_rattachement referentiel_rattachement_groupe_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referentiel_rattachement
    ADD CONSTRAINT referentiel_rattachement_groupe_fkey FOREIGN KEY (groupe) REFERENCES public.referentiel_rattachement_groupe(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: referentiel_sous_critere referentiel_sous_critere_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referentiel_sous_critere
    ADD CONSTRAINT referentiel_sous_critere_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.referentiel_critere(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: synthese_des_resultats synthese_des_resultats_auteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.synthese_des_resultats
    ADD CONSTRAINT synthese_des_resultats_auteur_id_fkey FOREIGN KEY (auteur_id) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: synthese_des_resultats synthese_des_resultats_chantier_id_territoire_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.synthese_des_resultats
    ADD CONSTRAINT synthese_des_resultats_chantier_id_territoire_code_fkey FOREIGN KEY (chantier_id, territoire_code) REFERENCES public.chantier_territoire(id, territoire_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: territoire territoire_code_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territoire
    ADD CONSTRAINT territoire_code_parent_fkey FOREIGN KEY (code_parent) REFERENCES public.territoire(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: utilisateur utilisateur_auteur_id_creation_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_auteur_id_creation_fkey FOREIGN KEY (auteur_id_creation) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: utilisateur utilisateur_auteur_id_modification_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_auteur_id_modification_fkey FOREIGN KEY (auteur_id_modification) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: utilisateur utilisateur_profil_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_profil_code_fkey FOREIGN KEY (profil_code) REFERENCES public.profil(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: mesure_indicateur mesure_indicateur_rapport_id_fkey; Type: FK CONSTRAINT; Schema: raw_data; Owner: postgres
--

ALTER TABLE ONLY raw_data.mesure_indicateur
    ADD CONSTRAINT mesure_indicateur_rapport_id_fkey FOREIGN KEY (rapport_id) REFERENCES public.rapport_import_mesure_indicateur(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

