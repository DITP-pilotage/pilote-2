-- Entités dédiées aux e2e (cf. tests/seed/dedicated-entities.ts) : chaque entité n'est
-- écrite que par un seul spec, pour ne jamais modifier les données partagées.
-- Copies de lignes existantes : seules les colonnes d'identité changent.

-- CH-901 : chantier en BROUILLON, copie de CH-070
CREATE TEMP TABLE copied_rows AS SELECT * FROM public.chantier_identite WHERE id = 'CH-070';
UPDATE copied_rows SET id = 'CH-901', nom = 'Chantier brouillon e2e', statut = 'BROUILLON';
INSERT INTO public.chantier_identite SELECT * FROM copied_rows;
DROP TABLE copied_rows;

CREATE TEMP TABLE copied_rows AS SELECT * FROM public.chantier_territoire WHERE id = 'CH-070';
UPDATE copied_rows SET id = 'CH-901';
INSERT INTO public.chantier_territoire SELECT * FROM copied_rows;
DROP TABLE copied_rows;

-- CH-902 : chantier publié des tests qui écrivent (open-api, saisie, indicateurs), copie de CH-054
CREATE TEMP TABLE copied_rows AS SELECT * FROM public.chantier_identite WHERE id = 'CH-054';
UPDATE copied_rows SET id = 'CH-902', nom = 'Chantier e2e';
INSERT INTO public.chantier_identite SELECT * FROM copied_rows;
DROP TABLE copied_rows;

CREATE TEMP TABLE copied_rows AS SELECT * FROM public.chantier_territoire WHERE id = 'CH-054';
UPDATE copied_rows SET id = 'CH-902';
INSERT INTO public.chantier_territoire SELECT * FROM copied_rows;
DROP TABLE copied_rows;

-- Métadonnées de CH-902 pour le paramétrage des chantiers (panel administrateur), copiées de CH-129
CREATE TEMP TABLE copied_rows AS SELECT * FROM raw_data.metadata_chantiers WHERE chantier_id = 'CH-129';
UPDATE copied_rows SET chantier_id = 'CH-902', ch_nom = 'Chantier e2e', maille_applicable = ARRAY['DEPT'];
INSERT INTO raw_data.metadata_chantiers SELECT * FROM copied_rows;
DROP TABLE copied_rows;

-- CH-903 : chantier publié de la saisie des publications par l'IHM, copie de CH-129
CREATE TEMP TABLE copied_rows AS SELECT * FROM public.chantier_identite WHERE id = 'CH-129';
UPDATE copied_rows SET id = 'CH-903', nom = 'Chantier e2e saisie';
INSERT INTO public.chantier_identite SELECT * FROM copied_rows;
DROP TABLE copied_rows;

CREATE TEMP TABLE copied_rows AS SELECT * FROM public.chantier_territoire WHERE id = 'CH-129';
UPDATE copied_rows SET id = 'CH-903';
INSERT INTO public.chantier_territoire SELECT * FROM copied_rows;
DROP TABLE copied_rows;

-- IND-901 (import de données), IND-902 (formulaire indicateur), IND-903 (open-api) : copies d'IND-021 rattachées à CH-902
CREATE TEMP TABLE mapping (id text, nom text);
INSERT INTO mapping VALUES
  ('IND-901', 'Indicateur e2e import'),
  ('IND-902', 'Indicateur e2e formulaire'),
  ('IND-903', 'Indicateur e2e open-api');

CREATE TEMP TABLE copied_rows AS
  SELECT source.*, mapping.id AS new_id, mapping.nom AS new_nom
  FROM raw_data.metadata_indicateurs source, mapping WHERE source.indic_id = 'IND-021';
UPDATE copied_rows SET indic_id = new_id, indic_nom = new_nom, indic_parent_ch = 'CH-902';
ALTER TABLE copied_rows DROP COLUMN new_id, DROP COLUMN new_nom;
INSERT INTO raw_data.metadata_indicateurs SELECT * FROM copied_rows;
DROP TABLE copied_rows;

CREATE TEMP TABLE copied_rows AS
  SELECT source.*, mapping.id AS new_id, mapping.nom AS new_nom
  FROM raw_data.metadata_indicateurs_hidden source, mapping WHERE source.indic_id = 'IND-021';
UPDATE copied_rows SET indic_id = new_id, indic_nom = new_nom, indic_parent_ch = 'CH-902';
ALTER TABLE copied_rows DROP COLUMN new_id, DROP COLUMN new_nom;
INSERT INTO raw_data.metadata_indicateurs_hidden SELECT * FROM copied_rows;
DROP TABLE copied_rows;

