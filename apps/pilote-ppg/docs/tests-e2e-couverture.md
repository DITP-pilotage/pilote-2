# Couverture des tests E2E

Ce document recense les scénarios couverts par les tests end-to-end (Playwright) de pilote-ppg (`apps/pilote-ppg/tests`). Il décrit ce que les specs vérifient réellement : en cas de doute, le code du spec fait foi.

## Données et outillage

**Seed :** `tests/seed/seed.sh` est lancé par le `globalSetup` (`tests/global-setup.ts`) avant chaque exécution. Il vide les schémas `public` et `raw_data`, rejoue les migrations (`prisma migrate deploy`) puis `prisma db seed`, et charge les comptes de test (`utilisateurs-test.sql`), les métadonnées d'indicateurs et les CSV de `raw_data/` et `public/`. Garde-fous : il refuse de tourner sans `E2E_SEED_AUTORISE=true` dans `.env.e2e`, ou si `DATABASE_URL` ne pointe pas sur une base locale.

**Entités dédiées :** `tests/seed/seed-dedicated-entities.sql` (constantes dans `tests/seed/dedicated-entities.ts`) crée, en dernier, des copies réservées aux tests qui écrivent, pour ne jamais modifier les données partagées :

| Entité  | Origine            | Usage                                                                                     |
|---------|--------------------|-------------------------------------------------------------------------------------------|
| CH-901  | copie de CH-070    | chantier en `BROUILLON` (« Chantier brouillon e2e »)                                      |
| CH-902  | copie de CH-054    | chantier d'écriture « Chantier e2e » : open-api, import, indicateurs, paramétrage chantier (métadonnées copiées de CH-129, maille DEPT) |
| CH-903  | copie de CH-129    | chantier de la saisie des publications par l'IHM (« Chantier e2e saisie »)                |
| CH-904  | copie de CH-054    | chantier des pondérations « Chantier e2e pondérations » (métadonnées copiées de CH-129, maille DEPT) : l'enregistrement des pondérations écrit tous les indicateurs du chantier, il ne porte donc qu'IND-904 |
| IND-901 | copie d'IND-021    | import de données par l'IHM (rattaché à CH-902)                                            |
| IND-902 | copie d'IND-021    | formulaire indicateur du panel administrateur (rattaché à CH-902)                          |
| IND-903 | copie d'IND-021    | import open-api (rattaché à CH-902)                                                        |
| IND-904 | copie d'IND-021    | pondérations du paramétrage chantier (rattaché à CH-904)                                   |

Habilitations ajoutées : `equipe.dir.projet@example.com` reçoit CH-901, CH-902 et CH-903 ; `services.deconcentres.region@example.com` reçoit CH-901 (sans accès aux brouillons). Deux comptes sont créés pour la saisie sur CH-903 / DEPT-56 : `saisie.coordinateur.dept@example.com` (COORDINATEUR_DEPARTEMENT) et `saisie.prefet.dept@example.com` (PREFET_DEPARTEMENT), tous deux avec lecture et saisie des commentaires sur CH-903 / DEPT-56. Le chantier hors périmètre de l'équipe direction de projet est CH-070.

**Nettoyage :** la fixture `e2eContext` (`tests/e2e-test-context.ts`) enregistre chaque écriture (`track`) et la défait en fin de test : suppression des commentaires, synthèses, objectifs, décisions, événements PVA, rapports d'import et mesures, comptes et tokens créés, accès à l'assistant ; restauration des métadonnées d'indicateur et de chantier, des profils modifiés et des comptes désactivés.

**Connexion :** `AppActions.loginAs` (`tests/actions/app.actions.ts`) se connecte par l'API NextAuth (provider credentials), sans passer par les écrans ; le parcours complet par formulaire est couvert par `loginViaFormulaire`. Sans email, le compte utilisé est `E2E_USERNAME` (`ditp.admin@example.com`).

**Client tRPC direct :** `tests/api-client/trpc.client.ts` appelle `/api/trpc/*` sans passer par l'IHM, avec la session du navigateur. Les mutations envoient le jeton CSRF lu dans le cookie `csrf` (ou aucun / un jeton forcé). Le résultat expose le statut HTTP, le code d'erreur tRPC et l'en-tête `location`.

**Fixtures open-api** (`tests/fixtures.ts`) :
- `openApi(profil)` forge un JWT pour `DITP_ADMIN` (`ditp.admin`), `EQUIPE_DIR_PROJET` (`equipe.dir.projet`) ou `PM_ET_CABINET` (`premiere.ministre`), et crée si besoin la ligne `token_api_information` correspondante ;
- `openApiUnauthenticated(header)` crée un client sans en-tête `Authorization`, ou avec l'en-tête fourni.

## Navigateurs et lancement

