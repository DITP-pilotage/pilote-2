# Couverture des tests E2E

Ce document recense l'ensemble des scénarios couverts par les tests end-to-end (Playwright) du projet PILOTE.

---

## 1. Authentification et connexion

**Fichier :** `tests/login.spec.ts`

- Accès à la page d'accueil (landing page) sans authentification
- Connexion avec les identifiants de test : vérification que l'utilisateur est bien connecté (bouton "Mon espace" visible dans le header)

---

## 2. Consultation des données d'un chantier — Isolation par profil

**Fichier :** `tests/information-chantier.spec.ts`

7 scénarios couvrant la page chantier avec différents profils pour vérifier l'isolation des droits de lecture, d'écriture et d'accès territorial. Chantier de référence : CH-129.

### Test 1 : DITP Admin — Accès complet en lecture et écriture

Profil : `ditp.admin@example.com` (DITP_ADMIN)

**Navigation et structure :**

- Navigation vers CH-129 au niveau national (NAT-FR)
- Vérification de la structure complète de la page chantier :
  - Avancement du chantier, Responsables, Min/Médiane/Max
  - Météo et synthèse des résultats, Répartition géographique
  - Objectifs (Notre ambition, Ce qui a déjà été fait, Ce qui reste à faire)
  - Indicateurs, Décisions stratégiques, Suivi des décisions stratégiques
  - Commentaires : Autres résultats obtenus, Risques et freins, Solutions et actions, Exemples de réussite

**Éléments spécifiques au profil :**

- Vérification que le sélecteur de maille est visible
- Vérification que le lien "Mettre à jour les données" est visible
- Vérification que les boutons de nouveau commentaire sont visibles pour chaque type de commentaire
- Vérification que le bouton d'édition de la synthèse/météo est visible

### Test 2 : Premier Ministre — Lecture seule, tous territoires

Profil : `premiere.ministre@example.com` (PM_ET_CABINET)

**Navigation et structure :**

- Navigation vers CH-129 au niveau national (NAT-FR)
- Vérification de la structure complète de la page chantier (mêmes sections que Test 1)

**Éléments de lecture seule :**

- Vérification que le sélecteur de maille est visible
- Vérification que le lien "Mettre à jour les données" n'est PAS visible
- Vérification que les boutons de nouveau commentaire ne sont PAS visibles
- Vérification que le bouton d'édition de la synthèse/météo n'est PAS visible

### Test 3 : Équipe Direction de Projet — Périmètre chantier limité, écriture nationale

Profil : `equipe.dir.projet@example.com` (EQUIPE_DIR_PROJET, chantiers : CH-054, CH-058, CH-062, CH-051, CH-129)

**Navigation vers un chantier autorisé :**

- Navigation vers CH-129 au niveau national (NAT-FR)
- Vérification de la structure complète
- Vérification que le sélecteur de maille est visible
- Vérification que le lien "Mettre à jour les données" est visible

**Écriture à la maille nationale :**

- Vérification que les boutons de nouveau commentaire sont visibles
- Vérification que le bouton d'édition de la synthèse/météo est visible
- Vérification que les objectifs sont en mode écriture

**Isolation par chantier — accès refusé :**

- Navigation vers un chantier non autorisé → vérification de la page 404

### Test 4 : Coordinateur Département — Territoire restreint, sélecteur de maille masqué, écriture ATE

Profil : `pva.coordinateur.dept@example.com` (COORDINATEUR_DEPARTEMENT, territoires : DEPT-56, saisieCommentaire chantiers : CH-129)

**Navigation vers le territoire autorisé :**

- Navigation vers CH-129 au niveau DEPT-56
- Vérification de la structure de la page chantier (sans section Décisions stratégiques ni Suivi des décisions stratégiques — maille non nationale)

**Éléments spécifiques au profil :**

- Vérification que le sélecteur de maille n'est PAS visible
- Vérification que le lien "Mettre à jour les données" n'est PAS visible
- Vérification que les boutons de nouveau commentaire sont visibles (saisieCommentaire inclut CH-129)

### Test 5 : Préfet Région — Territoire régional, écriture commentaires ATE

Profil : `chantier.prefet.reg@example.com` (PREFET_REGION, territoires : REG-53 + départements, saisieCommentaire chantiers : CH-129)

**Navigation vers le territoire régional :**

- Navigation vers CH-129 au niveau REG-53
- Vérification de la structure de la page chantier (sans section Décisions stratégiques ni Suivi des décisions stratégiques — maille non nationale)

**Éléments spécifiques au profil :**

- Vérification que le sélecteur de maille est visible
- Vérification que le lien "Mettre à jour les données" n'est PAS visible
- Vérification que les boutons de nouveau commentaire sont visibles (saisieCommentaire inclut CH-129)

### Test 6 : Coordinateur Département sans habilitation chantier — lecture seule sur le territoire

Profil : `coordinateur.departement@example.com` (COORDINATEUR_DEPARTEMENT, territoires : DEPT-56, saisieCommentaire chantiers : aucun)

- Navigation vers CH-129 au niveau DEPT-56
- Vérification de la structure territoriale
- Vérification que le sélecteur de maille n'est PAS visible
- Vérification que les boutons de nouveau commentaire ne sont PAS visibles (saisieCommentaire.chantiers ne contient pas CH-129)

### Test 7 : Préfet Région sans habilitation chantier — lecture seule sur le territoire

Profil : `prefet.region@example.com` (PREFET_REGION, territoires : REG-53, saisieCommentaire chantiers : aucun)

- Navigation vers CH-129 au niveau REG-53
- Vérification de la structure territoriale
- Vérification du sélecteur de maille visible
- Vérification que les boutons de nouveau commentaire ne sont PAS visibles (saisieCommentaire.chantiers ne contient pas CH-129)

### Matrice de visibilité sur la page chantier par profil

| Élément                        | DITP Admin | PM Cabinet | Éq. Dir. Projet | Coord. Dept (avec hab.) | Préfet Rég. (avec hab.) | Coord. Dept (sans hab.) | Préfet Rég. (sans hab.) |
|--------------------------------|:----------:|:----------:|:----------------:|:-----------------------:|:-----------------------:|:-----------------------:|:-----------------------:|
| **Territoire testé**           |   NAT-FR   |   NAT-FR   |      NAT-FR      |         DEPT-56         |         REG-53          |         DEPT-56         |         REG-53          |
| Structure complète             |     ✓      |     ✓      |        ✓         |            ✓            |            ✓            |            ✓            |            ✓            |
| Décisions stratégiques         |     ✓      |     ✓      |        ✓         |            ✗            |            ✗            |            ✗            |            ✗            |
| Sélecteur de maille            |     ✓      |     ✓      |        ✓         |            ✗            |            ✓            |            ✗            |            ✓            |
| Mettre à jour les données      |     ✓      |     ✗      |        ✓         |            ✗            |            ✗            |            ✗            |            ✗            |
| Boutons nouveau commentaire    |     ✓      |     ✗      |        ✓         |            ✓            |            ✓            |            ✗            |            ✗            |
| Accès chantier non autorisé    |     —      |     —      |       404        |            —            |            —            |            —            |            —            |

