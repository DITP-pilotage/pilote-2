-- {{schema}}.metadata_chantiers definition

-- Drop table

-- DROP TABLE {{schema}}.metadata_chantiers;
CREATE TABLE IF NOT EXISTS {{schema}}.metadata_chantiers2 (
	chantier_id text NULL,
	ch_code text NULL,
	ch_descr text NULL,
	ch_nom text NULL,
	ch_dp text NULL,
	ch_ppg text NULL,
	ch_perseverant text NULL,
	"porteur_shorts_noDAC" text NULL,
	"porteur_ids_noDAC" text NULL,
	"porteur_shorts_DAC" text NULL,
	"porteur_ids_DAC" text NULL,
	ch_per text NULL,
	ch_dp_mail text NULL,
	ch_territo bool NULL,
	engagement_short text NULL,
	ch_hidden_pilote bool NULL,
	ch_saisie_ate text NULL,
	ch_state text NULL,
	zg_applicable text NULL,
	maille_applicable text NULL,
	ch_cible_attendue bool NULL,
	replicate_val_reg_to text NULL,
	replicate_val_nat_to text NULL
);