CREATE TEMP TABLE copied_rows AS
  SELECT source.*, mapping.id AS new_id, mapping.nom AS new_nom
  FROM raw_data.metadata_parametrage_indicateurs source, mapping WHERE source.indic_id = 'IND-021';
UPDATE copied_rows SET indic_id = new_id;
ALTER TABLE copied_rows DROP COLUMN new_id, DROP COLUMN new_nom;
INSERT INTO raw_data.metadata_parametrage_indicateurs SELECT * FROM copied_rows;
DROP TABLE copied_rows;

CREATE TEMP TABLE copied_rows AS
  SELECT source.*, mapping.id AS new_id, mapping.nom AS new_nom
  FROM raw_data.metadata_indicateurs_complementaire source, mapping WHERE source.indic_id = 'IND-021';
UPDATE copied_rows SET indic_id = new_id;
ALTER TABLE copied_rows DROP COLUMN new_id, DROP COLUMN new_nom;
INSERT INTO raw_data.metadata_indicateurs_complementaire SELECT * FROM copied_rows;
DROP TABLE copied_rows;

CREATE TEMP TABLE copied_rows AS
  SELECT source.*, mapping.id AS new_id, mapping.nom AS new_nom
  FROM public.indicateur_identite source, mapping WHERE source.id = 'IND-021';
UPDATE copied_rows SET id = new_id, nom = new_nom, chantier_id = 'CH-902';
ALTER TABLE copied_rows DROP COLUMN new_id, DROP COLUMN new_nom;
INSERT INTO public.indicateur_identite SELECT * FROM copied_rows;
DROP TABLE copied_rows;

CREATE TEMP TABLE copied_rows AS
  SELECT source.*, mapping.id AS new_id
  FROM public.indicateur_territoire source, mapping WHERE source.id = 'IND-021';
UPDATE copied_rows SET id = new_id, chantier_id = 'CH-902';
ALTER TABLE copied_rows DROP COLUMN new_id;
INSERT INTO public.indicateur_territoire SELECT * FROM copied_rows;
DROP TABLE copied_rows;

CREATE TEMP TABLE copied_rows AS
  SELECT source.*, mapping.id AS new_id
  FROM public.indicateur_territoire_jalon source, mapping WHERE source.id = 'IND-021';
UPDATE copied_rows SET id = new_id;
ALTER TABLE copied_rows DROP COLUMN new_id;
INSERT INTO public.indicateur_territoire_jalon SELECT * FROM copied_rows;
DROP TABLE copied_rows;

DROP TABLE mapping;

-- Habilitations : equipe.dir.projet (accès aux brouillons) voit CH-901 et écrit sur CH-902 et CH-903 ;
-- services.deconcentres.region (sans accès aux brouillons) est habilité sur CH-901 mais ne doit pas le voir.
UPDATE public.habilitation
SET chantiers = chantiers || ARRAY['CH-901', 'CH-902', 'CH-903']
WHERE utilisateur_id = (SELECT id FROM public.utilisateur WHERE email = 'equipe.dir.projet@example.com');

UPDATE public.habilitation
SET chantiers = chantiers || ARRAY['CH-901']
WHERE utilisateur_id = (SELECT id FROM public.utilisateur WHERE email = 'services.deconcentres.region@example.com');

-- Comptes de la saisie des publications sur CH-903 / DEPT-56 : l'un rédige, l'autre vérifie qu'il ne voit pas ses brouillons.
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'saisie.coordinateur.dept@example.com', 'Saisie-Coordinateur', 'Departement', 'COORDINATEUR_DEPARTEMENT', 'Coordinateur départemental', 'Préfecture de département', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['DEPT-56'], ARRAY[]::text[], ARRAY['CH-903']),
    (v_user_id, 'saisieCommentaire', ARRAY['DEPT-56'], ARRAY[]::text[], ARRAY['CH-903']);

  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'saisie.prefet.dept@example.com', 'Saisie-Prefet', 'Departement', 'PREFET_DEPARTEMENT', 'Préfet de département', 'Préfecture de département', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['DEPT-56'], ARRAY[]::text[], ARRAY['CH-903']),
    (v_user_id, 'saisieCommentaire', ARRAY['DEPT-56'], ARRAY[]::text[], ARRAY['CH-903']);

  -- Compte désactivé hors du périmètre de coordinateur.departement : sa réactivation doit être refusée.
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre, date_desactivation)
  VALUES (gen_random_uuid(), 'compte.desactive@example.com', 'Desactive', 'Compte', 'PREFET_DEPARTEMENT', 'Préfet de département', 'Préfecture de département', NOW(), NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['DEPT-13'], ARRAY[]::text[], ARRAY[]::text[]);
END $$;