---

## 3. Import de données indicateur

**Fichier :** `tests/import-donnee.spec.ts`

- Navigation depuis la page d'accueil vers la page chantier puis vers "Mise à jour des données"
- Sélection d'un indicateur (IND-021) dans l'assistant d'import
- Upload d'un fichier CSV invalide contenant un identifiant indicateur incorrect (IND-97 au lieu de IND-021) :
  - Vérification que le fichier est rejeté
  - Vérification des messages d'erreur ("ne respecte pas le motif imposé", "ne correspond pas à l'indicateur choisi")
- Upload d'un fichier CSV valide avec les bonnes données :
  - Vérification que le fichier est conforme
  - Transmission des données
  - Vérification du succès de l'import

---

## 4. Export CSV

### 4.1 Export des chantiers

**Fichier :** `tests/export-csv-chantier.spec.ts`

- Ouverture de la modale d'export CSV depuis la page d'accueil
- Sélection du type d'export "les chantiers"
- Choix du périmètre "exporter tous les éléments" (sans filtres)
- Vérification de la disponibilité de chaque option de données à collecter :
  - Identifiants du chantier et du territoire (pré-coché)
  - Gouvernance du chantier
  - Responsabilité du chantier
  - Objectifs du chantier
  - Données descriptives du chantier sur le territoire
  - Données de comparaison du chantier
  - Météo et synthèse des résultats
  - Commentaires du chantier
  - Suivi des décisions stratégiques
- Téléchargement du fichier avec options "identifiant + gouvernance" : vérification du nom de fichier (`PILOTE-Chantiers-*.csv`) et des colonnes CSV (Maille, Région, Département, Code INSEE, Chantier Id, Chantier, Ministère, Axe, Statut, etc.)
- Téléchargement avec options supplémentaires (responsabilité, objectifs) : vérification des colonnes additionnelles (Directeur projet, Contact, Responsable local, Notre ambition, etc.)

### 4.2 Export des indicateurs

**Fichier :** `tests/export-csv-indicateur.spec.ts`

- Sélection du type d'export "les indicateurs des chantiers"
- Choix du périmètre sans filtres
- Vérification des options de données à collecter :
  - Identifiants de l'indicateur, du chantier associé et du territoire (pré-coché)
  - Cadrage de l'indicateur
  - Gouvernance de l'indicateur et du chantier associé
  - Données de l'indicateur sur le territoire
  - Données du chantier associé sur le territoire
  - Météo et synthèse des résultats du chantier associé
