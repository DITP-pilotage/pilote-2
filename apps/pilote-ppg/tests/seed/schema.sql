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
