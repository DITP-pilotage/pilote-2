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

## Profils utilisateurs testés

| Profil | Identifiant | Tests concernés |
|--------|-------------|-----------------|
| DITP Admin | `ditp.admin@example.com` | Connexion, consultation chantier, import données, exports CSV, authentification API |
| Coordinateur département | `pva.coordinateur.dept@example.com` | PVA (proposer, modifier, supprimer) |
| Préfet département | `pva.prefet.dept@example.com` | PVA (proposer / refus) |
| Coordinateur région | `pva.coordinateur.reg@example.com` | PVA (blocage maille agrégée) |
| Équipe direction de projet | `pva.dir.projet@example.com` (UI) / `equipe.dir.projet@example.com` (API) | PVA (accuser réception, accepter, refuser), tous les tests API |