- Téléchargement et vérification des colonnes CSV (Maille, Région, Département, Chantier, Indicateur, etc.)
- Téléchargement avec colonnes étendues : vérification des données descriptives (Valeur initiale, Date valeur initiale, Valeur avancement, Taux d'avancement, etc.)

### 4.3 Export de l'historique des indicateurs

**Fichier :** `tests/export-csv-historique-indicateur.spec.ts`

- Application préalable d'un filtre ministère ("Intérieur et Outre-mer") pour réduire le périmètre
- Sélection du type d'export "l'historique des indicateurs"
- Choix du périmètre avec filtres actifs
- Vérification des options de données :
  - Identifiants de l'indicateur et du territoire (pré-coché)
  - Valeur initiale et valeurs cibles (pré-coché)
  - Valeurs d'avancement mois par mois (pré-coché)
- Téléchargement et vérification du fichier (`PILOTE-Historique-Indicateurs-*.csv`) avec les colonnes attendues (Valeur initiale, Valeur cible année 2025, Valeur cible année 2026, Valeur avancement, etc.)

### 4.4 Export des utilisateurs

**Fichier :** `tests/export-csv-utilisateur.spec.ts`

- Navigation vers la page d'administration des utilisateurs
- Téléchargement du fichier CSV des utilisateurs (`PILOTE-Utilisateurs-*.csv`)
- Vérification des 19 colonnes du fichier : Prénom, Nom, Email, Fonction, Profil, Périmètre ministériel, Service, Territoire, Périmètre, Droit de lecture, Responsabilité, Droits de saisie des données quantitatives, Droits de saisie des commentaires, Droits de gestion des utilisateurs, Statut, Date de création, Auteur création, Date de dernière modification, Auteur dernière modification

---

## 5. Proposition de Valeur d'Avancement (PVA)

**Fichier :** `tests/proposition-valeur-avancement.spec.ts`

5 scénarios couvrant le cycle de vie complet des propositions de valeur d'avancement, testés avec plusieurs profils utilisateurs (coordinateur départemental, préfet départemental, coordinateur régional, équipe direction de projet).

### Test 1 : Parcours complet de création et acceptation d'une proposition

- Le coordinateur départemental crée une proposition de valeur d'avancement (valeur, motif, source de données), passe par l'écran de récapitulatif puis publie
- Vérification côté territoire : la proposition apparaît avec le statut "en attente de lecture par la direction de projet", les boutons modifier/supprimer sont disponibles
- La direction de projet accuse réception de la proposition avec un commentaire
- Vérification côté territoire : après accusé de réception, le statut passe à "lue par la direction de projet" et les boutons modifier/supprimer disparaissent
- La direction de projet accepte la proposition
- Vérification du statut "acceptée" sur la page du chantier
- Vérification de l'historique : les 3 événements (nouvelle proposition, accusé de réception, acceptation) apparaissent dans la modale d'historique

### Test 2 : Refus d'une proposition et possibilité de re-proposer

- Le préfet départemental crée une proposition de valeur d'avancement
- La direction de projet refuse la proposition avec un motif
- Vérification côté direction : le statut affiche "dernière proposition en date refusée"
- Vérification côté territoire : le statut "refusée" est visible et le bouton "Proposer une autre valeur d'avancement" est de nouveau accessible
- Vérification de l'historique : les 2 événements (nouvelle proposition, refus) apparaissent

### Test 3 : Acceptation avec modification de la valeur proposée

- Le coordinateur départemental crée une proposition avec une valeur de 75
- La direction de projet accepte avec modification en ajustant la valeur à 60, avec un motif explicatif
- Vérification du statut "acceptée avec modification" sur la page du chantier
- Vérification de l'historique : les 2 événements (nouvelle proposition, acceptation avec modification) apparaissent

### Test 4 : Modification puis suppression d'une proposition par le territoire

- Le coordinateur départemental crée une proposition avec une valeur de 30
- Le même coordinateur modifie sa proposition en corrigeant la valeur à 35 et en mettant à jour le motif
- Vérification du statut "modifiée par le territoire"
- Le coordinateur supprime la proposition en indiquant un motif de suppression
- Vérification du statut "dernière proposition en date supprimée" et du bouton de re-proposition accessible
- Vérification de l'historique complet : les 3 événements (nouvelle proposition, modification, suppression) apparaissent

### Test 5 : Blocage de proposition sur maille région agrégée

- Le coordinateur régional navigue vers le chantier au niveau régional (REG-53)
- Vérification que l'indicateur IND-021 (maille régionale agrégée) affiche un message de blocage "Impossible de proposer une autre valeur d'avancement"
- Le bouton "Proposer une autre valeur d'avancement" n'est pas visible

---

## 6. API Open API

### 6.1 Authentification API

**Fichier :** `tests/open-api/authentification.spec.ts`

- Requête sans header Authorization : réponse 401 Unauthorized
- Requête avec header Authorization invalide : réponse 400 Bad Request
- Requête avec un JWT valide mais non forgé par l'API : réponse 400 Bad Request
- Requête avec un JWT valide forgé par l'API (profil DITP_ADMIN) : réponse 200 OK avec message de bienvenue

### 6.2 Gestion des erreurs API

**Fichier :** `tests/open-api/error-management.spec.ts`

- Accès aux données d'un chantier non autorisé (CH-039 avec profil EQUIPE_DIR_PROJET limité à CH-129) : réponse 403 Forbidden
- Accès aux données d'un indicateur non autorisé (IND-718 sur CH-039) : réponse 403 Forbidden

### 6.3 Export des données d'un chantier via API

**Fichier :** `tests/open-api/export-donnee-chantier.spec.ts`

- Récupération des données du chantier CH-129 (profil EQUIPE_DIR_PROJET) : réponse 200 OK
- Vérification de la structure des données retournées : identifiant chantier, nom
- Vérification de la présence de données territoriales par maille (DEPT > 0, REG > 0, NAT = 1)
- Vérification des champs de taux d'avancement (département, région, national, annuel)
- Vérification de la présence de toutes les publications (synthèse des résultats, objectifs, commentaires, risques, solutions, exemples de réussite, décisions stratégiques)

### 6.4 Export des données d'un indicateur via API

**Fichier :** `tests/open-api/export-donnee-indic-quanti.spec.ts`

- Récupération des données de l'indicateur IND-021 sur le chantier CH-129 : réponse 200 OK
- Vérification du nombre de territoires : 101 départements, 18 régions, 1 national
- Vérification de la structure complète d'un enregistrement territorial : maille, code INSEE, territoire, dates et valeurs (actuelle, cible, cible annuelle, initiale), taux d'avancement

### 6.5 Import de commentaires via API

**Fichier :** `tests/open-api/import-chantier-commentaire.spec.ts`

- Import d'un commentaire valide sans date : réponse 200 OK
- Import d'un commentaire avec une date antérieure : réponse 200 OK
- Import de plusieurs commentaires valides en une seule requête (3 types différents) : réponse 200 OK
- Import avec une date dans le futur : réponse 400 Bad Request
- Import d'un type national sur une maille régionale : réponse 400 (type non autorisé pour la maille)
- Import d'un type régional sur une maille nationale : réponse 400 (type non autorisé pour la maille)
- Import avec un type invalide : réponse 400 Bad Request
- Import sur un chantier non autorisé (CH-999) : réponse 403 Forbidden

### 6.6 Import de décisions stratégiques via API

**Fichier :** `tests/open-api/import-chantier-decision-strategique.spec.ts`

- Import d'une décision stratégique valide sans date : réponse 200 OK
- Import d'une décision stratégique avec une date antérieure : réponse 200 OK
- Import avec une date dans le futur : réponse 400 Bad Request
- Import avec un type invalide : réponse 400 Bad Request
- Import sur un chantier non autorisé (CH-999) : réponse 403 Forbidden

### 6.7 Import d'objectifs via API

**Fichier :** `tests/open-api/import-chantier-objectif.spec.ts`

- Import d'un objectif valide sans date (type "notre_ambition") : réponse 200 OK
- Import d'un objectif avec une date antérieure (type "deja_fait") : réponse 200 OK
- Import de plusieurs objectifs valides en une seule requête (3 types : notre_ambition, deja_fait, a_faire) : réponse 200 OK
- Import avec une date dans le futur : réponse 400 Bad Request
- Import avec un type invalide : réponse 400 Bad Request
- Import sur un chantier non autorisé (CH-999) : réponse 403 Forbidden

### 6.8 Import de synthèses des résultats via API

**Fichier :** `tests/open-api/import-chantier-synthese-des-resultats.spec.ts`

- Import d'une synthèse valide sans date (territoire NAT-FR, météo SOLEIL) : réponse 200 OK
- Import d'une synthèse avec une date antérieure (météo NUAGE) : réponse 200 OK
- Import de plusieurs synthèses valides en une seule requête (météos SOLEIL et ORAGE) : réponse 200 OK
- Import avec une date dans le futur : réponse 400 Bad Request
- Import avec une météo invalide : réponse 400 Bad Request
- Import sur un chantier non autorisé (CH-999) : réponse 403 Forbidden

---

## 7. Gestion des comptes utilisateurs

**Fichier :** `tests/admin-gestion-utilisateurs.spec.ts`

8 scénarios couvrant la page listing des utilisateurs (`/admin/utilisateurs`) et la fiche détail (`/admin/utilisateur/[id]`), testés avec plusieurs profils pour vérifier les différences de visibilité, d'actions autorisées et de restrictions.

### Test 1 : DITP Admin — Vue administrateur complète et génération de token API

Profil : `ditp.admin@example.com` (DITP_ADMIN)

**Page listing :**

- Accès via le lien "Gestion des comptes" dans la navigation
- Vérification de la structure du tableau : présence de toutes les colonnes (Adresse électronique, Nom, Prénom, Profil, Fonction, Dernière modification, Territoire, Actif)
- Vérification que la colonne "Territoire" est visible (spécifique aux profils DITP)
- Vérification que tous les profils sont disponibles dans le filtre "Profil" de la barre latérale
- Vérification du bouton "Créer un compte" menant vers `/admin/utilisateur/creer` (accès direct, pas la page d'aide)
- Vérification que des utilisateurs de profils variés sont visibles dans le tableau (DITP_ADMIN voit tous les utilisateurs)

**Fiche détail :**

- Navigation vers la fiche d'un utilisateur depuis le tableau (clic sur la ligne de `coordinateur.region@example.com`)
- Vérification des informations affichées dans le tableau de la fiche : email, nom, prénom, profil
- Vérification que le bouton "Modifier" est visible
- Vérification que le lien "Désactiver le compte" est visible
- Vérification qu'aucun bandeau de restriction n'est affiché (DITP_ADMIN peut tout modifier)

**Génération de token API :**

- Navigation vers la fiche d'un utilisateur éligible au token API (profil parmi : DITP_ADMIN, DIR_PROJET, EQUIPE_DIR_PROJET, SECRETARIAT_GENERAL, COORDINATEUR_REGION, COORDINATEUR_DEPARTEMENT)
- Vérification que le bouton "Générer un token d'authentification" est visible
- Clic sur le bouton et vérification que la génération fonctionne

**Vérification négative token API :**

- Navigation vers la fiche d'un utilisateur avec un profil NON éligible au token API (ex : PREFET_REGION, PREFET_DEPARTEMENT, CABINET_MINISTERIEL)
- Vérification que le bouton "Générer un token d'authentification" n'est PAS visible

### Test 2 : Coordinateur Région — Visibilité limitée et restrictions sur les coordinateurs

Profil : `coordinateur.region@example.com` (COORDINATEUR_REGION, territoires : REG-53, DEPT-56, DEPT-29, DEPT-35, DEPT-22)

**Page listing — vérification de la visibilité :**

- Accès à la page listing
- Vérification que la colonne "Territoire" n'est PAS visible
- Vérification que seuls les profils autorisés en lecture apparaissent dans le filtre "Profil" : Préfet de région, Préfet de département, Services déconcentrés régionaux, Services déconcentrés départementaux, Coordinateur PILOTE départemental, Coordinateur PILOTE régional
- Vérification que les utilisateurs affichés dans le tableau ont uniquement des profils parmi ceux autorisés
- Vérification du nombre d'utilisateurs visibles (doit correspondre aux utilisateurs dont les territoires sont inclus dans le périmètre Bretagne)
- Vérification que le bouton "Créer un compte" mène vers `/admin/utilisateur/creer/aide` (page d'aide, pas l'accès direct)

**Fiche détail — utilisateur modifiable (PREFET_DEPARTEMENT) :**

- Navigation vers `prefet.departement@example.com` (PREFET_DEPARTEMENT, territoires dans le périmètre)
- Vérification que le bouton "Modifier" est visible
- Vérification que le lien "Désactiver le compte" est visible
- Vérification qu'aucun bandeau de restriction n'est affiché
- Vérification que le bouton "Générer un token" n'est PAS visible

**Fiche détail — utilisateur modifiable (SERVICES_DECONCENTRES_REGION) :**

- Navigation vers `services.deconcentres.region@example.com`
- Vérification que le bouton "Modifier" est visible
- Vérification que le lien "Désactiver le compte" est visible
- Vérification qu'aucun bandeau de restriction n'est affiché
- Vérification que le bouton "Générer un token" n'est PAS visible

**Fiche détail — restriction : profil coordinateur non modifiable :**

- Navigation vers `coordinateur.departement@example.com` (COORDINATEUR_DEPARTEMENT)
- Vérification du bandeau de restriction : "Ce compte a un profil de coordinateur PILOTE. Vous ne pouvez le modifier ou le désactiver."
- Vérification que le bouton "Modifier" est absent
- Vérification que le lien "Désactiver le compte" est absent

**Fiche détail — utilisateur avec chantier hors ATE : le coordinateur peut quand même modifier :**

- Navigation vers `services.deconcentres.hors-ate@example.com` (SERVICES_DECONCENTRES_REGION avec CH-108 `hors_ate_deconcentre`)
- CH-108 est présent dans les `lecture.chantiers` de cet utilisateur, mais absent des `gestionUtilisateur.chantiers` du coordinateur (qui ne contient que les chantiers `ate`)
- Malgré cet écart, le coordinateur n'est pas bloqué : la vérification de couverture des chantiers dans `modificationEstImpossible` ne s'applique qu'au profil Secrétariat Général, pas aux coordinateurs
- Vérification que le bouton "Modifier" EST visible (le coordinateur peut modifier)
- Vérification qu'aucun bandeau de restriction n'est affiché

### Test 3 : Coordinateur Département — Périmètre le plus restreint

Profil : `coordinateur.departement@example.com` (COORDINATEUR_DEPARTEMENT, territoires: DEPT-56, DEPT-29, DEPT-35, DEPT-22)

**Page listing — vérification du périmètre réduit :**

- Accès à la page listing
- Vérification que la colonne "Territoire" n'est PAS visible
- Vérification que seuls 3 profils apparaissent dans le filtre "Profil" : Préfet de département, Services déconcentrés départementaux, Coordinateur PILOTE départemental
- Vérification que les profils régionaux (Préfet de région, Services déconcentrés régionaux, Coordinateur PILOTE régional) ne sont PAS dans le filtre
- Vérification du nombre d'utilisateurs visibles (restreint aux utilisateurs départementaux du périmètre)

**Fiche détail — utilisateur modifiable (PREFET_DEPARTEMENT) :**

- Navigation vers `prefet.departement@example.com`
- Vérification que le bouton "Modifier" est visible
- Vérification que le lien "Désactiver le compte" est visible

**Fiche détail — utilisateur modifiable (SERVICES_DECONCENTRES_DEPARTEMENT) :**

- Navigation vers `services.deconcentres.departement@example.com`
- Vérification que le bouton "Modifier" est visible
- Vérification que le lien "Désactiver le compte" est visible

**Fiche détail — restriction : profil coordinateur non modifiable (soi-même) :**

- Navigation vers sa propre fiche (`coordinateur.departement@example.com`)
- Le coordinateur département ne peut pas modifier un autre coordinateur (même soi-même)
- Vérification du bandeau de restriction : "Ce compte a un profil de coordinateur PILOTE. Vous ne pouvez le modifier ou le désactiver."
- Vérification que le bouton "Modifier" est absent
- Vérification que le lien "Désactiver le compte" est absent

### Test 4 : Secrétariat Général — Gestion par périmètre de chantiers

Profil : `secretariat.general@example.com` (SECRETARIAT_GENERAL, chantiers: CH-070, CH-071, CH-067)

**Page listing :**

- Accès à la page listing
- Vérification que la colonne "Territoire" n'est PAS visible
- Vérification que le bouton "Créer un compte" mène vers `/admin/utilisateur/creer/aide` (page d'aide, pas l'accès direct)
- Vérification que seuls 2 profils apparaissent dans le filtre "Profil" : Services déconcentrés régionaux, Services déconcentrés départementaux
- Vérification que les profils Préfet, Coordinateur, DITP, etc. ne sont PAS dans le filtre
- Vérification que les utilisateurs affichés correspondent au périmètre de chantiers du secrétariat général

**Listing — utilisateurs visibles :**

- Vérification que `services.deconcentres.region@example.com` et `services.deconcentres.departement@example.com` sont visibles
- Vérification que `ditp.admin@example.com` et `prefet.region@example.com` ne sont PAS visibles

**Fiche détail — restriction chantiers (toujours présente pour SG) :**

- Les profils SD ont `a_acces_tous_chantiers_territorialises=true` → leur `lecture.chantiers` inclut TOUS les chantiers territorialisés par défaut
- Le SG ne couvre qu'un sous-ensemble de chantiers (`gestionUtilisateur.chantiers` = CH-070, CH-071, CH-067) → la vérification `every()` échoue systématiquement
- Navigation vers `services.deconcentres.region@example.com`
- Vérification du bandeau de restriction : "Ce compte a des droits d'accès sur plusieurs chantiers. Vous ne pouvez pas modifier ses droits ou désactiver l'utilisateur."
- Vérification que le bouton "Modifier" est absent
- Vérification que le lien "Désactiver le compte" est absent
- Vérification que le bouton "Générer un token" n'est PAS visible

### Test 5 : Profils sans droit de gestion — Accès refusé

**5a. Préfet de région :**
Profil : `prefet.region@example.com` (PREFET_REGION)

- Vérification que le lien "Gestion des comptes" n'est PAS visible dans la navigation
- Tentative d'accès direct à `/admin/utilisateurs` : vérification de la redirection vers la page d'accueil

**5b. Équipe direction de projet :**
Profil : `equipe.dir.projet@example.com` (EQUIPE_DIR_PROJET)

- Vérification que le lien "Gestion des comptes" n'est PAS visible dans la navigation
- Tentative d'accès direct à `/admin/utilisateurs` : vérification de la redirection vers la page d'accueil

**5c. Préfet de département :**
Profil : `prefet.departement@example.com` (PREFET_DEPARTEMENT)

- Vérification que le lien "Gestion des comptes" n'est PAS visible dans la navigation
- Tentative d'accès direct à `/admin/utilisateurs` : vérification de la redirection vers la page d'accueil

### Test 6 : Désactivation et réactivation d'un compte

Profil : `ditp.admin@example.com` (DITP_ADMIN)

- Navigation vers la fiche d'un utilisateur actif
- Vérification que l'utilisateur est affiché comme actif (pas de badge "Désactivé")
- Clic sur "Désactiver le compte" : ouverture de la modale de confirmation "Désactivation de compte"
- Vérification du message de la modale : "Vous êtes sur le point de désactiver le compte de [PRÉNOM] [NOM]."
- Confirmation de la désactivation
- Vérification du retour sur la page listing avec le message de succès "Le compte a bien été désactivé."
- Retour sur la fiche de l'utilisateur : vérification du badge "Désactivé depuis le [DATE]"
- Vérification que le bouton "Modifier" est absent (compte désactivé)
- Vérification que le bouton "Réactiver le compte" est visible
- Clic sur "Réactiver le compte" : ouverture de la modale "Réactivation de compte"
- Vérification du message : "Vous êtes sur le point de réactiver le compte de [PRÉNOM] [NOM]. Un message de réinitialisation de mot de passe lui sera transmis automatiquement."
- Confirmation de la réactivation
- Vérification du retour sur la page listing avec le message "Bravo, le compte a bien été réactivé !"
- Retour sur la fiche : vérification que l'utilisateur est de nouveau actif, bouton "Modifier" visible

### Test 7 : Filtres de la page listing

Profil : `ditp.admin@example.com` (DITP_ADMIN) — pour avoir la visibilité complète sur tous les utilisateurs

**Filtre par statut — comptes actifs :**

- Clic sur le tag "Comptes actifs" : vérification que `ditp.admin@example.com` est visible
- Retour au filtre "Tous"

**Filtre par statut — comptes désactivés :**

- Clic sur le tag "Comptes désactivés" : vérification que `ditp.admin@example.com` n'est PAS visible (aucun compte désactivé)
- Retour au filtre "Tous"

**Recherche textuelle :**

- Saisie de "coordinateur" dans la barre de recherche
- Vérification que `coordinateur.region@example.com` et `coordinateur.departement@example.com` sont visibles
- Vérification que `ditp.admin@example.com` n'est PAS visible (ne correspond pas à la recherche)
- Effacement de la recherche

**Filtre par profil :**

- Sélection de "Préfet de département et collaborateurs" dans le filtre profil
- Vérification que `prefet.departement@example.com` est visible
- Vérification que `ditp.admin@example.com` et `coordinateur.region@example.com` ne sont PAS visibles
- Réinitialisation des filtres

**Réinitialisation avec filtres combinés :**

- Application simultanée d'un filtre profil ("Coordinateur PILOTE régional") et d'une recherche textuelle ("coordinateur")
- Clic sur "Réinitialiser les filtres"
- Vérification que tous les filtres sont effacés et la liste complète est restaurée (`ditp.admin@example.com` visible)

### Test 8 : Restriction multi-territoires — Coordinateur face à un utilisateur hors périmètre

Profil connecté : `coordinateur.region@example.com` (COORDINATEUR_REGION, territoires : REG-53, DEPT-56, DEPT-29, DEPT-35, DEPT-22)

Utilisateur cible : `prefet.multi.territoires@example.com` (PREFET_DEPARTEMENT, territoires : DEPT-56, DEPT-75)

- DEPT-56 est dans le périmètre Bretagne du coordinateur → l'utilisateur apparaît dans le listing
- DEPT-75 (Paris) est hors périmètre → l'utilisateur n'est PAS modifiable

**Listing :**

- Vérification que `prefet.multi.territoires@example.com` est visible dans le tableau (au moins un territoire en commun)

**Fiche détail — restriction multi-territoires :**

- Navigation vers la fiche de `prefet.multi.territoires@example.com`
- Vérification du bandeau de restriction : "Ce compte a des droits d'accès sur plusieurs territoires. Vous ne pouvez pas modifier ses droits ou désactiver l'utilisateur."
- Vérification que le bouton "Modifier" est absent
- Vérification que le lien "Désactiver le compte" est absent

---

### Matrice de visibilité et droits dans le listing par profil connecté

Légende : ✓ modifiable | 🔒 bandeau restriction | — non visible | ✗ pas d'accès à la page

| Utilisateur dans le listing       |      DITP Admin       |   Coord. Région   |    Coord. Dept    |   Sec. Général    | Préfet Région |
|-----------------------------------|:---------------------:|:-----------------:|:-----------------:|:-----------------:|:-------------:|
| **Accès au listing**              |           ✓           |         ✓         |         ✓         |         ✓         |       ✗       |
| **Colonne Territoire**            |        visible        |      masquée      |      masquée      |      masquée      |       —       |
| **Bouton Créer un compte**        |       `/creer`        |   `/creer/aide`   |   `/creer/aide`   |   `/creer/aide`   |       —       |
| prefet.region                     |           ✓           |         ✓         |         —         |         —         |       —       |
| prefet.departement                |           ✓           |         ✓         |         ✓         |         —         |       —       |
| services.deconcentres.region      |           ✓           |         ✓         |         —         | 🔒 bandeau chant. |       —       |
| services.deconcentres.departement |           ✓           |         ✓         |         ✓         | 🔒 bandeau chant. |       —       |
| coordinateur.departement          |           ✓           | 🔒 bandeau coord. | 🔒 bandeau coord. |         —         |       —       |
| coordinateur.region               |           ✓           | 🔒 bandeau coord. |         —         |         —         |       —       |
| prefet.multi.territoires          |           ✓           | 🔒 bandeau terr.  |         —         |         —         |       —       |
| services.dec.hors-ate             |           ✓           |         ✓         |         —         |         —         |       —       |
| ditp.admin                        |           ✓           |         —         |         —         |         —         |       —       |
| ditp.pilotage                     |           ✓           |         —         |         —         |         —         |       —       |
| equipe.dir.projet                 |           ✓           |         —         |         —         |         —         |       —       |
| secretariat.general               |           ✓           |         —         |         —         |         —         |       —       |
| **Token API (bouton visible)**    | ✓ (profils éligibles) |         ✗         |         ✗         |         ✗         |       —       |

---

## 8. Création / modification des comptes utilisateurs

**Fichier :** `tests/admin-gestion-utilisateurs-formulaire.spec.ts`

### Test 1 : Validation des champs obligatoires Service et Fonction

Profil : `ditp.admin@example.com` (DITP_ADMIN)

**Création — champs manquants :**

- Navigation vers la page de création d'un compte (`/admin/utilisateur/creer`)
- Remplissage des champs email, nom, prénom, profil mais sans service ni fonction
- Clic sur "Suivant" : vérification que la soumission est bloquée avec les erreurs de validation sur Service et Fonction

**Création — champs remplis :**

- Remplissage du champ Fonction et sélection d'un Service
- Clic sur "Suivant" : vérification que la soumission passe (pas d'erreur de validation)

### Test 2 : Validation à la modification et modale "Complétez votre profil"

Profils : `coordinateur.region@example.com` (COORDINATEUR_REGION) et `ditp.admin@example.com` (DITP_ADMIN)

**Modale présente avant complétion :**

- Connexion en tant que coordinateur régional (sans service ni fonction)
- Vérification que la modale "Complétez votre profil" apparaît

**Modification via l'admin :**

- Switch vers DITP Admin
- Navigation vers la fiche du coordinateur et clic sur "Modifier"
- Clic sur "Suivant" : vérification que les erreurs de validation apparaissent sur Service et Fonction
- Remplissage du champ Fonction et sélection d'un Service
- Clic sur "Suivant" : vérification que les erreurs disparaissent

**Modale absente après complétion :**

- Re-connexion en tant que coordinateur régional
- Vérification que la modale "Complétez votre profil" ne réapparaît plus

---

## 9. Gestion des paramètres des indicateurs — Listing

**Fichier :** `tests/admin-indicateurs-listing.spec.ts`

Page accessible uniquement aux profils DITP_ADMIN. Affiche un tableau paginé des metadata indicateurs avec des filtres dans une barre latérale.

### Test 1 : Structure de la page et fonctionnalités principales

Profil : `ditp.admin@example.com` (DITP_ADMIN)

**Accès et structure :**

- Connexion en tant que DITP Admin et navigation vers `/admin/indicateurs`
- Vérification du titre de la page : "Gestion des paramètres des indicateurs"
- Vérification de la structure du tableau : présence des 6 colonnes (Chantier associé, Nom du chantier, Identifiant indicateur, Nom de l'indicateur, Dernière modification, Actif / Inactif)
- Vérification de la présence du bouton "Créer un indicateur"
- Vérification de la présence du bouton d'export

**Pagination :**

- Vérification que la pagination est visible (plus de 20 indicateurs)
- Vérification que la première page affiche 20 lignes
- Navigation vers la page suivante : vérification que le nombre de lignes correspond au reste des indicateurs
- Retour à la page 1

**Recherche textuelle :**

- Saisie de "IND-021" dans la barre de recherche
- Vérification que IND-021 apparaît dans le tableau
- Vérification que la pagination disparaît (résultat unique)
- Effacement de la recherche : retour au nombre initial d'indicateurs avec pagination

**Filtre par indicateurs territorialisés :**

- Activation du toggle "Indicateurs territorialisés" dans la barre latérale
- Vérification que le nombre d'indicateurs est inférieur ou égal au total
- Vérification que le tag de filtre actif "Indicateurs territorialisés" est visible
- Réinitialisation des filtres : retour au nombre initial

**Filtre par indicateurs du baromètre :**

- Activation du toggle "Indicateurs du baromètre" dans la barre latérale
- Vérification que le nombre d'indicateurs est inférieur ou égal au total
- Vérification que le tag de filtre actif "Indicateurs du baromètre" est visible
- Réinitialisation des filtres : retour au nombre initial

**Navigation vers le détail :**

- Clic sur un indicateur (IND-021) dans le tableau
- Vérification de la redirection vers `/admin/indicateurs/IND-021`

### Test 2 : Accès refusé aux profils non DITP_ADMIN

**Coordinateur région** (`coordinateur.region@example.com`) :

- Vérification que le lien "Indicateurs des chantiers" n'est PAS visible dans la navigation
- Tentative d'accès direct à `/admin/indicateurs` : vérification que l'URL ne reste pas sur `/admin/indicateurs`

**Équipe direction de projet** (`equipe.dir.projet@example.com`) :

- Vérification que le lien "Indicateurs des chantiers" n'est PAS visible dans la navigation
- Tentative d'accès direct à `/admin/indicateurs` : vérification que l'URL ne reste pas sur `/admin/indicateurs`

---

## 10. Gestion des paramètres des indicateurs — Formulaire

**Fichier :** `tests/admin-indicateurs-formulaire.spec.ts`

Page accessible uniquement aux profils DITP_ADMIN. Affiche la fiche détaillée d'un indicateur avec 3 modes : consultation (lecture seule), modification et création.

### Test 1 : Consultation et modification d'un indicateur existant

Profil : `ditp.admin@example.com` (DITP_ADMIN)

**Accès et structure :**

- Connexion en tant que DITP Admin et navigation vers `/admin/indicateurs/IND-021`
- Vérification du titre : "Fiche de l'indicateur IND-021"
- Vérification du lien "Retour" vers le listing
- Vérification du sélecteur Actif/Inactif
- Vérification du tableau récapitulatif avec les 6 colonnes (Chantier associé, Nom du chantier, Identifiant indicateur, Nom de l'indicateur, Création de l'indicateur, Dernière modification)

**Structure des accordéons :**

- Vérification que l'accordéon "Identité indicateur" est ouvert par défaut
- Vérification que l'accordéon "Paramétrages" est fermé par défaut
- Vérification que l'accordéon "Autres informations" est fermé par défaut

**Mode consultation :**

- Vérification que le bouton "Modifier" est visible
- Vérification que les boutons "Confirmer les changements" et "Annuler" ne sont pas visibles
- Vérification que les données de l'indicateur sont affichées (CH-129, IND-021)

**Section Paramétrages :**

- Ouverture de l'accordéon Paramétrages
- Vérification des sections : Maille départementale, Maille régionale, Maille nationale, Pondération

**Mode modification :**

- Clic sur "Modifier" : passage en mode modification
- Vérification que "Confirmer les changements" et "Annuler" sont visibles, "Modifier" masqué
- Clic sur "Annuler" : retour au mode consultation

**Soumission des modifications :**

- Passage en mode modification et soumission via "Confirmer les changements"
- Vérification de l'alerte de succès : "Bravo, l'indicateur a bien été modifié !"
- Vérification du retour au mode consultation

**Retour au listing :**

- Clic sur le lien "Retour" : vérification de la redirection vers `/admin/indicateurs`

### Test 2 : Règles d'activation/désactivation — Mailles départementale, régionale et nationale

Profil : `ditp.admin@example.com` (DITP_ADMIN)

Indicateur cible : IND-021 (seed : vi_dept_from=user_input, vi_reg_from=DEPT, vi_nat_from=DEPT)

**Maille départementale :**

- vi_dept_from=user_input → vi_dept_op est désactivé (règle : `_` ou `user_input` désactive l'op)
- Changement de vi_dept_from en `sub_indic` → vi_dept_op devient activé
- Retour de vi_dept_from en `user_input` → vi_dept_op redevient désactivé
- va_dept_from=user_input → va_dept_op est désactivé

**Maille régionale :**

- vi_reg_from=DEPT → vi_reg_op=sum est activé
- Changement de vi_reg_from en `user_input` → vi_reg_op se désactive
- Retour de vi_reg_from en `DEPT` → vi_reg_op se réactive

**Maille nationale :**

- vi_nat_from=DEPT → vi_nat_op est activé
- Changement de vi_nat_from en `_` → vi_nat_op se désactive

### Test 3 : Règles du calcul de la valeur d'avancement

Profil : `ditp.admin@example.com` (DITP_ADMIN)

Indicateur cible : IND-021 (seed : param_vaca_partition_date=from_year_start, param_vaca_op=sum)

- param_vaca_op et param_vacg_op sont toujours désactivés (non éditables)
- Valeurs initiales : partition_date=from_year_start, op=sum (TA annuel et TA global synchronisés)
- Changement partition_date TA annuel en `_` → op passe à `current_value`, et les champs TA global se synchronisent
- Changement partition_date TA global en `from_year_start` → op revient à `sum`, TA annuel se synchronise
- Synchronisation des décumul_from entre TA annuel et TA global

### Test 4 : Pondération — Désactivation quand non territorialisé

Profil : `ditp.admin@example.com` (DITP_ADMIN)

Indicateur cible : IND-021 (territorialisé=true)

- poidsPourcentDept et poidsPourcentReg sont activés quand l'indicateur est territorialisé
- Désactivation du switch "Territorialisation" → poidsPourcentDept et poidsPourcentReg se désactivent

### Test 5 : Formulaire en mode création

Profil : `ditp.admin@example.com` (DITP_ADMIN)

- Navigation vers `/admin/indicateurs/IND-999?_action=creer-indicateur`
- Vérification du titre : "Fiche de l'indicateur IND-999"
- Vérification du mode création : bouton "Créer l'indicateur" visible, "Modifier" et "Confirmer les changements" absents
- Vérification de la structure : sélecteur Actif/Inactif, accordéons avec l'identité ouvert

### Test 6 : Navigation listing vers fiche et retour

Profil : `ditp.admin@example.com` (DITP_ADMIN)

- Connexion et accès au listing des indicateurs
- Recherche et navigation vers IND-021
- Vérification de la fiche affichée
- Retour au listing via le lien "Retour"

### Test 7 : Accès refusé à la fiche indicateur pour les profils non DITP_ADMIN

**Coordinateur région** (`coordinateur.region@example.com`) :

- Tentative d'accès direct à `/admin/indicateurs/IND-021` : vérification que l'URL ne reste pas sur la fiche

**Équipe direction de projet** (`equipe.dir.projet@example.com`) :

- Tentative d'accès direct à `/admin/indicateurs/IND-021` : vérification que l'URL ne reste pas sur la fiche

---

## 11. Mon profil utilisateur

**Fichier :** `tests/mon-profil-utilisateur.spec.ts`

**Structure de la page :**

- Connexion et navigation vers la page "Mon profil utilisateur"
- Vérification du titre "Mon profil utilisateur"
- Vérification de la section "Identification" avec la mention "Tous les champs sont obligatoires."
- Vérification de la présence des champs du formulaire : Adresse électronique, Prénom, Nom, Service, Fonction
- Vérification que le champ "Adresse électronique" est désactivé (lecture seule)
- Vérification que les champs Prénom, Nom et Fonction sont pré-remplis avec les données de l'utilisateur connecté
- Vérification de la présence du bouton "Enregistrer"
- Vérification que la mention "Modifié le JJ/MM/AAAA à HH:MM" est affichée sous le bouton "Enregistrer"

**Sélection du service "Autre" :**

- Sélection de "Autre" dans le champ "Service"
- Vérification que le champ "Précisez votre service" apparaît
- Vérification du message d'aide : "Afin de nous aider à compléter cette liste, merci de nous indiquer votre rattachement. Cette information ne sera pas publiée dans un premier temps."

**Modification du profil :**

- Modification du champ "Fonction" et soumission du formulaire
- Vérification de l'alerte de succès : "Vos informations ont été modifiées avec succès"
- Vérification que la date de modification est mise à jour après l'enregistrement

**Isolation entre utilisateurs :**

- Connexion avec un autre profil et navigation vers "Mon profil utilisateur"
- Vérification que les informations affichées correspondent bien à ce second utilisateur et n'ont pas été impactées par la modification précédente

## Matrice profils × tests

Légende : ✓ = profil utilisé dans ce test

| Test                                    | DITP Admin | PM Cabinet | Coord. Rég. | Coord. Dept | Sec. Gén. | Préfet Rég. | Préfet Dept | Éq. Dir. Projet |
|-----------------------------------------|:----------:|:----------:|:-----------:|:-----------:|:---------:|:-----------:|:-----------:|:---------------:|
| 1. Login                                |     ✓      |            |             |             |           |             |             |                 |
| 2. Chantier - Accès complet             |     ✓      |            |             |             |           |             |             |                 |
| 2. Chantier - Lecture seule             |            |     ✓      |             |             |           |             |             |                 |
| 2. Chantier - Périmètre chantier        |            |            |             |             |           |             |             |        ✓        |
| 2. Chantier - Territoire dept (écriture)|            |            |             |      ✓      |           |             |             |                 |
| 2. Chantier - Territoire rég. (écriture)|            |            |             |             |           |      ✓      |             |                 |
| 2. Chantier - Dept sans hab. chantier   |            |            |             |      ✓      |           |             |             |                 |
| 2. Chantier - Rég. sans hab. chantier   |            |            |             |             |           |      ✓      |             |                 |
| 3. Import données                       |     ✓      |            |             |             |           |             |             |                 |
| 4.1 Export CSV chantiers                |     ✓      |            |             |             |           |             |             |                 |
| 4.2 Export CSV indicateurs              |     ✓      |            |             |             |           |             |             |                 |
| 4.3 Export CSV historique               |     ✓      |            |             |             |           |             |             |                 |
| 4.4 Export CSV utilisateurs             |     ✓      |            |             |             |           |             |             |                 |
| 5. PVA - Création/acceptation           |            |            |             |      ✓      |           |             |             |        ✓        |
| 5. PVA - Refus                          |            |            |             |             |           |             |      ✓      |        ✓        |
| 5. PVA - Acceptation modifiée           |            |            |             |      ✓      |           |             |             |        ✓        |
| 5. PVA - Modif/suppression              |            |            |             |      ✓      |           |             |             |                 |
| 5. PVA - Blocage maille                 |            |            |      ✓      |             |           |             |             |                 |
| 5. PVA - Dir. projet (décisions)        |            |            |             |             |           |             |             |        ✓        |
| 6. API                                  |     ✓      |            |             |             |           |             |             |        ✓        |
| 7.1 Gestion - Vue admin + token         |     ✓      |            |             |             |           |             |             |                 |
| 7.2 Gestion - Visibilité + restrictions |            |            |      ✓      |             |           |             |             |                 |
| 7.3 Gestion - Périmètre restreint       |            |            |             |      ✓      |           |             |             |                 |
| 7.4 Gestion - Par chantiers             |            |            |             |             |     ✓     |             |             |                 |
| 7.5 Gestion - Accès refusé              |            |            |             |             |           |      ✓      |      ✓      |        ✓        |
| 7.6 Gestion - Désactiver/réactiver      |     ✓      |            |             |             |           |             |             |                 |
| 7.7 Gestion - Filtres                   |     ✓      |            |             |             |           |             |             |                 |
| 7.8 Gestion - Multi-territoires         |            |            |      ✓      |             |           |             |             |                 |
| 8. Création/modif - Validation          |     ✓      |            |             |             |           |             |             |                 |
| 9. Indicateurs - Listing                |     ✓      |            |      ✓      |             |           |             |             |        ✓        |
| 10. Indicateurs - Formulaire            |     ✓      |            |      ✓      |             |           |             |             |        ✓        |
| 11. Mon profil utilisateur              |     ✓      |            |      ✓      |             |           |             |             |                 |

**Identifiants des profils :**

| Abréviation       | Email                                                                     |
|-------------------|---------------------------------------------------------------------------|
| DITP Admin        | `ditp.admin@example.com`                                                  |
| PM Cabinet        | `premiere.ministre@example.com`                                           |
| Coord. Rég.       | `coordinateur.region@example.com`                                         |
| Coord. Dept       | `coordinateur.departement@example.com`                                    |
| Sec. Gén.         | `secretariat.general@example.com`                                         |
| Préfet Rég.       | `prefet.region@example.com`                                               |
| Préfet Dept       | `prefet.departement@example.com`                                          |
| Préfet Multi-terr | `prefet.multi.territoires@example.com`                                    |
| SD Hors ATE       | `services.deconcentres.hors-ate@example.com`                              |
| Éq. Dir. Projet   | `equipe.dir.projet@example.com` (API) / `pva.dir.projet@example.com` (UI) |
| Coord. Rég. (PVA) | `pva.coordinateur.reg@example.com`                                        |
| Coord. Dept (PVA) | `pva.coordinateur.dept@example.com`                                       |
| Préfet Dept (PVA) | `pva.prefet.dept@example.com`                                             |
| Préfet Rég. (CH)  | `chantier.prefet.reg@example.com`                                         |
