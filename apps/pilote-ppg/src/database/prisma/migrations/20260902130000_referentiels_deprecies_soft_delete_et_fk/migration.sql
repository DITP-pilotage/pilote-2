-- soft delete sur les référentiels dépréciés (PPG, Axes, Engagements)
ALTER TABLE raw_data.metadata_ppgs ADD COLUMN "deleted_at" TIMESTAMPTZ;
ALTER TABLE raw_data.metadata_axes ADD COLUMN "deleted_at" TIMESTAMPTZ;
ALTER TABLE raw_data.metadata_engagement ADD COLUMN "deleted_at" TIMESTAMPTZ;

-- fiabilisation du lien PPG -> Axe (jusqu'ici une simple convention de valeur)
ALTER TABLE raw_data.metadata_ppgs
ADD CONSTRAINT fk_ppg_axe FOREIGN KEY (ppg_axe) REFERENCES raw_data.metadata_axes (axe_id);

-- fiabilisation du lien Chantier -> Engagement (jusqu'ici une simple convention de valeur)
ALTER TABLE raw_data.metadata_engagement
ADD CONSTRAINT metadata_engagement_engagement_short_key UNIQUE (engagement_short);

ALTER TABLE raw_data.metadata_chantiers
ADD CONSTRAINT fk_chantier_engagement FOREIGN KEY (engagement_short) REFERENCES raw_data.metadata_engagement (engagement_short);
