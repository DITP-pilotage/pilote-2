# Couverture des tests E2E

Ce document recense l'ensemble des scénarios couverts par les tests end-to-end (Playwright) du projet PILOTE.

---

## 1. Authentification et connexion

**Fichier :** `tests/login.spec.ts`

- Accès à la page d'accueil (landing page) sans authentification
- Connexion avec les identifiants de test : vérification que l'utilisateur est bien connecté (bouton "Mon espace" visible dans le header)

---

## 2. Consultation des données d'un chantier

**Fichier :** `tests/information-chantier.spec.ts`

- Vérification de la structure de la page d'accueil : présence du tableau des chantiers, taux d'avancement, avancement territorial, répartition météo
- Application d'un filtre par ministère ("Transition écologique et Cohésion des territoires") et vérification des tags de filtre actifs ("Logement", "Transition Écologique")
- Navigation vers un chantier depuis le tableau (chantier 155 - "Faciliter l'efficacité opérationnelle")
- Vérification de la structure complète de la page chantier :
  - Avancement du chantier, Responsables, Min/Médiane/Max
  - Météo et synthèse des résultats, Répartition géographique
  - Objectifs (Notre ambition, Ce qui a déjà été fait, Ce qui reste à faire)
  - Indicateurs (5), Décisions stratégiques, Commentaires du chantier
  - Risques et freins, Solutions et actions, Exemples de réussite
- Vérification de l'historique des commentaires au niveau national (NAT-FR) : édition d'un commentaire, publication, vérification dans la modale d'historique
- Navigation vers un territoire régional (REG-76 Occitanie) et vérification de l'historique des commentaires sur les données au niveau territorial

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

## 8. Gestion des paramètres des indicateurs — Listing

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

---

## Matrice profils × tests

Légende : ✓ = profil utilisé dans ce test

| Test                                    | DITP Admin | Coord. Rég. | Coord. Dept | Sec. Gén. | Préfet Rég. | Préfet Dept | Éq. Dir. Projet | Coord. Rég. (PVA) | Coord. Dept (PVA) | Préfet Dept (PVA) |
|-----------------------------------------|:----------:|:-----------:|:-----------:|:---------:|:-----------:|:-----------:|:---------------:|:-----------------:|:-----------------:|:-----------------:|
| 1. Login                                |     ✓      |             |             |           |             |             |                 |                   |                   |                   |
| 2. Consultation chantier                |     ✓      |             |             |           |             |             |                 |                   |                   |                   |
| 3. Import données                       |     ✓      |             |             |           |             |             |                 |                   |                   |                   |
| 4.1 Export CSV chantiers                |     ✓      |             |             |           |             |             |                 |                   |                   |                   |
| 4.2 Export CSV indicateurs              |     ✓      |             |             |           |             |             |                 |                   |                   |                   |
| 4.3 Export CSV historique               |     ✓      |             |             |           |             |             |                 |                   |                   |                   |
| 4.4 Export CSV utilisateurs             |     ✓      |             |             |           |             |             |                 |                   |                   |                   |
| 5. PVA - Création/acceptation           |            |             |             |           |             |             |                 |                   |         ✓         |                   |
| 5. PVA - Refus                          |            |             |             |           |             |             |                 |                   |                   |         ✓         |
| 5. PVA - Acceptation modifiée           |            |             |             |           |             |             |                 |                   |         ✓         |                   |
| 5. PVA - Modif/suppression              |            |             |             |           |             |             |                 |                   |         ✓         |                   |
| 5. PVA - Blocage maille                 |            |             |             |           |             |             |                 |         ✓         |                   |                   |
| 5. PVA - Dir. projet (décisions)        |            |             |             |           |             |             |        ✓        |                   |                   |                   |
| 6. API                                  |     ✓      |             |             |           |             |             |        ✓        |                   |                   |                   |
| 7.1 Gestion - Vue admin + token         |     ✓      |             |             |           |             |             |                 |                   |                   |                   |
| 7.2 Gestion - Visibilité + restrictions |            |      ✓      |             |           |             |             |                 |                   |                   |                   |
| 7.3 Gestion - Périmètre restreint       |            |             |      ✓      |           |             |             |                 |                   |                   |                   |
| 7.4 Gestion - Par chantiers             |            |             |             |     ✓     |             |             |                 |                   |                   |                   |
| 7.5 Gestion - Accès refusé              |            |             |             |           |      ✓      |      ✓      |        ✓        |                   |                   |                   |
| 7.6 Gestion - Désactiver/réactiver      |     ✓      |             |             |           |             |             |                 |                   |                   |                   |
| 7.7 Gestion - Filtres                   |     ✓      |             |             |           |             |             |                 |                   |                   |                   |
| 7.8 Gestion - Multi-territoires         |            |      ✓      |             |           |             |             |                 |                   |                   |                   |
| 8. Indicateurs - Listing                |     ✓      |             |             |           |             |             |                 |                   |                   |                   |

**Identifiants des profils :**

| Abréviation       | Email                                                                     |
|-------------------|---------------------------------------------------------------------------|
| DITP Admin        | `ditp.admin@example.com`                                                  |
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
