-- Seed metadata indicateurs
-- Ce fichier reproduit le comportement de seed-metadata-indicateur.ts

-- Suppression des données existantes
DELETE FROM public.metadata_indicateur_valeur_acceptee;
DELETE FROM public.metadata_indicateur;

-- ============================================
-- METADATA_INDICATEURS
-- ============================================

-- METADATA_INDICATEURS - Table metadata_indicateurs_hidden
INSERT INTO public.metadata_indicateur (name, data_type, description, est_visible, alias, est_editable, validation_regex, validation_regex_error_message, edit_box_type, default_value, est_obligatoire, doit_afficher_la_description, groupe, bloc_id) VALUES
('indic_id', 'text', 'Identifiant de l''indicateur', true, 'indic_id', false, '^IND-\d{3,4}$', 'Le code de l''indicateur doit être au format ''IND-XXX'' ou ''IND-XXXX''', 'text', '', true, false, 'METADATA_INDICATEURS', NULL),
('indic_parent_indic', 'text', 'Indicateur parent', true, 'Indicateur parent', true, '^IND-\d{3,4}$', 'Le code de l''indicateur parent doit être au format ''IND-XXX'' ou ''IND-XXXX''', 'text', '', false, false, 'METADATA_INDICATEURS', NULL),
('indic_parent_ch', 'text', 'Code du chantier associé à cet indicateur, au format CH-XXX.', true, 'Chantier associé', true, '^CH-\d{3}$', 'Le code du chantier parent doit être au format ''CH-XXX''', 'text', '', true, true, 'METADATA_INDICATEURS', NULL),
('indic_nom', 'text', 'Nom complet de l''indicateur', true, 'Nom', true, '.*', NULL, 'text', '', true, false, 'METADATA_INDICATEURS', NULL),
('indic_nom_baro', 'text', 'Nom de cet indicateur dans le baromètre (si différent de l''intitulé Pilote)', true, 'Nom baromètre', false, '', NULL, 'text', '', false, true, 'METADATA_INDICATEURS', NULL),
('indic_descr', 'text', 'Description de l''indicateur', true, 'Description', true, '.*', NULL, 'textarea', '', true, true, 'METADATA_INDICATEURS', NULL),
('indic_descr_baro', 'text', 'Description de l''indicateur dans le baromètre (si différent de la description Pilote)', true, 'Description baromètre', false, '', NULL, 'textarea', '', false, true, 'METADATA_INDICATEURS', NULL),
('indic_is_perseverant', 'boolean', 'Indique si l''indicateur est perseverant', true, 'Persévérant', false, '', NULL, NULL, 'false', false, false, 'METADATA_INDICATEURS', NULL),
('indic_is_phare', 'boolean', 'Indique si l''indicateur est phare', true, 'Phare', true, '', NULL, NULL, 'false', false, false, 'METADATA_INDICATEURS', NULL),
('indic_is_baro', 'boolean', 'Indicateur présent dans le baromètre des résultats de l''action publique', true, 'Baromètre', false, '', NULL, NULL, 'false', false, false, 'METADATA_INDICATEURS', NULL),
('indic_type', 'text', E'Typologie de l''indicateur.\n\nIl peut s''agir d''indicateur d''impact (''IMPACT''), de déploiement (''DEPL''), de contexte (''CONTEXTE''), de qualité de service (''Q_SERV'') ou de rebond (''REBOND'').', true, 'Typologie', true, '', 'Veuillez choisir une typologie d''indicateur valide parmi: ', 'multi-select', '', true, true, 'METADATA_INDICATEURS', NULL),
('indic_source', 'text', 'Source déclarée des données de l''indicateur', true, 'Source', false, '', NULL, 'textarea', 'Pas de source renseignée', false, true, 'METADATA_INDICATEURS', NULL),
('indic_source_url', 'text', 'URL de la source de donnée déclarée (si accessible publiquement)', true, 'Source (URL)', false, '', NULL, 'text', '', false, false, 'METADATA_INDICATEURS', NULL),
('indic_methode_calcul', 'text', 'Méthode de calcul pour l''obtention des données.', true, 'Méthode de calcul', false, '', NULL, 'textarea', '', false, true, 'METADATA_INDICATEURS', NULL),
('indic_unite', 'text', 'Visible dans Pilote - A renseigner uniquement si pourcentage, heures, mois, milliers, millions, milliards …', true, 'Unité', true, '.*', NULL, 'text', '', false, true, 'METADATA_INDICATEURS', NULL),
('indic_hidden_pilote', 'boolean', 'Indique si l''indicateur est affiché dans Pilote. **Ne fonctionne pas**', true, 'Masqué', true, '', NULL, NULL, 'false', true, true, 'METADATA_INDICATEURS', NULL),
('indic_schema', 'text', 'Nom du schema associé. Cela permet la restriction de la saisie de données.', true, 'Contraintes', false, '', 'Veuillez choisir des contraintes de saisie parmi: ', 'multi-select', 'sans-contraintes.json', true, true, 'METADATA_INDICATEURS', NULL),
('zg_applicable', 'text', '*Zone-group* applicable à cet indicateur. Voir `metadata_zonegroup`', true, 'Restriction géographique', true, 'ZG-\d\d\d', 'Le code de la ZG doit être au format ''ZG-XXX''', 'multi-select', '', false, true, 'METADATA_INDICATEURS', NULL);

