--
-- Name: indicateur_territoire_valeur_evenement_taux_avancement; Type: TABLE; Schema: public; Owner: postgres
-- Attention ce seed de table n'est pas bon, il doit être fait en migration par prisma
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


-- Name: metadata_engagement; Type: TABLE; Schema: raw_data; Owner: postgres


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


-- Name: metadata_porteurs; Type: TABLE; Schema: raw_data; Owner: postgres


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
