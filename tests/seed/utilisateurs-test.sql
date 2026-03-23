-- Utilisateurs de test E2E
-- Reproduit le contenu de seedUtilisateursTest.ts + utilisateurs PVA dédiés
--
-- IMPORTANT : tous les utilisateurs doivent avoir un service et une fonction renseignés
-- pour éviter que la modale "Complétez votre profil" n'apparaisse et bloque les tests.
-- Seul modale.profil@example.com est volontairement sans service/fonction (test dédié).

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- ditp.admin@example.com (DITP_ADMIN)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'ditp.admin@example.com', 'DITP', 'Admin', 'DITP_ADMIN', 'Administrateur', 'DITP', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'saisieCommentaire', ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'saisieIndicateur', ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]);

  -- ditp.pilotage@example.com (DITP_PILOTAGE)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'ditp.pilotage@example.com', 'DITP', 'Pilotage', 'DITP_PILOTAGE', 'Pilotage', 'DITP', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'saisieCommentaire', ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]);

  -- premiere.ministre@example.com (PM_ET_CABINET)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'premiere.ministre@example.com', 'Premiere', 'Ministre', 'PM_ET_CABINET', 'Première Ministre', 'Cabinet PM', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]);

  -- presidence@example.com (PR)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'presidence@example.com', 'Presidence', 'Republique', 'PR', 'Président', 'Présidence', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]);

  -- cabinet.mtfp@example.com (CABINET_MTFP)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'cabinet.mtfp@example.com', 'Cabinet', 'MTFP', 'CABINET_MTFP', 'Conseiller', 'Cabinet MTFP', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]);

  -- cabinet.ministeriel@example.com (CABINET_MINISTERIEL)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'cabinet.ministeriel@example.com', 'Cabinet', 'Ministériel', 'CABINET_MINISTERIEL', 'Conseiller', 'Cabinet ministériel', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY[]::text[], ARRAY[]::text[], ARRAY['CH-001', 'CH-002', 'CH-003', 'CH-058']);

  -- direction.admin.centrale@example.com (DIR_ADMIN_CENTRALE)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'direction.admin.centrale@example.com', 'Direction', 'Admin centrale', 'DIR_ADMIN_CENTRALE', 'Directeur', 'Administration centrale', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY[]::text[], ARRAY[]::text[], ARRAY['CH-001', 'CH-002', 'CH-003', 'CH-058']);

  -- secretariat.general@example.com (SECRETARIAT_GENERAL)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'secretariat.general@example.com', 'Secretariat', 'General', 'SECRETARIAT_GENERAL', 'Secrétaire général', 'Secrétariat général', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY[]::text[], ARRAY[]::text[], ARRAY['CH-070', 'CH-071', 'CH-067']),
    (v_user_id, 'saisieCommentaire', ARRAY['NAT'], ARRAY[]::text[], ARRAY['CH-070', 'CH-071', 'CH-067']),
    (v_user_id, 'saisieIndicateur', ARRAY[]::text[], ARRAY[]::text[], ARRAY['CH-070', 'CH-071', 'CH-067']),
    (v_user_id, 'gestionUtilisateur', ARRAY['DEPT-08','DEPT-09','DEPT-10','DEPT-11','DEPT-12','DEPT-13','DEPT-14','DEPT-15','DEPT-16','DEPT-17','DEPT-18','DEPT-19','DEPT-2A','DEPT-2B','DEPT-21','DEPT-22','DEPT-23','DEPT-75','DEPT-24','DEPT-25','DEPT-26','DEPT-27','DEPT-28','DEPT-29','DEPT-30','DEPT-31','DEPT-33','DEPT-34','DEPT-35','DEPT-36','DEPT-37','DEPT-38','DEPT-39','DEPT-07','DEPT-40','DEPT-41','DEPT-42','DEPT-43','DEPT-44','DEPT-45','DEPT-46','DEPT-47','DEPT-48','DEPT-49','DEPT-50','DEPT-51','DEPT-52','DEPT-53','DEPT-67','DEPT-06','DEPT-54','DEPT-56','DEPT-57','DEPT-58','DEPT-59','DEPT-60','DEPT-61','DEPT-62','DEPT-63','DEPT-65','DEPT-66','DEPT-68','DEPT-69','DEPT-70','DEPT-71','DEPT-72','DEPT-73','DEPT-74','DEPT-76','DEPT-77','DEPT-78','DEPT-79','DEPT-80','DEPT-81','DEPT-82','DEPT-83','DEPT-84','DEPT-85','DEPT-86','DEPT-87','DEPT-88','DEPT-89','REG-84','REG-27','REG-53','REG-24','REG-94','DEPT-91','DEPT-92','DEPT-93','DEPT-94','DEPT-95','DEPT-976','REG-44','REG-32','REG-11','REG-28','REG-75','REG-76','REG-52','REG-06','REG-93','REG-01','REG-02','REG-03','REG-04','DEPT-01','DEPT-02','DEPT-03','DEPT-04','DEPT-05','DEPT-90','DEPT-32','DEPT-55','DEPT-64','DEPT-972','DEPT-973','DEPT-974','DEPT-971'], ARRAY[]::text[], ARRAY['CH-070', 'CH-071', 'CH-067']);

  -- equipe.dir.projet@example.com (EQUIPE_DIR_PROJET)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'equipe.dir.projet@example.com', 'Directeur', 'Projet', 'EQUIPE_DIR_PROJET', 'Directeur de projet', 'Direction de projet', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY[]::text[], ARRAY[]::text[], ARRAY['CH-054', 'CH-058', 'CH-062', 'CH-051', 'CH-129']),
    (v_user_id, 'saisieCommentaire', ARRAY['NAT'], ARRAY[]::text[], ARRAY['CH-054', 'CH-058', 'CH-062', 'CH-051', 'CH-129']),
    (v_user_id, 'saisieIndicateur', ARRAY[]::text[], ARRAY[]::text[], ARRAY['CH-054', 'CH-058', 'CH-062', 'CH-051', 'CH-129']);

  -- coordinateur.region@example.com (COORDINATEUR_REGION)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'coordinateur.region@example.com', 'Coordinateur', 'Region', 'COORDINATEUR_REGION', 'Coordinateur régional', 'Préfecture de région', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'saisieCommentaire', ARRAY['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'gestionUtilisateur', ARRAY['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]);

  -- prefet.region@example.com (PREFET_REGION)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'prefet.region@example.com', 'Prefet', 'Region', 'PREFET_REGION', 'Préfet de région', 'Préfecture de région', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'saisieCommentaire', ARRAY['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]);

  -- services.deconcentres.region@example.com (SERVICES_DECONCENTRES_REGION)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'services.deconcentres.region@example.com', 'Services deconcentres', 'Region', 'SERVICES_DECONCENTRES_REGION', 'Agent', 'Services déconcentrés régionaux', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY['CH-058', 'CH-054', 'CH-062', 'CH-051', 'CH-070']),
    (v_user_id, 'saisieCommentaire', ARRAY['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY['CH-058', 'CH-054', 'CH-062', 'CH-051', 'CH-070']);

  -- coordinateur.departement@example.com (COORDINATEUR_DEPARTEMENT)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'coordinateur.departement@example.com', 'Coordinateur', 'Departement', 'COORDINATEUR_DEPARTEMENT', 'Coordinateur départemental', 'Préfecture de département', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'saisieCommentaire', ARRAY['DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'gestionUtilisateur', ARRAY['DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]);

  -- prefet.departement@example.com (PREFET_DEPARTEMENT)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'prefet.departement@example.com', 'Prefet', 'Departement', 'PREFET_DEPARTEMENT', 'Préfet de département', 'Préfecture de département', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'saisieCommentaire', ARRAY['DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]);

  -- services.deconcentres.departement@example.com (SERVICES_DECONCENTRES_DEPARTEMENT)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'services.deconcentres.departement@example.com', 'Services deconcentres', 'Departement', 'SERVICES_DECONCENTRES_DEPARTEMENT', 'Agent', 'Services déconcentrés départementaux', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY['CH-058', 'CH-054', 'CH-062', 'CH-051', 'CH-070']),
    (v_user_id, 'saisieCommentaire', ARRAY['DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY['CH-058', 'CH-054', 'CH-062', 'CH-051', 'CH-070']);

  -- prefet.multi.territoires@example.com (PREFET_DEPARTEMENT avec territoires hors périmètre coordinateur)
  -- DEPT-56 est dans le périmètre du coordinateur Bretagne, DEPT-75 (Paris) est hors périmètre
  -- → visible dans le listing du coordinateur (au moins 1 territoire en commun)
  -- → mais non modifiable (tous les territoires ne sont pas couverts)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'prefet.multi.territoires@example.com', 'Prefet', 'Multi-territoires', 'PREFET_DEPARTEMENT', 'Préfet de département', 'Préfecture de département', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['DEPT-56', 'DEPT-75'], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'saisieCommentaire', ARRAY['DEPT-56', 'DEPT-75'], ARRAY[]::text[], ARRAY[]::text[]);

  -- services.deconcentres.hors-ate@example.com (SERVICES_DECONCENTRES_REGION avec chantier hors_ate_deconcentre)
  -- CH-054 (ate) + CH-108 (hors_ate_deconcentre) dans lecture.chantiers
  -- Le coordinateur n'est PAS bloqué par le mismatch chantiers (seul le SG l'est)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'services.deconcentres.hors-ate@example.com', 'Services deconcentres', 'Hors ATE', 'SERVICES_DECONCENTRES_REGION', 'Agent', 'Services déconcentrés hors ATE', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY['CH-054', 'CH-108']),
    (v_user_id, 'saisieCommentaire', ARRAY['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY['CH-054', 'CH-108']);

  -- drom@example.com (DROM)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'drom@example.com', 'DROM', 'MIOM', 'DROM', 'Agent DROM', 'DROM-MIOM', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['NAT', 'REG-01', 'REG-02', 'REG-03', 'REG-04', 'REG-06', 'DEPT-971', 'DEPT-972', 'DEPT-973', 'DEPT-974', 'DEPT-976'], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'saisieCommentaire', ARRAY['NAT'], ARRAY['PER-018'], ARRAY[]::text[]),
    (v_user_id, 'saisieIndicateur', ARRAY['NAT', 'REG-01', 'REG-02', 'REG-03', 'REG-04', 'REG-06', 'DEPT-971', 'DEPT-972', 'DEPT-973', 'DEPT-974', 'DEPT-976'], ARRAY[]::text[], ARRAY[]::text[]);

  ---
  --- Utilisateurs PVA (Proposition de Valeur d'Avancement)
  ---

  -- pva.coordinateur.dept@example.com : propose des valeurs sur DEPT-56 / CH-129 (tests 1, 3, 4)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'pva.coordinateur.dept@example.com', 'PVA-Coordinateur', 'Departement', 'COORDINATEUR_DEPARTEMENT', 'Coordinateur départemental', 'Préfecture de département', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['DEPT-56'], ARRAY[]::text[], ARRAY['CH-129']),
    (v_user_id, 'saisieCommentaire', ARRAY['DEPT-56'], ARRAY[]::text[], ARRAY['CH-129']);

  -- pva.prefet.dept@example.com : propose des valeurs sur DEPT-56 / CH-129 (test 2)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'pva.prefet.dept@example.com', 'PVA-Prefet', 'Departement', 'PREFET_DEPARTEMENT', 'Préfet de département', 'Préfecture de département', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['DEPT-56'], ARRAY[]::text[], ARRAY['CH-129']),
    (v_user_id, 'saisieCommentaire', ARRAY['DEPT-56'], ARRAY[]::text[], ARRAY['CH-129']);

  -- pva.coordinateur.reg@example.com : voit le blocage maille agrégée sur REG-53 / CH-129 (test 5)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'pva.coordinateur.reg@example.com', 'PVA-Coordinateur', 'Region', 'COORDINATEUR_REGION', 'Coordinateur régional', 'Préfecture de région', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['REG-53', 'DEPT-22', 'DEPT-29', 'DEPT-35', 'DEPT-56'], ARRAY[]::text[], ARRAY['CH-129']),
    (v_user_id, 'saisieCommentaire', ARRAY['REG-53', 'DEPT-22', 'DEPT-29', 'DEPT-35', 'DEPT-56'], ARRAY[]::text[], ARRAY['CH-129']);

  -- pva.dir.projet@example.com : accuse réception, accepte, refuse sur CH-129 (tests 1, 2, 3)
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'pva.dir.projet@example.com', 'PVA-Direction', 'Projet', 'EQUIPE_DIR_PROJET', 'Directeur de projet', 'Direction de projet', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY[]::text[], ARRAY[]::text[], ARRAY['CH-129']),
    (v_user_id, 'saisieCommentaire', ARRAY['NAT'], ARRAY[]::text[], ARRAY['CH-129']),
    (v_user_id, 'saisieIndicateur', ARRAY[]::text[], ARRAY[]::text[], ARRAY['CH-129']);

  ---
  --- Utilisateurs page chantier (isolation par profil)
  ---

  -- chantier.prefet.reg@example.com : préfet région avec saisieCommentaire sur CH-129 / REG-53
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, fonction, service, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'chantier.prefet.reg@example.com', 'Chantier-Prefet', 'Region', 'PREFET_REGION', 'Préfet de région', 'Préfecture de région', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['REG-53', 'DEPT-22', 'DEPT-29', 'DEPT-35', 'DEPT-56'], ARRAY[]::text[], ARRAY['CH-129']),
    (v_user_id, 'saisieCommentaire', ARRAY['REG-53', 'DEPT-22', 'DEPT-29', 'DEPT-35', 'DEPT-56'], ARRAY[]::text[], ARRAY['CH-129']);

  ---
  --- Utilisateur dédié au test de la modale "Complétez votre profil"
  --- Volontairement SANS service ni fonction pour déclencher la modale
  ---

  -- modale.profil@example.com : utilisateur sans service/fonction pour tester la modale
  INSERT INTO public.utilisateur (id, email, nom, prenom, profil_code, date_creation, date_modification, date_visualisation_video_accueil, date_inscription_infolettre)
  VALUES (gen_random_uuid(), 'modale.profil@example.com', 'Modale', 'Profil', 'COORDINATEUR_REGION', NOW(), NOW(), NOW(), NOW())
  RETURNING id INTO v_user_id;

  INSERT INTO public.habilitation (utilisateur_id, scope_code, territoires, perimetres, chantiers) VALUES
    (v_user_id, 'lecture', ARRAY['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'saisieCommentaire', ARRAY['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]),
    (v_user_id, 'gestionUtilisateur', ARRAY['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22'], ARRAY[]::text[], ARRAY[]::text[]);

END $$;