-- METADATA_PARAMETRAGE_INDICATEURS
INSERT INTO public.metadata_indicateur (name, data_type, description, est_visible, alias, est_editable, validation_regex, validation_regex_error_message, edit_box_type, default_value, est_obligatoire, doit_afficher_la_description, groupe, bloc_id) VALUES
('vi_dept_from', 'text', 'Source des valeurs initiales départementales (import, agrégation géographique, agrégation d''indicateurs...)', true, 'Valeur initiale - Origine', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 2),
('vi_dept_op', 'text', 'Opération effectuée sur la source de la valeur pour obtenir la valeur affichée dans Pilote', true, 'Méthode d''agrégation - VI', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 2),
('va_dept_from', 'text', 'Source des valeurs actuelles départementales (import, agrégation géographique, agrégation d''indicateurs...)', true, 'Valeur actuelle - Origine', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 2),
('va_dept_op', 'text', 'Opération effectuée sur la source de la valeur pour obtenir la valeur affichée dans Pilote', true, 'Méthode d''agrégation - VA', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 2),
('vc_dept_from', 'text', 'Source des valeurs cibles départementales (import, agrégation géographique, agrégation d''indicateurs...)', true, 'Valeur cible - Origine', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 2),
('vc_dept_op', 'text', 'Opération effectuée sur la source de la valeur pour obtenir la valeur affichée dans Pilote', true, 'Méthode d''agrégation - VC', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 2),
('vi_reg_from', 'text', 'Source des valeurs initiales régionales (import, agrégation géographique, agrégation d''indicateurs...)', true, 'Valeur initiale - Origine', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 3),
('vi_reg_op', 'text', 'Opération effectuée sur la source de la valeur pour obtenir la valeur affichée dans Pilote', true, 'Méthode d''agrégation - VI', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 3),
('va_reg_from', 'text', 'Source des valeurs actuelles régionales (import, agrégation géographique, agrégation d''indicateurs...)', true, 'Valeur actuelle - Origine', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 3),
('va_reg_op', 'text', 'Opération effectuée sur la source de la valeur pour obtenir la valeur affichée dans Pilote', true, 'Méthode d''agrégation - VA', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 3),
('vc_reg_from', 'text', 'Source des valeurs cibles régionales (import, agrégation géographique, agrégation d''indicateurs...)', true, 'Valeur cible - Origine', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 3),
('vc_reg_op', 'text', 'Opération effectuée sur la source de la valeur pour obtenir la valeur affichée dans Pilote', true, 'Méthode d''agrégation - VC', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 3),
('vi_nat_from', 'text', 'Source de la valeur initiale nationale (import, agrégation géographique, agrégation d''indicateurs...)', true, 'Valeur initiale - Origine', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 4),
('vi_nat_op', 'text', 'Opération effectuée sur la source de la valeur pour obtenir la valeur affichée dans Pilote', true, 'Méthode d''agrégation - VI', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 4),
('va_nat_from', 'text', 'Source de la valeur actuelle nationale (import, agrégation géographique, agrégation d''indicateurs...)', true, 'Valeur actuelle - Origine', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 4),
('va_nat_op', 'text', 'Opération effectuée sur la source de la valeur pour obtenir la valeur affichée dans Pilote', true, 'Méthode d''agrégation - VA', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 4),
('vc_nat_from', 'text', 'Source de la valeur cible nationale (import, agrégation géographique, agrégation d''indicateurs...)', true, 'Valeur cible - Origine', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 4),
('vc_nat_op', 'text', 'Opération effectuée sur la source de la valeur pour obtenir la valeur affichée dans Pilote', true, 'Méthode d''agrégation - VC', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 4),
('param_vaca_decumul_from', 'text', 'Dans le cas où les valeurs sont agrégeables et doivent être décumulées pour calcul de la VAC dans le TA annuel.', true, 'Décumul des valeurs saisies (TA annuel)', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 5),
('param_vaca_partition_date', 'text', 'Les valeurs sont saisies décumulées ou sont décumulées (Décumul des valeurs saisies = Oui). Un traitement doit-il être appliqué sur ces valeurs ?', true, 'Cumul des valeurs (TA annuel)', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 5),
('param_vaca_op', 'text', 'Indiquer s''il faut faire une somme ou une moyenne des VA. Si la VA doit être utilisée telle que saisie, indiquer "Valeur saisie".', true, 'Opération (TA annuel)', true, '', NULL, 'multi-select', '', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 5),
('param_vacg_decumul_from', 'text', 'Dans le cas où les valeurs sont agrégeables et doivent être décumulées pour calcul de la VAC dans le TA global. Par défaut, saisir le même paramétrage que pour le TA annuel.', true, 'Décumul des valeurs saisies (TA global)', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 5),
('param_vacg_partition_date', 'text', 'Les valeurs sont saisies décumulées ou sont décumulées (Décumul des valeurs saisies = Oui). Un traitement doit-il être appliqué sur ces valeurs ?', true, 'Cumul des valeurs (TA global)', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 5),
('param_vacg_op', 'text', 'Indiquer s''il faut faire une somme ou une moyenne des VA. Si la VA doit être utilisée telle que saisie, indiquer "Valeur saisie".', true, 'Opération (TA global)', true, '', NULL, 'multi-select', '', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 5),
('tendance', 'text', 'Evolution attendue de l''indicateur. Si l''évolution attendue est stable, l''option "hausse" sera sélectionnée.', true, 'Tendance de l''indicateur', true, '', NULL, 'multi-select', 'HAUSSE', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 5),
('poids_pourcent_nat_declaree', 'number', 'Poids de l''indicateur dans le calcul du taux d''avancement global aux différentes mailles', true, 'Maille nationale', true, '(^\d{1,2}$)|(^\d{1,2}\.\d{1,2}$)|(^100$)', 'Pondération comprise entre 0 et 100.', 'text', '0', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 6),
('poids_pourcent_reg_declaree', 'number', 'Poids de l''indicateur dans le calcul du taux d''avancement global à la maille régionale si territorialisé à cette maille.', true, 'Maille régionale', true, '(^\d{1,2}$)|(^\d{1,2}\.\d{1,2}$)|(^100$)', 'Pondération comprise entre 0 et 100.', 'text', '0', false, false, 'METADATA_PARAMETRAGE_INDICATEURS', 6),
('poids_pourcent_dept_declaree', 'number', 'Poids de l''indicateur dans le calcul du taux d''avancement global à la maille départementale si territorialisé à cette maille.', true, 'Maille départementale', true, '(^\d{1,2}$)|(^\d{1,2}\.\d{1,2}$)|(^100$)', 'Pondération comprise entre 0 et 100.', 'text', '0', false, false, 'METADATA_PARAMETRAGE_INDICATEURS', 6),
('poids_pourcent_eval_nat_declaree', 'number', 'Poids de l''indicateur dans le calcul du taux d''avancement pour les feuilles de route aux différentes mailles', true, 'Maille nationale (Feuille de route)', true, '(^\d{1,2}$)|(^\d{1,2}\.\d{1,2}$)|(^100$)', 'Pondération comprise entre 0 et 100.', 'text', '0', false, true, 'METADATA_PARAMETRAGE_INDICATEURS', 6),
('poids_pourcent_eval_reg_declaree', 'number', 'Poids de l''indicateur dans le calcul du taux d''avancement global à la maille régionale si territorialisé à cette maille.', true, 'Maille régionale (Feuille de route)', true, '(^\d{1,2}$)|(^\d{1,2}\.\d{1,2}$)|(^100$)', 'Pondération comprise entre 0 et 100.', 'text', '0', false, false, 'METADATA_PARAMETRAGE_INDICATEURS', 6),
('poids_pourcent_eval_dept_declaree', 'number', 'Poids de l''indicateur dans le calcul du taux d''avancement global à la maille départementale si territorialisé à cette maille.', true, 'Maille départementale (Feuille de route)', true, '(^\d{1,2}$)|(^\d{1,2}\.\d{1,2}$)|(^100$)', 'Pondération comprise entre 0 et 100.', 'text', '0', false, false, 'METADATA_PARAMETRAGE_INDICATEURS', 6);

