-- Entités dédiées aux e2e (cf. tests/seed/entites-dediees.ts) : chaque entité n'est
-- écrite que par un seul spec, pour ne jamais modifier les données partagées.
-- Copies de lignes existantes : seules les colonnes d'identité changent.

-- CH-901 : chantier en BROUILLON, copie de CH-070
CREATE TEMP TABLE copie AS SELECT * FROM public.chantier_identite WHERE id = 'CH-070';
UPDATE copie SET id = 'CH-901', nom = 'Chantier brouillon e2e', statut = 'BROUILLON';
INSERT INTO public.chantier_identite SELECT * FROM copie;
DROP TABLE copie;

CREATE TEMP TABLE copie AS SELECT * FROM public.chantier_territoire WHERE id = 'CH-070';
UPDATE copie SET id = 'CH-901';
INSERT INTO public.chantier_territoire SELECT * FROM copie;
DROP TABLE copie;

-- CH-902 : chantier publié des tests qui écrivent (open-api, saisie, indicateurs), copie de CH-054
CREATE TEMP TABLE copie AS SELECT * FROM public.chantier_identite WHERE id = 'CH-054';
UPDATE copie SET id = 'CH-902', nom = 'Chantier e2e';
INSERT INTO public.chantier_identite SELECT * FROM copie;
DROP TABLE copie;

CREATE TEMP TABLE copie AS SELECT * FROM public.chantier_territoire WHERE id = 'CH-054';
UPDATE copie SET id = 'CH-902';
INSERT INTO public.chantier_territoire SELECT * FROM copie;
DROP TABLE copie;

-- Métadonnées de CH-902 pour le paramétrage des chantiers (panel administrateur), copiées de CH-129
CREATE TEMP TABLE copie AS SELECT * FROM raw_data.metadata_chantiers WHERE chantier_id = 'CH-129';
UPDATE copie SET chantier_id = 'CH-902', ch_nom = 'Chantier e2e', maille_applicable = ARRAY['DEPT'];
INSERT INTO raw_data.metadata_chantiers SELECT * FROM copie;
DROP TABLE copie;

-- CH-903 : chantier publié de la saisie des publications par l'IHM, copie de CH-129
CREATE TEMP TABLE copie AS SELECT * FROM public.chantier_identite WHERE id = 'CH-129';
UPDATE copie SET id = 'CH-903', nom = 'Chantier e2e saisie';
INSERT INTO public.chantier_identite SELECT * FROM copie;
DROP TABLE copie;

CREATE TEMP TABLE copie AS SELECT * FROM public.chantier_territoire WHERE id = 'CH-129';
UPDATE copie SET id = 'CH-903';
INSERT INTO public.chantier_territoire SELECT * FROM copie;
DROP TABLE copie;

-- IND-901 (import de données), IND-902 (formulaire indicateur), IND-903 (open-api) : copies d'IND-021 rattachées à CH-902
CREATE TEMP TABLE correspondance (id text, nom text);
INSERT INTO correspondance VALUES
  ('IND-901', 'Indicateur e2e import'),
  ('IND-902', 'Indicateur e2e formulaire'),
  ('IND-903', 'Indicateur e2e open-api');

CREATE TEMP TABLE copie AS
  SELECT source.*, correspondance.id AS nouvel_id, correspondance.nom AS nouveau_nom
  FROM raw_data.metadata_indicateurs source, correspondance WHERE source.indic_id = 'IND-021';
UPDATE copie SET indic_id = nouvel_id, indic_nom = nouveau_nom, indic_parent_ch = 'CH-902';
ALTER TABLE copie DROP COLUMN nouvel_id, DROP COLUMN nouveau_nom;
INSERT INTO raw_data.metadata_indicateurs SELECT * FROM copie;
DROP TABLE copie;

CREATE TEMP TABLE copie AS
  SELECT source.*, correspondance.id AS nouvel_id, correspondance.nom AS nouveau_nom
  FROM raw_data.metadata_indicateurs_hidden source, correspondance WHERE source.indic_id = 'IND-021';
UPDATE copie SET indic_id = nouvel_id, indic_nom = nouveau_nom, indic_parent_ch = 'CH-902';
ALTER TABLE copie DROP COLUMN nouvel_id, DROP COLUMN nouveau_nom;
INSERT INTO raw_data.metadata_indicateurs_hidden SELECT * FROM copie;
DROP TABLE copie;

CREATE TEMP TABLE copie AS
  SELECT source.*, correspondance.id AS nouvel_id, correspondance.nom AS nouveau_nom
  FROM raw_data.metadata_parametrage_indicateurs source, correspondance WHERE source.indic_id = 'IND-021';
UPDATE copie SET indic_id = nouvel_id;
ALTER TABLE copie DROP COLUMN nouvel_id, DROP COLUMN nouveau_nom;
INSERT INTO raw_data.metadata_parametrage_indicateurs SELECT * FROM copie;
DROP TABLE copie;

CREATE TEMP TABLE copie AS
  SELECT source.*, correspondance.id AS nouvel_id, correspondance.nom AS nouveau_nom
  FROM raw_data.metadata_indicateurs_complementaire source, correspondance WHERE source.indic_id = 'IND-021';
UPDATE copie SET indic_id = nouvel_id;
ALTER TABLE copie DROP COLUMN nouvel_id, DROP COLUMN nouveau_nom;
INSERT INTO raw_data.metadata_indicateurs_complementaire SELECT * FROM copie;
DROP TABLE copie;

CREATE TEMP TABLE copie AS
  SELECT source.*, correspondance.id AS nouvel_id, correspondance.nom AS nouveau_nom
  FROM public.indicateur_identite source, correspondance WHERE source.id = 'IND-021';
UPDATE copie SET id = nouvel_id, nom = nouveau_nom, chantier_id = 'CH-902';
ALTER TABLE copie DROP COLUMN nouvel_id, DROP COLUMN nouveau_nom;
INSERT INTO public.indicateur_identite SELECT * FROM copie;
DROP TABLE copie;

CREATE TEMP TABLE copie AS
  SELECT source.*, correspondance.id AS nouvel_id
  FROM public.indicateur_territoire source, correspondance WHERE source.id = 'IND-021';
UPDATE copie SET id = nouvel_id, chantier_id = 'CH-902';
ALTER TABLE copie DROP COLUMN nouvel_id;
INSERT INTO public.indicateur_territoire SELECT * FROM copie;
DROP TABLE copie;

CREATE TEMP TABLE copie AS
  SELECT source.*, correspondance.id AS nouvel_id
  FROM public.indicateur_territoire_jalon source, correspondance WHERE source.id = 'IND-021';
UPDATE copie SET id = nouvel_id;
ALTER TABLE copie DROP COLUMN nouvel_id;
INSERT INTO public.indicateur_territoire_jalon SELECT * FROM copie;
DROP TABLE copie;

DROP TABLE correspondance;

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
END $$;