- **Chromium** exécute tous les specs.
- **Firefox** puis **WebKit** exécutent les specs IHM, à la suite de Chromium (dépendances de projets : les trois partagent la même base seedée et n'écrivent jamais en parallèle).
- Les specs sans IHM ne tournent que sur Chromium (`NON_UI_SPECS` dans `apps/pilote-ppg/playwright.config.ts`) : `api-autorisation.spec.ts`, `open-api/**`, `export-csv-cloisonnement.spec.ts`, `gardes-panel-admin.spec.ts`.
- Lancement : `pnpm test:e2e` (vidéo désactivée ; `E2E_VIDEO=on` l'active).

---

## 1. Connexion

### 1.1 Landing page et connexion par formulaire

**Fichier :** `tests/login.spec.ts`

- **Landing page** (sans session) : `/` affiche le lien « Se connecter » dans l'en-tête.
- **Connexion par formulaire** (`ditp.admin@example.com`) : landing → « Se connecter » → écran de choix → bouton « identifiants PILOTE » → saisie identifiant / mot de passe → le bouton « Mon espace » est visible dans l'en-tête.

### 1.2 Écran de choix du mode de connexion

**Fichier :** `tests/connexion.spec.ts`

Tous les tests sont sans session.

- Le lien « Se connecter » de la landing mène à `/connexion`, qui affiche le titre « Connexion à PILOTE ».
- `/connexion` propose le bouton « identifiants PILOTE ».
- `/connexion?motif=compte_desactive` affiche une alerte d'erreur contenant « désactivé », le lien `pilote.ditp@modernisation.gouv.fr` et toujours le bouton « identifiants PILOTE ».
- `/accueil/chantier/NAT-FR` redirige vers `/connexion?callbackUrl=%2Faccueil%2Fchantier%2FNAT-FR`.

---

## 2. Cloisonnement des accès

### 2.1 Accès hors périmètre par URL

**Fichier :** `tests/acces-hors-perimetre.spec.ts`

- **Chantier sur un département hors périmètre** (`coordinateur.departement`, départements 56/29/35/22) : `GET /chantier/CH-129/DEPT-13` répond 404 et la page affiche le titre « Page non trouvée » / 404.
- **Accueil d'un département hors périmètre** (`coordinateur.departement`) : `/accueil/chantier/DEPT-13` redirige vers `/accueil/chantier/DEPT-56|29|35|22`.
- **Gestion des comptes sans droit** (`prefet.departement`) : `GET /admin/utilisateurs` et `GET /admin/utilisateur/creer` répondent 307 avec `location: /`.

### 2.2 Gardes du panel administrateur

**Fichier :** `tests/gardes-panel-admin.spec.ts`

**Pages réservées à l'administrateur DITP** (`ditp.pilotage`, `coordinateur.region`, `equipe.dir.projet`, un test par profil) : chacune des 21 pages suivantes répond 307 avec `location: /` :

- `/panel-administrateur/albert`, `/chantiers`, `/chantiers/CH-902`, `/gestion-token-api`, `/habilitations-coordinateur`, `/indicateurs`, `/indicateurs/IND-902`, `/message-information`, `/parametrage-metadata-indicateur` ;
- `/panel-administrateur/referentiels/perimetres` (+ `/PER-001`), `/porteurs` (+ `/1`), `/zonegroups` (+ `/ZG-REF`) ;
- `/panel-administrateur/referentiels-deprecies/axes` (+ `/EMPLOI`), `/engagements` (+ `/1`), `/ppgs` (+ `/PPG-1`).

**Procédures tRPC gardées par la seule session** (`coordinateur.region`, client tRPC direct) :

- Lectures `applicationLog.lister` et `gestionContenu.recupererFeatureFlips` : 401 `UnauthorizedError`.
- Mutations `applicationLog.purger`, `gestionContenu.modifierFeatureFlips`, `parametrageNouveautes.creer`, `parametrageCentreAide.creer` : 401 (statut seul, sans vérification en base).

### 2.3 Appels directs à l'API (tRPC et exports)

**Fichier :** `tests/api-autorisation.spec.ts`

**Sans session :**

- Mutation `utilisateur.desactiver` sans jeton CSRF : 303 vers `/connexion?callbackUrl=…`.
- `GET /api/trpc/chantier.recupererTousSynthetisesAccessiblesEnLecture`, `/api/export/chantiers-v2`, `/api/export/utilisateurs` : 303 vers `/connexion?callbackUrl=…` (un test par route).
- `POST /api/albert/chat` : 303 vers `/connexion?callbackUrl=…`.

**Avec session :**

- `ditp.pilotage` lit `chantier.recupererTousSynthetisesAccessiblesEnLecture` : 200, pas d'erreur, liste non vide.

**Gestion des comptes :**

- `coordinateur.departement` crée (`utilisateur.creer`) un compte PREFET_DEPARTEMENT sur DEPT-56 puis le désactive : 200 et 200 ; en base, `date_desactivation` est renseignée.
- `coordinateur.departement` crée un compte sur DEPT-13 : 403 `ForbiddenError` ; le compte n'existe pas en base.
- `prefet.departement` (sans gestion des comptes) crée un compte : 403 `ForbiddenError` ; le compte n'existe pas en base.
- `coordinateur.departement` désactive `premiere.ministre` : 403 `ForbiddenError` ; `date_desactivation` reste nulle.
- `coordinateur.departement` réactive `premiere.ministre` : 403 `ForbiddenError`.
- `ditp.admin` désactive `premiere.ministre` sans jeton CSRF : 400 ; `date_desactivation` reste nulle.
- `ditp.admin` désactive `premiere.ministre` avec un jeton CSRF invalide : 403 `FORBIDDEN` ; `date_desactivation` reste nulle.

**Tokens API :**

- `equipe.dir.projet` appelle `gestionTokenAPI.creerTokenAPI` puis `gestionTokenAPI.supprimerTokenAPI` (un test chacun) pour `ditp.pilotage` : 401 `UnauthorizedError` ; aucun token en base pour `ditp.pilotage`.

**Paramétrage des chantiers** (`coordinateur.region`) :

- Lectures `parametrageChantier.list`, `parametrageChantier.get` et `parametrageChantier.getIndicateursPonderations` (CH-902) : 403 `ForbiddenError` (un test chacune).
- `parametrageChantier.save` sur CH-902 : 403 `ForbiddenError` ; `metadata_chantiers.ch_nom` de CH-902 reste « Chantier e2e » (état restauré par `e2eContext` si la garde régressait).
- `parametrageChantier.savePonderationsIndicateurs` : 403 `ForbiddenError`.

---

## 3. Page d'accueil

**Fichier :** `tests/accueil.spec.ts`

La liste est lue dans les liens d'en-tête de ligne du tableau des chantiers.

- **Directeur de projet** (`equipe.dir.projet`) : la liste vaut exactement CH-051, CH-054, CH-058, CH-062, CH-129, CH-902, CH-903.
- **Profil national** (`premiere.ministre`) : la liste vaut exactement les 16 chantiers publiés (CH-050, 051, 054, 058, 062, 067, 070, 071, 107, 108, 129, 145, 155, 902, 903, 904) ; le titre « 16 chantiers » est visible ; CH-901 (brouillon) n'apparaît pas.
- **Filtre ministère** (`premiere.ministre`) : après le filtre « Intérieur et Outre-mer », le tag de filtre est visible et la liste vaut exactement CH-129, CH-903.

---

## 4. Consultation d'un chantier — Isolation par profil

**Fichier :** `tests/information-chantier.spec.ts` (bloc « Consultation des données d'un chantier — Isolation par profil »)

7 scénarios en lecture seule, exécutés en parallèle. Chantier de référence : CH-129.

**Structure nationale** (vérifiée par `expectStructureNationale`) : titres « Avancement du chantier », « Responsables », « Météo et synthèse des résultats », « Répartition géographique », « Objectifs », « Indicateurs (… », « Décisions stratégiques », « Suivi des décisions stratégiques », « Commentaires du chantier », « Autres résultats obtenus (non corrélés aux indicateurs) », « Risques et freins à lever », « Solutions et actions à venir », « Exemples concrets de réussite » ; textes « Taux d'avancement du chantier » et « Evolution temporelle ».

**Structure territoriale** (vérifiée par `expectStructureTerritoriale`) : titres « Avancement du chantier », « Responsables », « Météo et synthèse des résultats », « Indicateurs (… », « Commentaires du chantier » visibles ; « Décisions stratégiques » et « Suivi des décisions stratégiques » absents.

**Sélecteur de maille** : boutons radio « Régions » et « Départements ». **Boutons de nouveau commentaire** : nationaux (autres résultats, risques et freins, solutions et actions, exemples de réussite) ou territoriaux (commentaires sur les données, autres résultats obtenus).

### Test 1 : DITP Admin — Accès complet en lecture et boutons d'écriture visibles

Profil : `ditp.admin@example.com` (DITP_ADMIN), CH-129 / NAT-FR

- Structure nationale complète
- Sélecteur de maille visible
- Lien « Mettre à jour les données » visible
- Boutons de nouveau commentaire nationaux visibles

### Test 2 : Premier Ministre — Lecture seule, tous territoires

Profil : `premiere.ministre@example.com` (PM_ET_CABINET), CH-129 / NAT-FR

- Structure nationale complète
- Sélecteur de maille visible
- Lien « Mettre à jour les données » absent
- Boutons de nouveau commentaire nationaux absents

### Test 3 : Équipe Direction de Projet — Périmètre chantier limité, écriture nationale

Profil : `equipe.dir.projet@example.com` (EQUIPE_DIR_PROJET), CH-129 / NAT-FR

- Structure nationale complète
- Sélecteur de maille visible
- Lien « Mettre à jour les données » visible
- Boutons de nouveau commentaire nationaux visibles
- `/chantier/CH-070/NAT-FR` (chantier non attribué) : page 404

### Test 4 : Coordinateur Département — Territoire restreint, sélecteur de maille masqué

Profil : `pva.coordinateur.dept@example.com` (COORDINATEUR_DEPARTEMENT, DEPT-56, saisie des commentaires sur CH-129), CH-129 / DEPT-56

- Structure territoriale
- Sélecteur de maille absent
- Lien « Mettre à jour les données » absent
- Boutons de nouveau commentaire territoriaux visibles

### Test 5 : Préfet Région — Territoire régional, écriture commentaires ATE

Profil : `chantier.prefet.reg@example.com` (PREFET_REGION, REG-53, saisie des commentaires sur CH-129), CH-129 / REG-53

- Structure territoriale
- Sélecteur de maille visible
- Lien « Mettre à jour les données » absent
- Boutons de nouveau commentaire territoriaux visibles

### Test 6 : Coordinateur Département sans habilitation chantier — pas de boutons d'écriture

Profil : `coordinateur.departement@example.com` (COORDINATEUR_DEPARTEMENT, sans saisie des commentaires sur CH-129), CH-129 / DEPT-56

- Structure territoriale
- Sélecteur de maille absent
- Boutons de nouveau commentaire territoriaux absents

### Test 7 : Préfet Région sans habilitation chantier — pas de boutons d'écriture

Profil : `prefet.region@example.com` (PREFET_REGION, sans saisie des commentaires sur CH-129), CH-129 / REG-53

- Structure territoriale
- Sélecteur de maille visible
- Boutons de nouveau commentaire territoriaux absents

### Matrice de visibilité sur la page chantier par profil

Légende : ✓ visible | ✗ absent | — non vérifié

| Élément                     | DITP Admin | PM Cabinet | Éq. Dir. Projet | Coord. Dept (avec hab.) | Préfet Rég. (avec hab.) | Coord. Dept (sans hab.) | Préfet Rég. (sans hab.) |
|-----------------------------|:----------:|:----------:|:---------------:|:-----------------------:|:-----------------------:|:-----------------------:|:-----------------------:|
| **Territoire testé**        |   NAT-FR   |   NAT-FR   |     NAT-FR      |         DEPT-56         |         REG-53          |         DEPT-56         |         REG-53          |
| Structure                   | nationale  | nationale  |    nationale    |       territoriale      |       territoriale      |       territoriale      |       territoriale      |
| Décisions stratégiques      |     ✓      |     ✓      |        ✓        |            ✗            |            ✗            |            ✗            |            ✗            |
| Sélecteur de maille         |     ✓      |     ✓      |        ✓        |            ✗            |            ✓            |            ✗            |            ✓            |
| Mettre à jour les données   |     ✓      |     ✗      |        ✓        |            ✗            |            ✗            |            —            |            —            |
| Boutons nouveau commentaire |     ✓      |     ✗      |        ✓        |            ✓            |            ✓            |            ✗            |            ✗            |
| Chantier non attribué       |     —      |     —      |       404       |            —            |            —            |            —            |            —            |

---

## 5. Cartographie PVA — Comparaison territoriale

**Fichier :** `tests/information-chantier.spec.ts` (bloc « Cartographie PVA — Comparaison territoriale »)

Profil : `ditp.admin@example.com` (DITP_ADMIN), CH-129 / NAT-FR. Le sélecteur de la section « Comparaison territoriale et évolution » est positionné sur « Carte des propositions de valeur d'avancement ». Données seedées : NAT-FR 3 propositions, Paris 2, Morbihan 0.

### Test 1 : Affichage du widget PVA

- « Comparaison territoriale et évolution » et le sous-titre « Nombres de propositions de valeur d'avancement » sont visibles
- Le texte « 3 propositions » est visible (France)
- Le lien « + ajouter un territoire » est visible dans le widget

### Test 2 : Ajout et suppression d'un territoire

- Ajout de « Paris » par le picker : « 2 propositions » visible
- Ajout de « Morbihan » : « pas de proposition » visible
- Retrait de Paris (bouton « Retirer … Paris ») : le bouton de retrait de Paris disparaît et « 2 propositions » n'est plus visible

---

## 6. Saisie des publications d'un chantier

**Fichier :** `tests/saisie-commentaire.spec.ts`

Chantier dédié : CH-903.

### Test 1 : Un directeur de projet publie un commentaire national retrouvé dans l'historique

Profil : `equipe.dir.projet@example.com`, CH-903 / NAT-FR

- Publication d'un commentaire « Risques et freins à lever » au contenu unique
- Message « Votre nouveau commentaire a bien été publié » visible
- La modale d'historique du type contient « Historique - Commentaires » et le contenu publié

### Test 2 : Un brouillon territorial n'est visible que de son auteur

Profils : `saisie.coordinateur.dept@example.com` puis `saisie.prefet.dept@example.com`, CH-903 / DEPT-56

- Le coordinateur enregistre un commentaire « Commentaires sur les données » en brouillon : message « Vous avez enregistré un nouveau commentaire en tant que brouillon » et bouton « Editer un brouillon » visibles
- Le préfet, habilité à la saisie sur le même territoire : le bouton de nouveau commentaire est visible, mais ni le message de brouillon, ni « Editer un brouillon », ni le contenu du brouillon n'apparaissent

### Test 3 : La météo publiée s'affiche sur la page du chantier et sur l'accueil

Profil : `equipe.dir.projet@example.com`, CH-903 / NAT-FR

- Nouvelle synthèse dans la section synthèse, météo « Objectifs sécurisés », contenu unique, « Publier »
- Le contenu est visible dans la section synthèse
- En base, la synthèse de CH-903 / NAT-FR a la météo `SOLEIL`
- Sur `/accueil/chantier/NAT-FR`, la cellule météo de la ligne « Chantier e2e saisie » contient une icône et n'affiche pas « Non renseignée »

---

## 7. Import de données indicateur par l'IHM

**Fichier :** `tests/import-donnee.spec.ts`

Profil : `ditp.admin@example.com`. Indicateur dédié : IND-901 « Indicateur e2e import » sur CH-902. Accès direct à `/chantier/CH-902/indicateurs` (titre « Mettre à jour les données - Chantier 902 - PILOTE »).

### Test 1 : Import CSV

- Sélection de « IND-901 : Indicateur e2e import », passage à l'étape 2 sur 3
- CSV invalide (première ligne avec l'identifiant `IND-97`) : « Le fichier ne peut pas être importé » et le message « 'IND-97' n'est pas un identifiant d'indicateur valide : il doit être composé de 'IND-' suivi de 3 ou 4 chiffres. […] »
- CSV valide (3 lignes D12, D13, D14) : « Bravo, le fichier est conforme ! »
- Étape 3 sur 3, « Transmettre les données » : « Les données ont été importées avec succès pour l'indicateur IND-901 »

### Test 2 : Import Excel avec des dates au format date

- Fichier `.xlsx` dont la colonne `date_valeur` est typée date (D15, D16)
- Fichier conforme, transmission, message de succès pour IND-901

---

## 8. Proposition de Valeur d'Avancement (PVA)

**Fichier :** `tests/proposition-valeur-avancement.spec.ts`

5 scénarios exécutés en parallèle, chacun sur son propre indicateur de CH-129 / DEPT-56 (IND-021 à IND-024). Comptes : `pva.coordinateur.dept` (COORDINATEUR_DEPARTEMENT), `pva.prefet.dept` (PREFET_DEPARTEMENT), `pva.coordinateur.reg` (COORDINATEUR_REGION), `pva.dir.projet` (EQUIPE_DIR_PROJET). Les événements PVA créés sont supprimés en fin de test.

### Test 1 : Coordinateur département propose, Direction accuse réception puis accepte (IND-021)

- Le coordinateur propose 42.5 (motif, source) ; le récapitulatif affiche la valeur et le motif ; publication : « correctement été prise en compte »
- Côté territoire : statut « Proposition de nouvelle valeur d'avancement en cours » / « en attente de lecture par la direction de projet » ; boutons modifier et supprimer visibles
- La direction accuse réception avec un commentaire, repris dans le récapitulatif : « a bien été enregistré »
- Côté territoire : statut « lue par la direction de projet » ; boutons modifier et supprimer absents
- La direction accepte ; récapitulatif « la proposition est acceptée » ; « a bien été acceptée »
- Statut « acceptée »
- Historique : « Historique des actions sur les valeurs d'avancement », IND-021, nouvelle proposition, accusé de réception, acceptation par la direction de projet

### Test 2 : Préfet département propose, Direction refuse, Territoire peut re-proposer (IND-022)

- Le préfet propose 85 et publie
- La direction refuse avec un motif ; récapitulatif « la proposition est refusée » ; « a bien été refusée »
- Côté direction et côté territoire : statut « dernière proposition en date refusée » ; côté territoire, le bouton « Proposer une autre valeur d'avancement » est visible
- Historique : nouvelle proposition, refus par la direction de projet

### Test 3 : Territoire propose, Direction accepte avec modification (IND-023)

- Le coordinateur propose 75
- La direction accepte avec modification à 60 ; récapitulatif « la proposition est modifiée » et « 60 ( » ; « a bien été acceptée avec modification »
- Statut « acceptée avec modification »
- Historique : nouvelle proposition, acceptation avec modification

### Test 4 : Territoire modifie puis supprime sa proposition (IND-024)

- Le coordinateur propose 30, puis modifie à 35 (récapitulatif « Valeur d'avancement proposée »)
- Statut « en cours » / « modifiée par le territoire »
- Suppression avec motif (repris dans le récapitulatif) : « correctement été supprimée »
- Statut « dernière proposition en date supprimée » et bouton de re-proposition visible
- Historique : nouvelle proposition, modification, suppression

### Test 5 : Maille région agrégée — blocage de la proposition (IND-021)

- `pva.coordinateur.reg` sur CH-129 / REG-53 : IND-021 affiche « Impossible de proposer une autre valeur d'avancement » et le bouton « Proposer une autre valeur d'avancement » est absent

---

## 9. Export CSV

Les tests 9.1 à 9.3 passent par la modale d'export de l'accueil (« Exporter les données - Étape N sur 5 »), avec `ditp.admin@example.com`. Le jalon des colonnes cibles et des valeurs de référence est l'année calculée par `getAnneeDateDeBascule` (date du jour et `NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE`), pas une année figée.

### 9.1 Export des chantiers

**Fichier :** `tests/export-csv-chantier.spec.ts`

- Type « les chantiers », périmètre « exporter tous les éléments »
- Étape 3 : « identifiants du chantier et du territoire » visible et pré-coché ; chacune des options suivantes est visible et se coche : gouvernance, responsabilité, objectifs, données descriptives sur le territoire, données de comparaison, valeurs de référence, météo et synthèse des résultats, commentaires, suivi des décisions stratégiques
- Étape 4 atteinte
- Téléchargement « identifiant, gouvernance » (étape 4 ouverte par URL) : fichier `PILOTE-Chantiers-*.csv`, en-tête exact (Maille, Région, Département, Code INSEE - Nom du département, Chantier Id, Chantier, Ministère, Axe, Statut, Chantier territorialisé, Chantier du baromètre) et ligne `"CH-058";"Accélérer la transition numérique"`
- Téléchargement « identifiant, valeurs de référence » : en-tête exact avec maximum / médiane / minimum régional et départemental du jalon
- Téléchargement « identifiant, gouvernance, responsabilité, objectif » : en-tête exact ajoutant Directeur projet, Contact directeur projet, Responsable local, Contact responsable local, Coordinateur territorial, Contact coordinateur territorial, Notre ambition, Ce qui a déjà été fait, Ce qui reste à faire

### 9.2 Export des indicateurs

**Fichier :** `tests/export-csv-indicateur.spec.ts`

- Type « les indicateurs des chantiers », périmètre sans filtres
- Étape 3 : « identifiants de l'indicateur, du chantier associé et du territoire » visible et pré-coché ; chacune des options suivantes est visible et se coche : cadrage de l'indicateur, gouvernance de l'indicateur et du chantier associé, données de l'indicateur sur le territoire, données du chantier associé sur le territoire, météo et synthèse des résultats du chantier associé
- Téléchargement « identifiant, gouvernance » : fichier `PILOTE-Indicateurs-*.csv`, en-tête exact (Maille, Région, Département, Code INSEE - Nom du département, Chantier, Chantier Id, Indicateur, Indicateur Id, Ministère, Axe, Chantier statut, Chantier du baromètre) et ligne `"Part des déploiement territorial";"IND-838"`
- Téléchargement « identifiant, gouvernance, description » : en-tête exact ajoutant Valeur initiale, Date valeur initiale, Valeur avancement, Date valeur avancement, Valeur cible à fin d'échéance, Date valeur cible à fin d'échéance et Taux d'avancement à fin d'échéance (indicateur) du jalon

### 9.3 Export de l'historique des indicateurs

**Fichier :** `tests/export-csv-historique-indicateur.spec.ts`

- Filtre ministère « Intérieur et Outre-mer » sur l'accueil
- Type « l'historique des indicateurs », périmètre « sélection présentement active »
- Étape 3 : les trois options (identifiants de l'indicateur et du territoire, valeur initiale et valeurs cibles, valeurs d'avancement mois par mois) sont visibles et pré-cochées
- Téléchargement : fichier `PILOTE-Historique-Indicateurs-*.csv`, en-tête exact (Maille, Région, Département, Code INSEE - Nom du département, Chantier, Chantier Id, Indicateur, Indicateur Id, Valeur initiale, Date valeur initiale, Valeur cible année et Date valeur cible année du jalon, Valeur avancement, Date valeur avancement) et au moins une ligne de données

### 9.4 Export des utilisateurs

**Fichier :** `tests/export-csv-utilisateur.spec.ts`

Profil : `ditp.admin@example.com`

- Accès par le lien « Gestion des comptes », bouton d'export
- Fichier `PILOTE-Utilisateurs-*.csv`, en-tête exact des 19 colonnes : Prénom, Nom, Email, Fonction, Profil, Périmètre ministériel, Service, Territoire, Périmètre, Droit de lecture, Responsabilité, Droits de saisie des données quantitatives, Droits de saisie des commentaires, Droits de gestion des utilisateurs, Statut, Date de création, Auteur création, Date de dernière modification, Auteur dernière modification
- Le fichier contient `"ditp.admin@example.com"`

### 9.5 Cloisonnement des exports

**Fichier :** `tests/export-csv-cloisonnement.spec.ts`

Appels directs aux routes d'export avec la session ; chaque appel doit répondre 200 et le CSV est analysé.

- **Chantiers, profil régional** (`services.deconcentres.region`) : `/api/export/chantiers-v2` non vide ; seule région « Bretagne » ; chaque Chantier Id appartient à CH-051, CH-054, CH-058, CH-062, CH-070.
- **Brouillons refusés** (`services.deconcentres.region`, habilité sur CH-901 sans accès aux brouillons) : l'export par défaut ne contient pas CH-901 ; `?statut=BROUILLON` renvoie un CSV sans ligne.
- **Brouillons autorisés** (`equipe.dir.projet`) : `?statut=BROUILLON` contient uniquement CH-901.
- **Indicateurs, profil régional** (`services.deconcentres.region`) : `/api/export/indicateurs-v2` non vide ; seule région « Bretagne » ; chantiers limités à la même liste.
- **Indicateurs, directeur de projet** (`equipe.dir.projet`) : contient IND-901, IND-902 et IND-903 ; ne contient pas CH-070.
- **Historique, coordinateur régional** (`coordinateur.region`) : `/api/export/historique-indicateurs` non vide ; seule région « Bretagne ».
- **Utilisateurs, coordinateur départemental** (`coordinateur.departement`) : `/api/export/utilisateurs?typeCompte=actif` contient `prefet.departement`, pas `ditp.admin` ni `premiere.ministre`.

---

## 10. Open API

Specs sans IHM (Chromium uniquement). Les écritures portent sur CH-902 ; le chantier non autorisé est CH-070.

### 10.1 Authentification

**Fichier :** `tests/open-api/authentification.spec.ts`

Route : `GET /api/open-api/healthcheck`

- Sans en-tête `Authorization` : 401
- En-tête `Authorization: invalid` : 400
- JWT bien formé mais non forgé par l'API : 400
- JWT forgé par l'API (`ditp.admin`) : 200 et corps exact `{ resultat: "Bonjour ditp.admin@example.com, vous pouvez utiliser l'API." }`

### 10.2 Gestion des erreurs

**Fichier :** `tests/open-api/error-management.spec.ts`

Profil : EQUIPE_DIR_PROJET

- `GET /chantier/CH-070/donnees` : 403, corps exact `{ message: "Vous n'êtes pas autorisé à accéder au chantier CH-070", success: false }`
- `GET /chantier/CH-070/indicateur/IND-105/donnees` : 403, corps exact `{ message: "Vous n'êtes pas autorisé à accéder à l'indicateur IND-105", success: false }`

### 10.3 Export des données d'un chantier

**Fichier :** `tests/open-api/export-donnee-chantier.spec.ts`

Profil : EQUIPE_DIR_PROJET

- `GET /chantier/CH-129/donnees` : 200
- Champs : `chantier_id` CH-129, `nom` « Moderniser la gestion des ressources », `ministere` MI, `statut` PUBLIE, `est_barometre` false, `est_territorialise` true
- Territoires : 1 NAT, 18 REG, 101 DEPT
- L'entrée DEPT-13 vaut exactement : météo nulle, responsables et taux d'avancement « Non applicable », toutes les publications nulles

### 10.4 Export des données d'un indicateur

**Fichier :** `tests/open-api/export-donnee-indic-quanti.spec.ts`

Profil : EQUIPE_DIR_PROJET

- `GET /chantier/CH-129/indicateur/IND-021/donnees` : 200, `chantier_id` CH-129, `indic_id` IND-021
- Territoires : 1 NAT, 18 REG, 101 DEPT
- L'entrée NAT-FR vaut exactement : code INSEE FR, zone FRANCE, valeur actuelle et d'avancement 0 au 2025-06-01, valeurs initiale / cible / cible annuelle et taux d'avancement nuls

### 10.5 Import de commentaires

**Fichier :** `tests/open-api/import-chantier-commentaire.spec.ts`

Profil : EQUIPE_DIR_PROJET, `POST /chantier/CH-902/commentaires`. Hors import multiple, les vérifications portent sur la réponse HTTP ; l'import de plusieurs commentaires est relu en base (un enregistrement par contenu sur CH-902).

- Commentaire valide sans date : 200, message « Les commentaires ont correctement été importés »
- Commentaire avec une date antérieure : 200, même message
- Trois commentaires de types différents en une requête : 200, même message
- Date dans le futur : 400, au moins une erreur
- Type national (`risques_et_freins_a_lever`) sur REG-84 : 400, une erreur contenant « n'est pas autorisé pour la maille régionale »
- Type territorial (`commentaires_sur_les_donnees`) sur NAT-FR : 400, une erreur contenant « n'est pas autorisé pour la maille nationale »
- Type inexistant : 400, au moins une erreur
- CH-070 : 403

### 10.6 Import de décisions stratégiques

**Fichier :** `tests/open-api/import-chantier-decision-strategique.spec.ts`

Profil : EQUIPE_DIR_PROJET, `POST /chantier/CH-902/decisions-strategiques` (réponse HTTP uniquement).

- Décision valide sans date : 200, message « Les décisions stratégiques ont correctement été importées »
- Décision avec une date antérieure : 200, même message
- Date dans le futur : 400, au moins une erreur
- Type inexistant : 400, au moins une erreur
- CH-070 : 403

### 10.7 Import d'objectifs

**Fichier :** `tests/open-api/import-chantier-objectif.spec.ts`

Profil : EQUIPE_DIR_PROJET, `POST /chantier/CH-902/objectifs` (réponse HTTP ; l'import de plusieurs objectifs est relu en base).

- Objectif `notre_ambition` sans date : 200, message « Les objectifs ont correctement été importés »
- Objectif `deja_fait` avec une date antérieure : 200, même message
- Trois objectifs (`notre_ambition`, `deja_fait`, `a_faire`) en une requête : 200, même message
- Date dans le futur : 400, au moins une erreur
- Type inexistant : 400, au moins une erreur
- CH-070 : 403

### 10.8 Import de synthèses des résultats

**Fichier :** `tests/open-api/import-chantier-synthese-des-resultats.spec.ts`

Profil : EQUIPE_DIR_PROJET, `POST /chantier/CH-902/syntheses-des-resultats`, territoire NAT-FR (réponse HTTP ; l'import de plusieurs synthèses est relu en base). Météos de l'API : `OBJECTIF_SECURISE` (SOLEIL, « Objectifs sécurisés »), `APPUIS_NECESSAIRE` (NUAGE, « Appuis nécessaires »), `OBJECTIF_COMPROMIS` (ORAGE, « Objectifs compromis »).

- Synthèse « Objectifs sécurisés » sans date : 200, message « Les synthèses des résultats ont correctement été importées »
- Synthèse « Appuis nécessaires » avec une date antérieure : 200, même message
- Deux synthèses (« Objectifs sécurisés » et « Objectifs compromis ») en une requête : 200, même message
- Date dans le futur : 400, au moins une erreur
- Météo inexistante : 400, au moins une erreur
- CH-070 : 403

### 10.9 Import des données d'un indicateur

**Fichier :** `tests/open-api/import-donnee-indicateur.spec.ts`

`POST /chantier/CH-902/indicateur/IND-903/donnees`

- **Import valide** (EQUIPE_DIR_PROJET) : deux valeurs (D56 = 42, D29 = 17) : 200, corps exact `{ message: "Les données ont correctement été importés" }` ; en base, `mesure_indicateur` d'IND-903 contient exactement ces deux mesures (`va`, date 2023-03-01)
- **Valeur invalide** (EQUIPE_DIR_PROJET, `zone_id` inconnu) : 400, message « Une erreur est survenue lors de l'import des données », une erreur sur le champ `zone_id` ; aucune mesure en base pour IND-903
- **Profil en lecture seule** (PM_ET_CABINET) : 403 ; aucune mesure en base pour IND-903
- **Chantier non attribué** (EQUIPE_DIR_PROJET, CH-070 / IND-105) : 403 ; le nombre de mesures d'IND-105 est inchangé

---

## 11. Gestion des comptes utilisateurs

**Fichier :** `tests/admin-gestion-utilisateurs.spec.ts`

8 scénarios sur le listing (`/admin/utilisateurs`, atteint par le lien « Gestion des comptes ») et la fiche détail (« Fiche du compte »).

### Test 1 : DITP Admin — Vue admin complète et bouton de token API visible

Profil : `ditp.admin@example.com` (DITP_ADMIN)

- Colonne « Territoire » visible ; « Créer un compte » pointe vers `/admin/utilisateur/creer`
- Le filtre « Profil(s) » propose les 12 profils : DITP - Admin, DITP - Pilotage, Coordinateur PILOTE régional, Coordinateur PILOTE départemental, Préfet de région et collaborateurs, Préfet de département et collaborateurs, Services déconcentrés régionaux, Services déconcentrés départementaux, Secrétariat général de ministère (cormod), Équipe de Directeur de projet, Cabinets ministériels, Direction d'administration centrale
- Fiche de `coordinateur.region` : email, nom, prénom et code profil `COORDINATEUR_REGION` affichés ; « Modifier » et « Désactiver le compte » visibles ; pas de bandeau de restriction
- Fiche de `equipe.dir.projet` (profil éligible) : bouton « Générer un token » visible (il n'est pas cliqué)
- Fiche de `prefet.region` (profil non éligible) : bouton « Générer un token » absent

### Test 2 : Coordinateur Région — Visibilité et restrictions

Profil : `coordinateur.region@example.com` (COORDINATEUR_REGION, REG-53 et ses départements)

- Colonne « Territoire » absente ; « Créer un compte » pointe vers la page d'aide (`…/aide`)
- Filtre : les 6 profils territoriaux (coordinateurs, préfets, services déconcentrés régionaux et départementaux) présents ; « DITP - Admin » absent
- Visibles : `coordinateur.region`, `coordinateur.departement`, `prefet.region`, `prefet.departement`, `services.deconcentres.region`, `services.deconcentres.departement` ; absents : `ditp.admin`, `equipe.dir.projet`
- Fiches `prefet.departement` et `services.deconcentres.region` : « Modifier » et « Désactiver le compte » visibles, pas de bandeau, pas de bouton de token
- Fiche `coordinateur.departement` : bandeau « coordinateur PILOTE », « Modifier » et « Désactiver le compte » absents
- Fiche `services.deconcentres.hors-ate` (chantier CH-108 hors ATE) : « Modifier » visible, pas de bandeau

### Test 3 : Coordinateur Département — Périmètre restreint

Profil : `coordinateur.departement@example.com` (COORDINATEUR_DEPARTEMENT)

- Colonne « Territoire » absente
- Filtre : Coordinateur PILOTE départemental, Préfet de département et collaborateurs, Services déconcentrés départementaux présents ; leurs équivalents régionaux absents
- Visibles : `prefet.departement`, `coordinateur.departement`, `services.deconcentres.departement` ; absents : `coordinateur.region`, `prefet.region`, `services.deconcentres.region`
- Fiches `prefet.departement` et `services.deconcentres.departement` : « Modifier » et « Désactiver le compte » visibles
- Sa propre fiche : bandeau « coordinateur PILOTE », « Modifier » et « Désactiver le compte » absents

### Test 4 : Secrétariat Général — Par chantiers

Profil : `secretariat.general@example.com` (SECRETARIAT_GENERAL, CH-070, CH-071, CH-067)

- Colonne « Territoire » absente ; « Créer un compte » pointe vers la page d'aide
- Filtre : Services déconcentrés régionaux et départementaux présents ; « Préfet de région et collaborateurs » et « DITP - Admin » absents
- Visibles : `services.deconcentres.region`, `services.deconcentres.departement` ; absents : `ditp.admin`, `prefet.region`
- Fiche `services.deconcentres.region` : bandeau « plusieurs chantiers », « Modifier », « Désactiver le compte » et bouton de token absents

### Test 5 : Profils sans accès — Redirection

Profils : `prefet.region`, `equipe.dir.projet`, `prefet.departement`

- Pour chacun : lien « Gestion des comptes » absent ; `/admin/utilisateurs` ne reste pas sur `/admin/utilisateurs`

### Test 6 : Désactivation et réactivation

Profil : `ditp.admin@example.com`, compte cible `services.deconcentres.departement`

- « Désactiver le compte » puis « Confirmer la désactivation » : alerte de succès contenant « désactivé » sur le listing
- Fiche : badge « Désactivé depuis le … », « Modifier » absent, « Réactiver le compte » visible
- « Réactiver le compte » puis « Confirmer la réactivation » : alerte contenant « réactivé »
- Fiche : plus de badge, « Modifier » visible

### Test 7 : Filtres et recherche

Profil : `ditp.admin@example.com`

- « Comptes actifs » : `ditp.admin` visible ; « Comptes désactivés » : `ditp.admin` absent
- Recherche « coordinateur » : `coordinateur.region` et `coordinateur.departement` visibles, `ditp.admin` absent
- Filtre « Préfet de département et collaborateurs » : `prefet.departement` visible, `ditp.admin` et `coordinateur.region` absents ; « Réinitialiser les filtres » : `ditp.admin` revient
- Filtre « Coordinateur PILOTE régional » + recherche « coordinateur », réinitialisation puis effacement de la recherche (le bouton ne vide pas la recherche) : `ditp.admin` visible

### Test 8 : Restriction multi-territoires

Profil : `coordinateur.region@example.com`, compte cible `prefet.multi.territoires` (PREFET_DEPARTEMENT, DEPT-56 et DEPT-75)

- Le compte est visible dans le listing
- Fiche : bandeau « plusieurs territoires », « Modifier » et « Désactiver le compte » absents

### Matrice de ce qui est vérifié dans le listing et les fiches

Légende : **modifiable** = fiche ouverte, « Modifier » visible sans bandeau | **visible** / **absent** = présence dans le tableau | **bandeau …** = bandeau de restriction | — non vérifié

| Compte / élément                  |                DITP Admin                |  Coord. Région   |    Coord. Dept    |   Sec. Général    |
|-----------------------------------|:----------------------------------------:|:----------------:|:-----------------:|:-----------------:|
| **Accès au listing**              |                    ✓                     |        ✓         |         ✓         |         ✓         |
| **Colonne Territoire**            |                 visible                  |     masquée      |      masquée      |      masquée      |
| **Bouton Créer un compte**        |        `/admin/utilisateur/creer`        |     `…/aide`     |         —         |     `…/aide`      |
| coordinateur.region               |                modifiable                |     visible      |      absent       |         —         |
| coordinateur.departement          |                    —                     | bandeau coord.   | bandeau coord. (soi-même) |  —        |
| prefet.region                     |       fiche ouverte (token absent)       |     visible      |      absent       |      absent       |
| prefet.departement                |                    —                     |    modifiable    |    modifiable     |         —         |
| services.deconcentres.region      |                    —                     |    modifiable    |      absent       | bandeau chantiers |
| services.deconcentres.departement |          désactivé puis réactivé         |     visible      |    modifiable     |      visible      |
| services.deconcentres.hors-ate    |                    —                     |    modifiable    |         —         |         —         |
| prefet.multi.territoires          |                    —                     | bandeau terr.    |         —         |         —         |
| equipe.dir.projet                 |       fiche ouverte (token visible)      |      absent      |         —         |         —         |
| ditp.admin                        |                    —                     |      absent      |         —         |      absent       |
| **Bouton Générer un token**       | visible (EDP), absent (préfet région)    | absent           |         —         |      absent       |

Préfet de région, équipe direction de projet et préfet de département n'ont pas accès au listing (test 5).

---

## 12. Création / modification des comptes utilisateurs

**Fichier :** `tests/admin-gestion-utilisateurs-formulaire.spec.ts`

### Test 1 : Champs obligatoires Service et Fonction à la création

Profil : `ditp.admin@example.com`

- `/admin/utilisateur/creer` : email, nom, prénom et profil « DITP - Admin » renseignés, sans service ni fonction
- « Suivant » : Fonction et Service passent en `aria-invalid="true"`
- Après saisie de la fonction et du service « Préfecture de région » : plus aucun des deux champs en erreur (« Suivant » n'est pas recliqué)

### Test 2 : Création d'un compte puis refus d'un doublon d'adresse

Profil : `ditp.admin@example.com`, adresse unique `e2e.creation.<uuid>@example.com`

- Formulaire complet (profil « DITP - Pilotage », fonction « Testeur E2E », service « Préfecture de région »), « Suivant » puis « Confirmer » : alerte de succès ; en base, le compte a le profil `DITP_PILOTAGE` et la fonction « Testeur E2E »
- Même formulaire avec la même adresse : alerte « Un compte a déjà été créé avec cette adresse électronique. » ; un seul compte en base pour cette adresse

### Test 3 : Champs obligatoires à la modification et modale « Complétez votre profil »

Profils : `modale.profil@example.com` (COORDINATEUR_REGION, seedé sans service ni fonction) et `ditp.admin@example.com`

- Connexion de `modale.profil` : la modale (bouton « Plus tard ») apparaît
- `ditp.admin` ouvre la fiche de `modale.profil` puis « Modifier » ; « Suivant » : Fonction et Service en erreur
- Saisie de la fonction et du service, « Suivant » : plus d'erreur ; « Confirmer » : alerte de succès
- Reconnexion de `modale.profil` : « Mon espace » visible et la modale n'apparaît plus

---

## 13. Gestion des paramètres des indicateurs — Listing

**Fichier :** `tests/admin-indicateurs-listing.spec.ts`

### Test 1 : Structure de la page et fonctionnalités principales

Profil : `ditp.admin@example.com` (DITP_ADMIN)

- `/panel-administrateur/indicateurs` : titre « Gestion des paramètres des indicateurs »
- Colonnes : Chantier associé, Nom du chantier, Identifiant indicateur, Nom de l'indicateur, Dernière modification, Actif / Inactif
- Boutons « Créer un indicateur » et « Exporter » visibles ; compteur d'indicateurs supérieur à 0
- Pagination visible, 20 lignes sur la première page
- Recherche « IND-021 » : IND-021 dans le tableau, pagination masquée ; effacement : compteur initial et pagination de retour
- Toggle « Indicateurs territorialisés » : compteur inférieur ou égal au total, bouton de filtre actif visible ; réinitialisation : compteur initial
- Toggle « Indicateurs du baromètre » : mêmes vérifications ; réinitialisation : compteur initial
- Page suivante : nombre de lignes = total − 20
- Retour page 1, recherche et clic sur IND-021 : URL `/panel-administrateur/indicateurs/IND-021`

### Test 2 : Accès refusé aux profils non DITP_ADMIN

Profils : `coordinateur.region`, `equipe.dir.projet`

- Lien « Indicateurs des chantiers » absent de la navigation
- `/panel-administrateur/indicateurs` ne reste pas sur cette URL

---

## 14. Gestion des paramètres des indicateurs — Formulaire

**Fichier :** `tests/admin-indicateurs-formulaire.spec.ts`

Profil : `ditp.admin@example.com` (DITP_ADMIN) sauf test 7. Fiche : `/panel-administrateur/indicateurs/<id>`.

### Test 1 : Consultation et modification d'un indicateur (IND-902)

Les métadonnées d'IND-902 sont restaurées en fin de test.

- Titre « Fiche de l'indicateur IND-902 », lien « Retour », sélecteur Actif / Inactif
- Carte récapitulative : Chantier associé, Nom du chantier, Identifiant indicateur, Nom de l'indicateur, Création de l'indicateur, Dernière modification
- Accordéon « Identité indicateur » ouvert, « Paramétrages » et « Autres informations » fermés
- Mode consultation : « Modifier » visible, « Confirmer les changements » et « Annuler » absents ; CH-902 et IND-902 affichés
- « Paramétrages » : sections Maille départementale, Maille régionale, Maille nationale, « Pondération de l'indicateur dans le calcul du taux d'avancement global »
- « Modifier » : mode modification ; « Annuler » : retour en consultation
- Modification de l'unité (« kg/m² »), de la description, de la périodicité (« Mensuelle ») et de l'interrupteur « Phare »
- « Confirmer les changements » : alerte « Bravo, l'indicateur a bien été modifié ! », retour en consultation ; « kg/m² », la description, « Mensuelle » et « Oui » sont affichés après rechargement de la page
- « Retour » : URL `/panel-administrateur/indicateurs`

### Test 2 : Activation des champs d'agrégation selon l'origine des valeurs (IND-021)

Mode modification, annulé en fin de test (rien n'est enregistré).

- Départementale : `viDeptFrom` = `user_input` → `viDeptOp` désactivé ; `sub_indic` → activé ; retour à `user_input` → désactivé ; `vaDeptFrom` = `user_input` → `vaDeptOp` désactivé
- Régionale : `viRegFrom` = `DEPT` → `viRegOp` activé et vaut `sum` ; `user_input` → désactivé ; retour à `DEPT` → activé
- Nationale : `viNatFrom` = `DEPT` → `viNatOp` activé ; `_` → désactivé

### Test 3 : Règles du calcul de la valeur d'avancement (IND-021)

Mode modification, annulé en fin de test.

- `paramVacaOp` et `paramVacgOp` toujours désactivés
- Valeurs initiales : partition `from_year_start` et opération `sum` pour le TA annuel et le TA global
- Partition du TA annuel à `_` : opération `current_value`, et le TA global se synchronise (`_`, `current_value`)
- Partition du TA global à `from_year_start` : opération `sum`, et le TA annuel se synchronise
- `paramVacgDecumulFrom` a la même valeur que `paramVacaDecumulFrom`

### Test 4 : Pondérations désactivées sans territorialisation (IND-021)

Mode modification, annulé en fin de test.

- `poidsPourcentDept` et `poidsPourcentReg` actifs
- Interrupteur « Territorialisation » désactivé : les deux champs deviennent inactifs

### Test 5 : Création d'un indicateur (IND-990)

L'indicateur créé est supprimé en fin de test.

- `/panel-administrateur/indicateurs/IND-990?_action=creer-indicateur` : titre « Fiche de l'indicateur IND-990 »
- Mode création : « Créer l'indicateur » visible, « Modifier » et « Confirmer les changements » absents ; sélecteur Actif / Inactif ; accordéons comme en consultation
- Saisie du nom, du chantier parent CH-902, de la description, du type `IMPACT`, du schéma `sans-contraintes.json` et de la périodicité « Trimestrielle », puis « Créer l'indicateur » : alerte « Bravo, l'indicateur a bien été crée ! »
- En base, `metadata_indicateurs_hidden` contient IND-990 avec le nom saisi

### Test 6 : Navigation listing → fiche → listing

- Recherche et clic sur IND-021 depuis le listing : titre « Fiche de l'indicateur IND-021 »
- « Retour » : titre du listing visible

### Test 7 : Accès refusé à la fiche

Profils : `coordinateur.region`, `equipe.dir.projet`

- `/panel-administrateur/indicateurs/IND-021` ne reste pas sur cette URL

### Test 8 : Restriction géographique (IND-021)

- En mode modification, le sélecteur de zone-groupe propose une seule option « Groupement 1 »

---

## 15. Paramétrage d'un chantier

**Fichier :** `tests/parametrage-chantier.spec.ts`

Profil : `ditp.admin@example.com`. Pages : `/panel-administrateur/chantiers/CH-902` (métadonnées) et `/panel-administrateur/chantiers/CH-904` (pondérations). Les données modifiées sont restaurées en fin de test.

- **Métadonnées** : description « Description modifiée par un test e2e », « Sauvegarder » : en base, `metadata_chantiers.ch_descr` de CH-902 vaut ce texte ; après rechargement, le champ « Description » l'affiche
- **Pondérations** : onglet « Pondérations », première pondération de la ligne IND-904 à 100, « Enregistrer » : en base, `poids_pourcent_nat_declaree` d'IND-904 vaut 100 ; après rechargement, le champ vaut 100

---

## 16. Tokens API

**Fichier :** `tests/gestion-token-api.spec.ts`

Profil : `ditp.admin@example.com`. Compte cible réservé à ce spec : `cabinet.mtfp@example.com`. Le token est supprimé en fin de test.

- Sur `/panel-administrateur/gestion-token-api`, l'administrateur crée un token pour `cabinet.mtfp` (l'email n'était pas listé avant) : token non vide
- Avec ce token, `GET /api/open-api/chantier/CH-129/donnees` : 200 et `chantier_id` CH-129
- Après suppression depuis la même page, la ligne disparaît et la même requête répond 403

---

## 17. Mon profil utilisateur

**Fichier :** `tests/mon-profil-utilisateur.spec.ts`

Profils : `ditp.admin@example.com` puis `coordinateur.region@example.com`. Le profil de `ditp.admin` est restauré en fin de test.

- `/mon-profil-utilisateur` : titre, section « Identification », mention « Tous les champs sont obligatoires. », champs Adresse électronique, Prénom, Nom, Fonction, bouton « Enregistrer » et mention « Modifié le JJ/MM/AAAA à HH:MM »
- Adresse électronique désactivée ; email, prénom (« Admin ») et nom (« DITP ») pré-remplis
- Service « Autre » : champ « Précisez votre service » et message d'aide visibles ; service « Préfecture de région » : le champ disparaît
- Fonction « Testeur E2E » et « Enregistrer » : « Vos informations ont été modifiées avec succès »
- En base : fonction « Testeur E2E », service `prefecture-de-region`, `date_modification` postérieure à la précédente ; la mention affiche « Modifié le … » avec cette date (heure de Paris)
- `coordinateur.region` : son propre email, prénom et nom pré-remplis

---

## 18. Accès à l'assistant IA

**Fichier :** `tests/acces-assistant-ia.spec.ts`

### Test 1 : Accès par profil et par utilisateur

Profils : `ditp.admin@example.com`, `services.deconcentres.region@example.com`, `prefet.departement@example.com`. Les accès sont gérés dans `/panel-administrateur/albert` (onglets « Permissions profils » et « Permissions emails ») et supprimés en fin de test.

L'accès est vérifié sur l'accueil par la présence du bouton « Ouvrir l'Assistant IA PILOTE » ; l'absence, par le titre « N chantiers » visible et aucun bouton.

- Le DITP Admin a accès ; l'utilisateur Services déconcentrés régionaux n'a pas accès
- Le DITP Admin active le profil Services déconcentrés régionaux : l'utilisateur a accès
- Le préfet de département n'a pas accès ; le DITP Admin l'ajoute par la recherche « departement prefet » (sans mention de profil dans la liste) : il a accès
- Le DITP Admin active aussi le profil Préfet de département : la liste des emails mentionne ce profil pour le préfet ; il a toujours accès
- Le DITP Admin désactive le profil Préfet de département : le préfet garde l'accès par son autorisation individuelle

### Test 2 : Appels directs à l'assistant

- `premiere.ministre` (sans accès) : `POST /api/albert/chat` répond 403
- `ditp.admin` : le rapport d'un autre compte (`/api/albert/rapports/<id ditp.pilotage>/rapport-….pdf`) répond 403 ; un nom de fichier `..%2Fsecret.pdf` répond 400 ; un rapport absent de son propre dossier répond 404

---

## 19. Non couvert

Les failles d'autorisation connues ne sont pas encore testées : leurs tests seront écrits avec les corrections.

**PIL-1921 — failles d'autorisation API, tRPC, SSR :**

- C1 : vérification et publication d'un import par l'IHM
- C2 : POST open-api sur un indicateur non rattaché au chantier, Content-Type non supporté
- C3 : import / export des métadonnées des indicateurs
- C4 : `propositionValeurAvancement.supprimer`
- C5 : fiche conducteur hors périmètre
- C6 : `/admin/utilisateur/[id]` d'un autre compte
- C7 : procédures tRPC de lecture
- H4 : GET open-api filtré par territoire, indicateur non rattaché
- H5 : `territoireCode` des PVA
- N1 : modification d'un compte hors périmètre
- N2 : vidéo d'accueil et popup infolettre désactivées pour un autre compte (`utilisateur.desactiverVideoAccueil`, `desactiverPopupInfolettre`)
- N3 : mail d'inscription à l'infolettre (`envoyerMailInscriptionInfolettre`)
- N4 : CSRF des tokens API (`gestionTokenAPI.creerTokenAPI` / `supprimerTokenAPI`)
- N5 : mutations admin sans CSRF
- N6 : export des utilisateurs refusé en 500

**PIL-1922 — habilitations de l'assistant IA :**

- Outils Albert hors périmètre
- `albert.evaluer` sur la conversation d'un autre compte

**Hors périmètre :** PagePilotage (déprécié), Pilote Eval (décommissionné), Keycloak.

---

## Matrice profils × tests

Légende : ✓ = profil utilisé dans le test. Les colonnes sont des profils ; le compte exact est donné dans chaque section (par exemple les comptes `pva.*` pour les PVA, `saisie.*` pour la saisie, `modale.profil` pour la modale de profil).

| Test                                        | Sans session | DITP Admin | DITP Pilot. | PM Cabinet | Cab. MTFP | Coord. Rég. | Coord. Dept | Sec. Gén. | Préfet Rég. | Préfet Dept | Éq. Dir. Projet | SD Rég. | SD Dept |
|---------------------------------------------|:------------:|:----------:|:-----------:|:----------:|:---------:|:-----------:|:-----------:|:---------:|:-----------:|:-----------:|:---------------:|:-------:|:-------:|
| 1.1 Landing page                            |      ✓       |            |             |            |           |             |             |           |             |             |                 |         |         |
| 1.1 Connexion par formulaire                |              |     ✓      |             |            |           |             |             |           |             |             |                 |         |         |
| 1.2 Écran de choix de connexion             |      ✓       |            |             |            |           |             |             |           |             |             |                 |         |         |
| 2.1 Accès hors périmètre par URL            |              |            |             |            |           |             |      ✓      |           |             |      ✓      |                 |         |         |
| 2.2 Gardes du panel (pages)                 |              |            |      ✓      |            |           |      ✓      |             |           |             |             |        ✓        |         |         |
| 2.2 Gardes du panel (tRPC)                  |              |            |             |            |           |      ✓      |             |           |             |             |                 |         |         |
| 2.3 Appels directs sans session             |      ✓       |            |             |            |           |             |             |           |             |             |                 |         |         |
| 2.3 Lecture avec session                    |              |            |      ✓      |            |           |             |             |           |             |             |                 |         |         |
| 2.3 Gestion des comptes (tRPC)              |              |     ✓      |             |            |           |             |      ✓      |           |             |      ✓      |                 |         |         |
| 2.3 Tokens API (tRPC)                       |              |            |             |            |           |             |             |           |             |             |        ✓        |         |         |
| 2.3 Paramétrage des chantiers (tRPC)        |              |            |             |            |           |      ✓      |             |           |             |             |                 |         |         |
| 3. Accueil                                  |              |            |             |     ✓      |           |             |             |           |             |             |        ✓        |         |         |
| 4. Chantier - Accès complet                 |              |     ✓      |             |            |           |             |             |           |             |             |                 |         |         |
| 4. Chantier - Lecture seule                 |              |            |             |     ✓      |           |             |             |           |             |             |                 |         |         |
| 4. Chantier - Périmètre chantier            |              |            |             |            |           |             |             |           |             |             |        ✓        |         |         |
| 4. Chantier - Dept avec hab.                |              |            |             |            |           |             |      ✓      |           |             |             |                 |         |         |
| 4. Chantier - Rég. avec hab.                |              |            |             |            |           |             |             |           |      ✓      |             |                 |         |         |
| 4. Chantier - Dept sans hab.                |              |            |             |            |           |             |      ✓      |           |             |             |                 |         |         |
| 4. Chantier - Rég. sans hab.                |              |            |             |            |           |             |             |           |      ✓      |             |                 |         |         |
| 5. Cartographie PVA                         |              |     ✓      |             |            |           |             |             |           |             |             |                 |         |         |
| 6. Saisie - Commentaire national            |              |            |             |            |           |             |             |           |             |             |        ✓        |         |         |
| 6. Saisie - Brouillon territorial           |              |            |             |            |           |             |      ✓      |           |             |      ✓      |                 |         |         |
| 6. Saisie - Météo                           |              |            |             |            |           |             |             |           |             |             |        ✓        |         |         |
| 7. Import de données (IHM)                  |              |     ✓      |             |            |           |             |             |           |             |             |                 |         |         |
| 8. PVA - Création / accusé / acceptation    |              |            |             |            |           |             |      ✓      |           |             |             |        ✓        |         |         |
| 8. PVA - Refus                              |              |            |             |            |           |             |             |           |             |      ✓      |        ✓        |         |         |
| 8. PVA - Acceptation avec modification      |              |            |             |            |           |             |      ✓      |           |             |             |        ✓        |         |         |
| 8. PVA - Modification / suppression         |              |            |             |            |           |             |      ✓      |           |             |             |                 |         |         |
| 8. PVA - Blocage maille région              |              |            |             |            |           |      ✓      |             |           |             |             |                 |         |         |
| 9.1 à 9.4 Export CSV (modale, utilisateurs) |              |     ✓      |             |            |           |             |             |           |             |             |                 |         |         |
| 9.5 Cloisonnement des exports               |              |            |             |            |           |      ✓      |      ✓      |           |             |             |        ✓        |    ✓    |         |
| 10.1 Open API - Authentification            |      ✓       |     ✓      |             |            |           |             |             |           |             |             |                 |         |         |
| 10.2 à 10.8 Open API - Erreurs, exports, imports |         |            |             |            |           |             |             |           |             |             |        ✓        |         |         |
| 10.9 Open API - Données indicateur          |              |            |             |     ✓      |           |             |             |           |             |             |        ✓        |         |         |
| 11.1 Gestion - Vue admin + token            |              |     ✓      |             |            |           |             |             |           |             |             |                 |         |         |
| 11.2 Gestion - Coord. région                |              |            |             |            |           |      ✓      |             |           |             |             |                 |         |         |
| 11.3 Gestion - Coord. département           |              |            |             |            |           |             |      ✓      |           |             |             |                 |         |         |
| 11.4 Gestion - Secrétariat général          |              |            |             |            |           |             |             |     ✓     |             |             |                 |         |         |
| 11.5 Gestion - Accès refusé                 |              |            |             |            |           |             |             |           |      ✓      |      ✓      |        ✓        |         |         |
| 11.6 Gestion - Désactiver / réactiver       |              |     ✓      |             |            |           |             |             |           |             |             |                 |         |         |
| 11.7 Gestion - Filtres                      |              |     ✓      |             |            |           |             |             |           |             |             |                 |         |         |
| 11.8 Gestion - Multi-territoires            |              |            |             |            |           |      ✓      |             |           |             |             |                 |         |         |
| 12. Comptes - Validation à la création      |              |     ✓      |             |            |           |             |             |           |             |             |                 |         |         |
| 12. Comptes - Création et doublon           |              |     ✓      |             |            |           |             |             |           |             |             |                 |         |         |
| 12. Comptes - Modification et modale        |              |     ✓      |             |            |           |      ✓      |             |           |             |             |                 |         |         |
| 13. Indicateurs - Listing                   |              |     ✓      |             |            |           |      ✓      |             |           |             |             |        ✓        |         |         |
| 14. Indicateurs - Formulaire                |              |     ✓      |             |            |           |      ✓      |             |           |             |             |        ✓        |         |         |
| 15. Paramétrage d'un chantier               |              |     ✓      |             |            |           |             |             |           |             |             |                 |         |         |
| 16. Tokens API                              |              |     ✓      |             |            |     ✓     |             |             |           |             |             |                 |         |         |
| 17. Mon profil utilisateur                  |              |     ✓      |             |            |           |      ✓      |             |           |             |             |                 |         |         |
| 18. Assistant IA - Accès                    |              |     ✓      |             |            |           |             |             |           |             |      ✓      |                 |    ✓    |         |
| 18. Assistant IA - Appels directs           |              |     ✓      |             |     ✓      |           |             |             |           |             |             |                 |         |         |

En 11.6, le compte Services déconcentrés départementaux est la cible de la désactivation, pas le profil connecté. En 16, le compte Cabinet MTFP n'est pas connecté : il reçoit le token utilisé pour l'open-api.

**Identifiants des profils :**

| Abréviation              | Email                                                                                              |
|--------------------------|----------------------------------------------------------------------------------------------------|
| DITP Admin               | `ditp.admin@example.com` (aussi `E2E_USERNAME`)                                                    |
| DITP Pilot.              | `ditp.pilotage@example.com`                                                                        |
| PM Cabinet               | `premiere.ministre@example.com`                                                                    |
| Cab. MTFP                | `cabinet.mtfp@example.com`                                                                         |
| Coord. Rég.              | `coordinateur.region@example.com` ; `pva.coordinateur.reg@example.com` (PVA) ; `modale.profil@example.com` (modale de profil) |
| Coord. Dept              | `coordinateur.departement@example.com` ; `pva.coordinateur.dept@example.com` (PVA, chantier avec hab.) ; `saisie.coordinateur.dept@example.com` (saisie) |
| Sec. Gén.                | `secretariat.general@example.com`                                                                  |
| Préfet Rég.              | `prefet.region@example.com` ; `chantier.prefet.reg@example.com` (chantier avec hab.)               |
| Préfet Dept              | `prefet.departement@example.com` ; `pva.prefet.dept@example.com` (PVA) ; `saisie.prefet.dept@example.com` (saisie) |
| Préfet Dept multi-terr.  | `prefet.multi.territoires@example.com` (cible, jamais connecté)                                    |
| Éq. Dir. Projet          | `equipe.dir.projet@example.com` ; `pva.dir.projet@example.com` (PVA)                               |
| SD Rég.                  | `services.deconcentres.region@example.com`                                                         |
| SD Dept                  | `services.deconcentres.departement@example.com` (cible, jamais connecté)                           |
| SD hors ATE              | `services.deconcentres.hors-ate@example.com` (cible, jamais connecté)                              |