-- METADATA_INDICATEURS_COMPLEMENTAIRE
INSERT INTO public.metadata_indicateur (name, data_type, description, est_visible, alias, est_editable, validation_regex, validation_regex_error_message, edit_box_type, default_value, est_obligatoire, doit_afficher_la_description, groupe, bloc_id) VALUES
('reforme_prioritaire', 'text', 'Réforme prioritaire dont est issu l''indicateur persévérant.', true, 'Réforme prioritaire', true, '', NULL, 'text', '', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('projet_annuel_perf', 'boolean', 'Utilisation de l''indicateur dans le cadre d''un projet annuel de performance (PAP) annexé à un projet de loi de finances.', true, 'Projet annuel de performance (PAP)', true, '', NULL, NULL, 'false', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('detail_projet_annuel_perf', 'text', 'Détail du projet annuel de performance dans le cadre duquel l''indicateur est utilisé.', true, 'Détail projet annuel de performance', true, '', NULL, 'textarea', '', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('periodicite', 'text', 'Rythme de production des données de l''indicateur.', true, 'Périodicité', true, '', NULL, 'multi-select', '', true, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('delai_disponibilite', 'number', 'Délai prévisionnel moyen entre la fin de la période couverte par la donnée et la disponibilité de l''indicateur dans PILOTE. A exprimer en nombre seul. L''unité est le mois.', true, 'Délai de disponibilité', true, '(^\d{1,2}$)|(^\d{1,2}\.\d{1,2}$)|(^100$)', 'Délai de disponibilité compris entre 0 et 100.', 'text', '0', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('indic_territorialise', 'boolean', 'Déclinaison de l''indicateur et de ses cibles aux mailles départementale et/ou régionale.', true, 'Territorialisation', true, '', NULL, NULL, 'false', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 1),
('frequence_territoriale', 'number', 'Fréquence d''actualisation des données territoriales, si différente de la fréquence nationale. A exprimer en nombre seul. L''unité est le mois.', true, 'Fréquence d''actualisation territoriale', true, '(^\d{1,2}$)|(^\d{1,2}\.\d{1,2}$)|(^100$)', 'Fréquence d''actualisation comprise entre 0 et 100.', 'text', '0', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('mailles', 'text', 'Mailles données pour lesquelles les données peuvent être fournies', true, 'Mailles données', true, '', NULL, 'multi-select', '', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('admin_source', 'text', 'Administration responsable de la diffusion et publication des données', true, 'Administration source', true, '', NULL, 'text', '', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('methode_collecte', 'text', 'Méthode de collecte de la donnée', true, 'Collecte', true, '', NULL, 'textarea', '', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('si_source', 'text', 'Système d''information source.', true, 'SI source', true, '', NULL, 'text', '', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('donnee_ouverte', 'boolean', 'Accessibilité des données au public.', true, 'Donnée ouverte', true, '', NULL, NULL, 'false', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('modalites_donnee_ouverte', 'text', 'Modalités d''accès à la donnée si donnée ouverte.', true, 'Modalités', true, '', NULL, 'textarea', '', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('resp_donnees', 'text', 'Prénom et nom du responsable données auprès du directeur de projet.', true, 'Responsable données', true, '', NULL, 'text', '', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('resp_donnees_email', 'text', 'Adresse email du responsable données auprès du directeur de projet.', true, 'Email responsable données', true, '', NULL, 'text', '', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('contact_technique', 'text', 'Prénom et nom du contact technique au sein de l''unité de diffusion et de publication de la donnée', true, 'Contact technique', true, '', NULL, 'text', '', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('contact_technique_email', 'text', 'Adresse email du contact technique au sein de l''unité de diffusion et de publication de la donnée', true, 'Email contact technique', true, '', NULL, 'text', '', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('commentaire', 'text', 'Champ de commentaire libre', true, 'Commentaire', true, '', NULL, 'textarea', '', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 7),
('maille_pilotage', 'text', 'Maille de pilotage de l''indicateur. Maille la plus fine à laquelle des valeurs cibles sont attendues.', true, 'Maille de pilotage', true, '', NULL, 'multi-select', '_', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 2),
('cible_attendue', 'boolean', 'Avec cible : l''indicateur a vocation à atteindre une cible / sans cible : l''indicateur n''est comparé à aucune valeur de référence. Il s''agit des indicateurs de contexte et de certains indicateurs déclarés sans cible (par conseillers).', true, 'Cible attendue', true, '', NULL, NULL, 'true', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 2),
('couverture_temporelle', 'text', 'Période couverte par la valeur de l''indicateur. Période sur laquelle s''appuie l''observation pour le calcul de l''indicateur.', true, 'Couverture temporelle', true, '', NULL, 'multi-select', 'continue', false, true, 'METADATA_INDICATEURS_COMPLEMENTAIRE', 2);

-- Ajout de l'entrée indic_id pour METADATA_PARAMETRAGE_INDICATEURS (duplicate name avec groupe différent)
-- Note: Dans le fichier TS original, il y a un doublon de 'indic_id' avec groupe différent
-- Prisma utilise 'name' comme clé primaire, donc seul le premier sera inséré
-- Le fichier TS utilise upsert qui met à jour si existe déjà

-- ============================================
-- METADATA_INDICATEUR_VALEUR_ACCEPTEE
-- ============================================

-- indic_type
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('indic_type', 0, '', 'Choisir une typologie', 'Choisir une typologie'),
('indic_type', 1, 'IMPACT', 'Impact', 'Indicateur d''impact'),
('indic_type', 2, 'DEPL', 'Déploiement', 'Indicateur de déploiement'),
('indic_type', 3, 'CONTEXTE', 'De contexte', 'Indicateur de contexte'),
('indic_type', 4, 'Q_SERV', 'De qualité de service', 'Mesure la qualité du service rendu.'),
('indic_type', 5, 'REBOND', 'Effets rebonds', 'Effets rebonds engendrés par la mise en place du chantier');

-- indic_schema
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('indic_schema', 1, 'sans-contraintes.json', '-', 'Pas de contraintes particulières'),
('indic_schema', 2, 'restrict-dept.json', 'Saisie départementale', 'Saisie restreinte au niveau départemental'),
('indic_schema', 3, 'restrict-reg.json', 'Saisie régionale', 'Saisie restreinte au niveau régional'),
('indic_schema', 4, 'restrict-0-100.json', 'Dans [0,100]', 'Saisie entre 0 et 100.');

-- zg_applicable - Restrictions géographiques
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('zg_applicable', 1, '', 'Toutes zones', 'Toutes zones'),
('zg_applicable', 2, 'ZG-002', 'Façades maritimes département', 'Départements avec façade maritime'),
('zg_applicable', 3, 'ZG-003', 'Façades maritimes région', 'Régions avec façade maritime'),
('zg_applicable', 4, 'ZG-004', 'ZFE département', 'Départements avec au moins une ZFE'),
('zg_applicable', 5, 'ZG-005', 'ZFE région', 'Régions avec au moins une ZFE'),
('zg_applicable', 6, 'ZG-006', 'Façades maritimes hors OM', 'Ensemble des territoires avec façade maritime hors Outre-Mer'),
('zg_applicable', 7, 'ZG-007', 'ZFE', 'Territoires avec au moins une ZFE'),
('zg_applicable', 8, 'ZG-008', 'Ports CH-049', 'Ports de la PPG « Verdir les ports et les flottes »'),
('zg_applicable', 9, 'ZG-009', 'Ports CH-059', 'Ports de la PPG « Devenir leader de l''hydrogène décarboné »'),
('zg_applicable', 10, 'ZG-010', 'Façade maritime Méditerranée', 'Territoires de la façade maritime méditerranéenne'),
('zg_applicable', 11, 'ZG-011', 'ANRU', 'Territoires concernés par le programme Accélérer le renouvellement urbain des quartiers'),
('zg_applicable', 12, 'ZG-012', 'ACV', 'Territoires concernés par le programme Action Coeur de Ville'),
('zg_applicable', 13, 'ZG-013', 'PVD', 'Territoires concernés par le programme Petites Villes de Demain'),
('zg_applicable', 14, 'ZG-014', 'Outre-Mer', 'DROM'),
('zg_applicable', 15, 'ZG-015', 'Façades maritimes dont OM', 'Territoires avec façade maritime dont Outre-Mer'),
('zg_applicable', 16, 'ZG-016', 'Prisons', 'Territoires concernés par le programme 15 000 places de prisons'),
('zg_applicable', 17, 'ZG-017', 'GUDA', 'Territoires concernés par les GUDA'),
('zg_applicable', 18, 'ZG-018', 'Toutes zones sauf Mayotte', 'Tous départements et régions Hexagone et OM, hors Mayotte'),
('zg_applicable', 19, 'ZG-019', 'Toutes zones métropole', 'Tous départements et régions Hexagone'),
('zg_applicable', 20, 'ZG-020', '50 sites + émetteurs', 'Territoires des 50 sites industriels les plus émetteurs'),
('zg_applicable', 21, 'ZG-021', 'Force aux Frontières', 'Territoires de la PPG « Force aux Frontières »'),
('zg_applicable', 22, 'ZG-022', 'Stationnement vélo sécurisé en gare', 'Territoires de l''indicateur Places de stationnement vélo sécurisé en gare (IND-215) de la PPG « Amplifier le plan vélo »'),
('zg_applicable', 23, 'ZG-023', 'Industrie décarbonnée', 'Régions de la PPG « Devenir la première grande économie décarbonée »'),
('zg_applicable', 24, 'ZG-024', 'Education prioritaire', 'Territoires contenant des écoles en Education Prioritaire (Cantal,Haute-Loire,Lot et Lozère n''ont pas de REP)'),
('zg_applicable', 25, 'ZG-025', 'Bon état écologique des cours d''eau', 'Toutes zones sauf départements 09, 64, 75, 93 et DROM (pas de station de mesure)'),
('zg_applicable', 26, 'ZG-026', 'PCAET (CH-161)', 'Toutes zones sauf Lozère'),
('zg_applicable', 27, 'ZG-027', 'Toutes zones sauf Corse', 'Tous départements et régions sauf Corse');

-- vi_dept_from, va_dept_from, vc_dept_from
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('vi_dept_from', 1, '_', 'Pas de saisie', 'Pas de saisie attendue à cette maille'),
('vi_dept_from', 2, 'user_input', 'Saisie utilisateur', 'On attend que cette valeur soit saisie par l''utilisateur'),
('vi_dept_from', 3, 'sub_indic', 'Sous-indicateur', ''),
('va_dept_from', 1, '_', 'Pas de saisie', 'Pas de saisie attendue à cette maille'),
('va_dept_from', 2, 'user_input', 'Saisie utilisateur', 'On attend que cette valeur soit saisie par l''utilisateur'),
('va_dept_from', 3, 'sub_indic', 'Sous-indicateur', ''),
('vc_dept_from', 1, '_', 'Pas de saisie', 'Pas de saisie attendue à cette maille'),
('vc_dept_from', 2, 'user_input', 'Saisie utilisateur', 'On attend que cette valeur soit saisie par l''utilisateur'),
('vc_dept_from', 3, 'sub_indic', 'Sous-indicateur', '');

-- vi_dept_op, va_dept_op, vc_dept_op
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('vi_dept_op', 1, '_', 'Aucune', 'Pas d''opération d''aggrégation'),
('vi_dept_op', 2, 'sum', 'Somme', 'Somme des valeurs des sous-indicateurs'),
('vi_dept_op', 3, 'avg', 'Moyenne', 'Moyenne des valeurs des sous-indicateurs'),
('va_dept_op', 1, '_', 'Aucune', 'Pas d''opération d''aggrégation'),
('va_dept_op', 2, 'sum', 'Somme', 'Somme des valeurs des sous-indicateurs'),
('va_dept_op', 3, 'avg', 'Moyenne', 'Moyenne des valeurs des sous-indicateurs'),
('vc_dept_op', 1, '_', 'Aucune', 'Pas d''opération d''aggrégation'),
('vc_dept_op', 2, 'sum', 'Somme', 'Somme des valeurs des sous-indicateurs'),
('vc_dept_op', 3, 'avg', 'Moyenne', 'Moyenne des valeurs des sous-indicateurs');

-- vi_reg_from, va_reg_from, vc_reg_from
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('vi_reg_from', 1, '_', 'Pas de saisie', 'Pas de saisie attendue à cette maille'),
('vi_reg_from', 2, 'user_input', 'Saisie utilisateur', 'On attend que cette valeur soit saisie par l''utilisateur'),
('vi_reg_from', 3, 'DEPT', 'Depuis les DEPT', 'Cette valeur sera aggrégée depuis les valeurs départementales'),
('vi_reg_from', 4, 'sub_indic', 'Sous-indicateur', ''),
('va_reg_from', 1, '_', 'Pas de saisie', 'Pas de saisie attendue à cette maille'),
('va_reg_from', 2, 'user_input', 'Saisie utilisateur', 'On attend que cette valeur soit saisie par l''utilisateur'),
('va_reg_from', 3, 'DEPT', 'Depuis les DEPT', 'Cette valeur sera aggrégée depuis les valeurs départementales'),
('va_reg_from', 4, 'sub_indic', 'Sous-indicateur', ''),
('vc_reg_from', 1, '_', 'Pas de saisie', 'Pas de saisie attendue à cette maille'),
('vc_reg_from', 2, 'user_input', 'Saisie utilisateur', 'On attend que cette valeur soit saisie par l''utilisateur'),
('vc_reg_from', 3, 'DEPT', 'Depuis les DEPT', 'Cette valeur sera aggrégée depuis les valeurs départementales'),
('vc_reg_from', 4, 'sub_indic', 'Sous-indicateur', '');

-- vi_reg_op, va_reg_op, vc_reg_op
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('vi_reg_op', 1, '_', 'Aucune', 'Pas d''opération d''aggrégation'),
('vi_reg_op', 2, 'sum', 'Somme', 'Somme des valeurs de la maille inférieure.'),
('vi_reg_op', 3, 'avg', 'Moyenne', 'Moyenne des valeurs de la maille inférieure.'),
('va_reg_op', 1, '_', 'Aucune', 'Pas d''opération d''aggrégation'),
('va_reg_op', 2, 'sum', 'Somme', 'Somme des valeurs de la maille inférieure.'),
('va_reg_op', 3, 'avg', 'Moyenne', 'Moyenne des valeurs de la maille inférieure.'),
('vc_reg_op', 1, '_', 'Aucune', 'Pas d''opération d''aggrégation'),
('vc_reg_op', 2, 'sum', 'Somme', 'Somme des valeurs de la maille inférieure.'),
('vc_reg_op', 3, 'avg', 'Moyenne', 'Moyenne des valeurs de la maille inférieure.');

-- vi_nat_from, va_nat_from, vc_nat_from
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('vi_nat_from', 1, '_', 'Pas de saisie', 'Pas de saisie attendue à cette maille'),
('vi_nat_from', 2, 'user_input', 'Saisie utilisateur', 'On attend que cette valeur soit saisie par l''utilisateur'),
('vi_nat_from', 3, 'DEPT', 'Depuis les DEPT', 'Cette valeur sera aggrégée depuis les valeurs départementales'),
('vi_nat_from', 4, 'REG', 'Depuis les REG', 'Cette valeur sera aggrégée depuis les valeurs régionales.'),
('vi_nat_from', 5, 'sub_indic', 'Sous-indicateur', ''),
('va_nat_from', 1, '_', 'Pas de saisie', 'Pas de saisie attendue à cette maille'),
('va_nat_from', 2, 'user_input', 'Saisie utilisateur', 'On attend que cette valeur soit saisie par l''utilisateur'),
('va_nat_from', 3, 'DEPT', 'Depuis les DEPT', 'Cette valeur sera aggrégée depuis les valeurs départementales'),
('va_nat_from', 4, 'REG', 'Depuis les REG', 'Cette valeur sera aggrégée depuis les valeurs régionales.'),
('va_nat_from', 5, 'sub_indic', 'Sous-indicateur', ''),
('vc_nat_from', 1, '_', 'Pas de saisie', 'Pas de saisie attendue à cette maille'),
('vc_nat_from', 2, 'user_input', 'Saisie utilisateur', 'On attend que cette valeur soit saisie par l''utilisateur'),
('vc_nat_from', 3, 'DEPT', 'Depuis les DEPT', 'Cette valeur sera aggrégée depuis les valeurs départementales'),
('vc_nat_from', 4, 'REG', 'Depuis les REG', 'Cette valeur sera aggrégée depuis les valeurs régionales.'),
('vc_nat_from', 5, 'sub_indic', 'Sous-indicateur', '');

-- vi_nat_op, va_nat_op, vc_nat_op
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('vi_nat_op', 1, '_', 'Aucune', 'Pas d''opération d''aggrégation'),
('vi_nat_op', 2, 'sum', 'Somme', 'Somme des valeurs de la maille inférieure.'),
('vi_nat_op', 3, 'avg', 'Moyenne', 'Moyenne des valeurs de la maille inférieure.'),
('va_nat_op', 1, '_', 'Aucune', 'Pas d''opération d''aggrégation'),
('va_nat_op', 2, 'sum', 'Somme', 'Somme des valeurs de la maille inférieure.'),
('va_nat_op', 3, 'avg', 'Moyenne', 'Moyenne des valeurs de la maille inférieure.'),
('vc_nat_op', 1, '_', 'Aucune', 'Pas d''opération d''aggrégation'),
('vc_nat_op', 2, 'sum', 'Somme', 'Somme des valeurs de la maille inférieure.'),
('vc_nat_op', 3, 'avg', 'Moyenne', 'Moyenne des valeurs de la maille inférieure.');

-- param_vaca_decumul_from
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('param_vaca_decumul_from', 1, '_', 'Non', 'Pas de décumul nécessaire'),
('param_vaca_decumul_from', 2, 'from_year_start', 'Oui, saisie en cumul annuel', 'Les valeurs sont saisies cumulées depuis le débur d''année'),
('param_vaca_decumul_from', 3, 'from_custom_date::2019-01-01', 'Oui, saisie en cumul depuis le début', 'Les valeurs ont saisies cumulées depuis une date éloignée, date de VI ou début du dispositif.');

-- param_vaca_partition_date
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('param_vaca_partition_date', 1, '_', 'Non', 'Valeurs déjà cumulées ou non cumulables.'),
('param_vaca_partition_date', 2, 'from_year_start', 'Oui, cumul annuel', 'Cumul des VA depuis janvier (01) de l''année en cours.'),
('param_vaca_partition_date', 3, 'from_custom_date::2019-01-01', 'Oui, cumul global', 'Cumul de toutes les VA.'),
('param_vaca_partition_date', 4, 'from_previous_month::12', 'Oui, cumul en année glissante', 'Cumul des VA des 12 derniers mois.');

-- param_vaca_op
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('param_vaca_op', 0, '', 'Choisir une Opération (TA annuel)', 'Choisir une Opération (TA annuel)'),
('param_vaca_op', 1, 'current_value', 'Valeur saisie', 'VA saisie : non cumulable (%) ou déjà cumulée (valeur à date)'),
('param_vaca_op', 2, 'sum', 'Somme des VA', 'Somme des VA'),
('param_vaca_op', 3, 'avg', 'Moyenne', 'Moyenne');

-- param_vacg_decumul_from
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('param_vacg_decumul_from', 1, '_', 'Non', 'Pas de décumul nécessaire'),
('param_vacg_decumul_from', 2, 'from_year_start', 'Oui, saisie en cumul annuel', 'Les valeurs sont saisies cumulées depuis le débur d''année'),
('param_vacg_decumul_from', 3, 'from_custom_date::2019-01-01', 'Oui, saisie en cumul depuis le début', 'Les valeurs ont saisies cumulées depuis une date éloignée, date de VI ou début du dispositif.');

-- param_vacg_partition_date
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('param_vacg_partition_date', 1, '_', 'Non', 'Valeurs déjà cumulées ou non cumulables.'),
('param_vacg_partition_date', 2, 'from_year_start', 'Oui, cumul annuel', 'Cumul des VA depuis janvier (01) de l''année en cours.'),
('param_vacg_partition_date', 3, 'from_custom_date::2019-01-01', 'Oui, cumul global', 'Cumul de toutes les VA.'),
('param_vacg_partition_date', 4, 'from_previous_month::12', 'Oui, cumul en année glissante', 'Cumul des VA des 12 derniers mois.');

-- param_vacg_op
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('param_vacg_op', 0, '', 'Choisir une Opération (TA global)', 'Choisir une Opération (TA global)'),
('param_vacg_op', 1, 'current_value', 'Valeur saisie', 'VA saisie : non cumulable (%) ou déjà cumulée (valeur à date)'),
('param_vacg_op', 2, 'sum', 'Somme des VA', 'Somme des VA'),
('param_vacg_op', 3, 'avg', 'Moyenne', 'Moyenne');

-- tendance
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('tendance', 1, 'HAUSSE', 'Hausse', 'Tendance en hausse'),
('tendance', 2, 'BAISSE', 'Baisse', 'Tendance en baisse');

-- periodicite
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('periodicite', 0, '', 'Choisir une périodicité', 'Choisir une périodicité'),
('periodicite', 1, 'Mensuelle', 'Mensuelle', 'Périodicité mensuelle'),
('periodicite', 2, 'Bimestrielle', 'Bimestrielle', 'Tous les 2 mois'),
('periodicite', 3, 'Trimestrielle', 'Trimestrielle', 'Périodicité trimestrielle'),
('periodicite', 4, 'Semestrielle', 'Semestrielle', 'Périodicité semestrielle'),
('periodicite', 5, 'Annuelle', 'Annuelle', 'Périodicité annuelle'),
('periodicite', 6, 'Bi-annuelle', 'Bi-annuelle', 'Périodicité bi-annuelle'),
('periodicite', 7, '3 ans', '3 ans', 'Périodicité triennale'),
('periodicite', 8, '6 ans', '6 ans', 'Périodicité sexennale'),
('periodicite', 9, 'Autre/Inconnue', 'Autre/Inconnue', 'Périodicité autre/inconnue');

-- mailles
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('mailles', 1, 'NAT', 'Nationale', 'Maille nationale'),
('mailles', 2, 'REG', 'Régions', 'Maille régionale'),
('mailles', 3, 'DEPT', 'Départements', 'Maille départementale'),
('mailles', 4, 'COM', 'Communes', 'Maille communale'),
('mailles', 5, 'FAC_M', 'Façades maritimes', 'Façades maritimes'),
('mailles', 6, 'EPCI', 'EPCI', 'Etablissement Public de Coopération Intercommunale'),
('mailles', 7, 'AGGLO', 'Agglomérations', 'Agglomérations de plus de 150 000 habitants en France métropolitaine'),
('mailles', 8, 'DISP', 'DISP', 'Directions inter-régionales des services pénitentiaires'),
('mailles', 9, 'COUR', 'Cours d''appel', 'Cours d''appel'),
('mailles', 10, 'DIRPJJ', 'DIRPJJ', 'Directions inter-régionales de la protection judiciaire de la jeunesse'),
('mailles', 11, 'ACA', 'Académies', 'Académies'),
('mailles', 12, 'PORT', 'Grands ports maritimes', 'Grands ports maritimes'),
('mailles', 13, 'MEAE', 'Zones MEAE', 'Zones géographiques regroupant plusieurs pays');

-- maille_pilotage
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('maille_pilotage', 1, '_', 'Non piloté', 'Indicateur non utilisé pour le pilotage, sans cible attendue.'),
('maille_pilotage', 2, 'DEPT', 'Départemental', 'Pilotage départemental, régional et national'),
('maille_pilotage', 3, 'REG', 'Régional', 'Pilotage régional et national'),
('maille_pilotage', 4, 'NAT', 'National', 'Pilotage national');

-- couverture_temporelle
INSERT INTO public.metadata_indicateur_valeur_acceptee (metadata_indicateur_name, ordre, valeur, nom, description) VALUES
('couverture_temporelle', 1, 'continue', 'Période d''observation', 'Valeur mesurée depuis le début de la période d''observation. Par exemple, depuis une date précise de lancement du programme.'),
('couverture_temporelle', 2, 'a_date', 'A date', 'Calcul de l''indicateur à date.'),
('couverture_temporelle', 3, 'annee', 'Année', 'Indicateur observé depuis le début de l''année civile en cours.'),
('couverture_temporelle', 4, 'annee_glissante', 'Année glissante', 'Indicateur observé sur les 12 derniers mois.');