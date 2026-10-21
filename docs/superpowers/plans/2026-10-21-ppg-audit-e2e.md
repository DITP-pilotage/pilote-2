# Audit e2e pilote-ppg Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (exécution inline). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Combler les trous de couverture e2e de pilote-ppg (autorisations, cloisonnement, open-api, saisie, accueil, créations) et fiabiliser les specs existants, PR verte.

**Architecture:** Deux briques d'outillage (client tRPC/API interne authentifié par cookie, nouveaux types de nettoyage `e2eContext`) et des entités dédiées dans le seed ; puis un spec ou un groupe de specs par bloc du design, chacun commité séparément ; enfin fiabilisation, doc, synchro Confluence.

**Tech Stack:** Playwright 1.63, Next 16 (pages router + app router pour Albert), tRPC 11 + superjson, Prisma (nettoyage), PostgreSQL seedé par `tests/seed/seed.sh`.

**Spec:** `docs/superpowers/specs/2026-10-21-ppg-audit-e2e-design.md`

## Global Constraints

- Aucun test qui échoue sur le code actuel n'est commité, ni marqué `test.fail`/`fixme`. Test qui révèle une faille (accès qui passe, ou 500) → retiré, ajouté à la description de PIL-1921, listé dans la PR.
- Refus avec un autre code que celui annoncé, sans fuite de données → on asserte le code exact constaté.
- Pas de 403/404 obtenu sur une entité inexistante : chantiers hors périmètre réels (CH-070 pour EQUIPE_DIR_PROJET).
- Une entité dédiée du seed n'est écrite que par un seul spec.
- Tout ce qu'un test écrit est nettoyé par `e2eContext` (pas par l'IHM en fin de test).
- Code technique en anglais, termes métier en français ; pas d'accents dans les noms de fichiers ni les identifiants créés ; exports nommés ; pas de commentaires superflus ; jamais `as never` / `as unknown`.
- Lint : `pnpm -C apps/pilote-ppg lint` (oxlint) avant chaque commit.
- E2E : `pnpm test:e2e` (vidéo off), jamais `E2E_VIDEO=on`. Avant chaque campagne, demander à la session `worktree-2-cc` de couper ses serveurs ; la libérer après.
- Après changement de branche ou déplacement de fichiers : `rm -rf apps/pilote-ppg/.next` et `prisma generate`.
- Commits via le format commit-billable : `[DITP-pilotage/pilote-2] infra(PIL-1846): …`, trailers `Refs: PIL-1846`, `Category: infra`, `Tags: tests` (+ `security`, `documentation` selon le commit). Pas de trace de Claude.
- Rester à la racine du worktree, chemins absolus, jamais de `cd` dans un sous-dossier.

## Review Focus

- Un spec qui passe en local à 4 workers mais dépend de l'ordre : chaque spec nouveau ou modifié est passé avec `--repeat-each=3` (tâche par tâche) et la suite complète à la fin.
- Le seed enrichi change des comptages (listes d'accueil, exports, listing indicateurs admin) : la suite complète est rejouée dès la tâche 2.
- Un nettoyage qui ne s'exécute pas quand le test échoue au milieu : tout nettoyage passe par `e2eContext.track` posé **avant** l'action qui écrit.
- Un refus tRPC renvoyé en 200 avec une erreur dans le corps batch : le client tRPC lit le statut HTTP **et** `error.data.code` ; les assertions portent sur les deux.
- Le jeton CSRF absent parce que la page n'a jamais été servie après la connexion : le client lit le cookie `csrf` du contexte après `loginAs` (qui fait un `goto("/")`), et échoue explicitement s'il manque.

---

### Task 1 : Outillage d'appel direct et nettoyages

**Files:**
- Create: `apps/pilote-ppg/tests/api-client/trpc.client.ts`
- Modify: `apps/pilote-ppg/tests/e2e-test-context.ts`
- Modify: `apps/pilote-ppg/tests/open-api/api-client/api-test-context.ts`, `open-api.client.ts`
- Test: `apps/pilote-ppg/tests/api-autorisation.spec.ts` (premier test, complété en tâche 3)

**Interfaces:**
- Produces:
  - `class TrpcClient { constructor(page: Page); query<T>(path: string, input?: unknown): Promise<TrpcResult<T>>; mutation<T>(path: string, input: Record<string, unknown>, options?: { csrf?: string | null }): Promise<TrpcResult<T>> }`
  - `type TrpcResult<T> = { status: number; data: T | null; errorCode: string | null; location: string | null }`
  - Requêtes non batch : query `GET /api/trpc/<path>?input=<superjson.serialize(input)>`, mutation `POST /api/trpc/<path>` corps `superjson.serialize({ ...input, csrf })`, `maxRedirects: 0`. `csrf` par défaut = valeur du cookie `csrf` du contexte (erreur explicite s'il manque) ; `csrf: null` l'omet.
  - `E2ETestContext.track` accepte en plus : `UTILISATEUR_CREE {email}`, `INDICATEUR_CREE {id}`, `SYNTHESE_CREEE {filtres}`, `OBJECTIF_CREE {filtres}`, `DECISION_STRATEGIQUE_CREEE {filtres}`, `TOKEN_API_CREE {email}`, `CHANTIER_PARAMETRAGE_MODIFIE {chantierId, originalData}`, `INDICATEUR_MODIFIE {id, originalData}`, `RAPPORT_IMPORT_CREE` filtré par `{ id: rapportId }`. Les types sont ajoutés au fil des tâches qui en ont besoin, pas tous ici.
  - `ApiTestContext` : `dispose()` idempotent ; `OpenApiClient.postIndicateurDonnees(chantierId, indicateurId, body)`.

- [ ] **Step 1 : Écrire le test** `api-autorisation.spec.ts › sans session, une mutation tRPC est redirigée vers la connexion` : contexte vierge, `POST /api/trpc/utilisateur.desactiver` → `status === 303`, `location` contient `/connexion?callbackUrl=`. Et `ditp.pilotage peut lire sa propre session via tRPC` : `loginAs("ditp.pilotage@example.com")`, une query anodine (`utilisateur` ou `chantier` de lecture existante) → `status === 200`, `data` non null.
- [ ] **Step 2 : Lancer** `pnpm -C apps/pilote-ppg exec playwright test api-autorisation` → FAIL (`TrpcClient` absent).
- [ ] **Step 3 : Implémenter** `TrpcClient` (superjson est déjà une dépendance de l'app).
- [ ] **Step 4 : Relancer** → PASS ; inverser une assertion pour voir rouge, revenir.
- [ ] **Step 5 : Lint + commit** `infra(PIL-1846): client tRPC authentifié pour les e2e`.

### Task 2 : Entités dédiées dans le seed

**Files:**
- Create: `apps/pilote-ppg/tests/seed/seed-entites-dediees.sql`
- Modify: `apps/pilote-ppg/tests/seed/seed.sh` (exécuter le fichier en dernier), `apps/pilote-ppg/tests/seed/utilisateurs-test.sql`
- Create: `apps/pilote-ppg/tests/seed/entites-dediees.ts`

**Interfaces:**
- Produces (constantes exportées de `entites-dediees.ts`) :
  - `CHANTIER_BROUILLON = "CH-901"` : copie de CH-070 (`chantier_identite`, `chantier_territoire`), `statut = 'BROUILLON'`, nom « Chantier brouillon e2e ».
  - `CHANTIER_OPEN_API = "CH-902"` : copie de CH-054, `PUBLIE`, cible des imports open-api.
  - `INDICATEUR_IMPORT = "IND-901"`, `INDICATEUR_FORMULAIRE = "IND-902"`, `INDICATEUR_OPEN_API = "IND-903"` : copies d'IND-021 rattachées à CH-054 (`IND-903` rattaché à CH-902), avec leurs lignes `indicateur_territoire` et `raw_data.metadata_indicateurs*`.
  - `CHANTIER_HORS_PERIMETRE_EQUIPE_DIR_PROJET = "CH-070"`.
- Copie générique sans liste de colonnes : `CREATE TEMP TABLE t AS SELECT * FROM <table> WHERE <id> = '<source>'; UPDATE t SET …; INSERT INTO <table> SELECT * FROM t; DROP TABLE t;`.
- Habilitations : CH-901 et CH-902 ajoutés aux chantiers de `equipe.dir.projet` (lecture, saisieCommentaire, saisieIndicateur) ; CH-901 ajouté à `services.deconcentres.region` (lecture, profil sans accès brouillons).

- [ ] **Step 1 : Écrire le SQL** et l'appel dans `seed.sh`.
- [ ] **Step 2 : Vérifier le seed** : `pnpm test:e2e:seed` puis `psql` → `SELECT id, statut FROM chantier_identite WHERE id IN ('CH-901','CH-902')` renvoie 2 lignes ; `SELECT count(*) FROM indicateur_identite WHERE id LIKE 'IND-90%'` = 3.
- [ ] **Step 3 : Suite complète** `pnpm test:e2e` → 61 passed + tests de la tâche 1. Ajuster les comptages cassés dans les specs existants en expliquant pourquoi.
- [ ] **Step 4 : Lint + commit** `infra(PIL-1846): entités dédiées dans le seed e2e`.

### Task 3 : `api-autorisation.spec.ts`

**Files:**
- Modify: `apps/pilote-ppg/tests/api-autorisation.spec.ts`
- Modify: `apps/pilote-ppg/tests/e2e-test-context.ts` (si une mutation réussie doit être nettoyée)

**Interfaces:**
- Consumes: `TrpcClient`, `AppActions.loginAs`, constantes de `entites-dediees.ts`.

Tests (un `test.describe` par famille, noms = comportement) :
- [ ] **Step 1 : Sans session** — `GET /api/trpc/chantier.<query de lecture>`, `GET /api/export/chantiers-v2`, `POST /api/albert/chat` → 303 vers `/connexion?callbackUrl=`.
- [ ] **Step 2 : `utilisateur.*`** —
  - `prefet.departement` (sans gestion) `utilisateur.creer` d'un compte DEPT-56 → refus (`errorCode` attendu `FORBIDDEN`) et aucun utilisateur créé en base.
  - `coordinateur.departement` (DEPT-56/29/35/22) `utilisateur.creer` sur DEPT-13 → refus, rien créé.
  - `coordinateur.departement` `utilisateur.desactiver` de `prefet.region@example.com` (hors périmètre) → refus, `date_desactivation` toujours null.
  - `coordinateur.departement` `utilisateur.reactiver` hors périmètre → refus.
  - `ditp.admin` `utilisateur.desactiver` sans `csrf` (`{ csrf: null }`) et avec un `csrf` faux → `FORBIDDEN`, rien modifié.
  - `desactiverVideoAccueil` / `desactiverPopupInfolettre` sur l'`utilisateurId` d'un autre compte, `envoyerMailInscriptionInfolettre` sur l'email d'un autre : constater ; si ça passe → règle des surprises (PIL-1921), pas de test commité.
- [ ] **Step 3 : Tokens API** — `equipe.dir.projet` `gestionTokenAPI.creerTokenAPI` et `supprimerTokenAPI` → refus ; aucune ligne `token_api_information` créée/supprimée.
- [ ] **Step 4 : Paramétrage chantier** — `coordinateur.region` : `parametrageChantier.list`, `get`, `getIndicateursPonderations` → refus ; `save` et `savePonderationsIndicateurs` (CSRF valide) → refus, rien modifié en base.
- [ ] **Step 5 : Lancer** `playwright test api-autorisation --repeat-each=3` → tout vert. Pour chaque refus, vérifier une fois qu'un appel autorisé équivalent (DITP_ADMIN) réussit, pour prouver que le refus vient de l'habilitation et non d'une entrée invalide (ce contrôle peut être un test à part entière quand l'écriture est nettoyable).
- [ ] **Step 6 : Lint + commit** `infra(PIL-1846): e2e d'autorisation des routes tRPC` (Tags: tests, security). Mettre à jour PIL-1921 si des surprises.

### Task 4 : Accès hors périmètre par URL et gardes du panel admin

**Files:**
- Create: `apps/pilote-ppg/tests/acces-hors-perimetre.spec.ts`, `apps/pilote-ppg/tests/gardes-panel-admin.spec.ts`
- Modify: `apps/pilote-ppg/tests/information-chantier.spec.ts:122-128`

- [ ] **Step 1 : `acces-hors-perimetre`** —
  - `coordinateur.departement` → `/chantier/CH-129/DEPT-13` : statut constaté 404 (jamais 500).
  - `equipe.dir.projet` → `/chantier/CH-070/NAT-FR` → 404.
  - `coordinateur.departement` → `/accueil/chantier/DEPT-13` → redirigé vers un territoire habilité (URL finale ≠ DEPT-13).
- [ ] **Step 2 : `information-chantier.spec.ts`** — remplacer CH-001 par CH-070 pour `equipe.dir.projet`.
- [ ] **Step 3 : `gardes-panel-admin`** — tableau paramétré `{ chemin, attendu: "redirection" | "404" }` couvrant toutes les pages de `src/pages/panel-administrateur/**` (avec un id réel pour les `[id]`) et `/admin/utilisateurs`, `/admin/utilisateur/creer` ; profils non admin : `ditp.pilotage`, `coordinateur.region`, `equipe.dir.projet` (pour `/admin/utilisateurs` : un profil sans gestion, `prefet.departement`). Pour les pages gardées par la session seule (`centre-aide`, `feature-flipping`, `logs`, `nouveaute`, `parametrage-metadata-chantier`) : vérifier qu'aucune donnée sensible n'est affichée (logs, flags, métadonnées chantier) et que les mutations de la page refusent via `TrpcClient` ; sinon règle des surprises.
- [ ] **Step 4 : Lancer** les 3 specs `--repeat-each=3` → vert.
- [ ] **Step 5 : Lint + commit** `infra(PIL-1846): e2e des accès hors périmètre et des gardes du panel admin`.

### Task 5 : Cloisonnement des exports CSV

**Files:**
- Create: `apps/pilote-ppg/tests/export-csv-cloisonnement.spec.ts`
- Modify: `export-csv-chantier.spec.ts`, `export-csv-indicateur.spec.ts`, `export-csv-historique-indicateur.spec.ts`, `export-csv-utilisateur.spec.ts` (au moins une ligne de contenu vérifiée)

- [ ] **Step 1 : Tests par `page.request.get`** (cookie du profil connecté), CSV parsé ligne à ligne :
  - `services.deconcentres.region` → `/api/export/chantiers-v2` : contient CH-070 / CH-054, ne contient ni CH-129 ni CH-901 ; avec `?statut=BROUILLON` : CH-901 toujours absent.
  - `equipe.dir.projet` → `?statut=BROUILLON` : CH-901 présent.
  - Même logique pour `indicateurs-v2` (IND de CH-901 absents/présents) et `historique-indicateurs` (territoires hors Bretagne absents pour un profil régional).
  - `/api/export/utilisateurs` : `prefet.departement` → refus (code constaté) ; `coordinateur.departement` → seuls des comptes de ses départements.
- [ ] **Step 2 : Specs existants** : vérifier une ligne de données connue en plus de l'en-tête.
- [ ] **Step 3 : Lancer** `--repeat-each=3` → vert.
- [ ] **Step 4 : Lint + commit** `infra(PIL-1846): e2e du cloisonnement des exports CSV` (Tags: tests, security).

### Task 6 : Open-api

**Files:**
- Create: `apps/pilote-ppg/tests/open-api/import-donnee-indicateur.spec.ts`
- Modify: tous les specs de `tests/open-api/`, `api-test-context.ts`, `open-api.client.ts`

- [ ] **Step 1 : `import-donnee-indicateur`** — `equipe.dir.projet` POST sur `CH-902/IND-903` (format accepté par `importDonneeIndicateurAPIHandler`) → succès ; GET relit les valeurs postées ; nettoyage des mesures (`track` avant le POST). Négatifs : profil `ditp.pilotage` sans `saisieIndicateur` → 403 ; `CH-070/<indicateur de CH-070>` → 403 ; corps invalide → 400 avec `erreurs` non vide et vérifiées.
- [ ] **Step 2 : Fiabilisation** — tous les specs passent sur `./fixtures` ; `dispose` dans un `finally` (ou fixture) ; `toBeDefined` remplacés par des valeurs ; CH-999 → CH-070 dans les 4 specs d'import ; imports écrits sur `CHANTIER_OPEN_API` et nettoyés (`COMMENTAIRE_CREE`, `SYNTHESE_CREEE`, `OBJECTIF_CREE`, `DECISION_STRATEGIQUE_CREEE`).
- [ ] **Step 3 : `error-management.spec.ts:47`** — chercher une erreur inattendue provocable proprement (ex. entrée qui fait lever une exception non `PiloteError`) ; sinon supprimer le test et le noter pour la PR.
- [ ] **Step 4 : Tokens** — `ApiTestContext` garde l'upsert partagé (commentaire existant) ; seuls les tokens créés par les tests de la tâche 8 sont supprimés.
- [ ] **Step 5 : Lancer** `playwright test open-api --repeat-each=3` → vert.
- [ ] **Step 6 : Lint + commit** `infra(PIL-1846): e2e open-api des données indicateur et fiabilisation des specs open-api`.

### Task 7 : Saisie des publications et accueil

**Files:**
- Create: `apps/pilote-ppg/tests/saisie-commentaire.spec.ts`, `apps/pilote-ppg/tests/accueil.spec.ts`
- Modify: `apps/pilote-ppg/tests/pages/page-chantier.ts` (rebrancher `expectHistoriqueCommentaire`), `pages/page-accueil.ts` (`expectFilterTag`)

- [ ] **Step 1 : `saisie-commentaire`** (sur CH-902 national, nettoyage `COMMENTAIRE_CREE` / `SYNTHESE_CREEE`) :
  - `equipe.dir.projet` publie un commentaire national → visible, puis présent dans l'historique.
  - `coordinateur.departement` enregistre un brouillon DEPT-56 sur un chantier de son périmètre → visible pour lui ; `prefet.departement` (même territoire) ne le voit pas.
  - Publication de la météo (synthèse des résultats) → la météo choisie apparaît sur la page chantier et sur l'accueil pour ce chantier.
- [ ] **Step 2 : `accueil`** :
  - `ditp.admin` voit les 13 chantiers publiés du seed + CH-902 ; `equipe.dir.projet` voit exactement ses chantiers (CH-054/058/062/051/129/901/902), pas CH-070.
  - `coordinateur.departement` sur `/accueil/chantier/DEPT-13` → redirection (si non déjà couvert en tâche 4, sinon le retirer d'ici).
  - Filtre ministère : la liste se restreint aux chantiers du ministère choisi et le tag de filtre s'affiche.
- [ ] **Step 3 : Lancer** les 2 specs `--repeat-each=3` → vert.
- [ ] **Step 4 : Lint + commit** `infra(PIL-1846): e2e de saisie des publications et de l'accueil`.

### Task 8 : Créations de bout en bout, Albert, tokens et paramétrage chantier

**Files:**
- Modify: `admin-gestion-utilisateurs-formulaire.spec.ts`, `admin-indicateurs-formulaire.spec.ts`, `acces-assistant-ia.spec.ts`, `pages/admin/page-admin-indicateur-form.ts`, `pages/admin/page-utilisateur-detail.ts`
- Create: `apps/pilote-ppg/tests/gestion-token-api.spec.ts`, `apps/pilote-ppg/tests/parametrage-chantier.spec.ts`

- [ ] **Step 1 : Création d'utilisateur** — `ditp.admin` crée `e2e.creation@example.com` par le formulaire (track `UTILISATEUR_CREE` avant soumission) → présent dans la liste ; recréation avec le même email → message d'erreur de conflit.
- [ ] **Step 2 : Création d'indicateur** — soumission réelle (`clickCreerIndicateur`, `remplirChampTexte`, `expectAlerteSuccesCreation`), relecture dans le listing, track `INDICATEUR_CREE`. Le test de modification passe d'IND-021 à `INDICATEUR_FORMULAIRE` avec `INDICATEUR_MODIFIE {originalData}` ; la restauration par l'IHM en fin de test disparaît.
- [ ] **Step 3 : Albert** (dans `acces-assistant-ia.spec.ts`, `page.request`) — compte sans accès Albert → `POST /api/albert/chat` = 403 ; rapports : `/api/albert/rapports/<autre userId>/x.pdf` = 403, nom invalide = 400, fichier absent = 404. Aucun appel LLM (vérifier qu'aucun test n'atteint le cas « accès autorisé »).
- [ ] **Step 4 : Tokens API** — `ditp.admin` génère un token pour `equipe.dir.projet` par l'IHM (page `/panel-administrateur/gestion-token-api` ou fiche utilisateur, selon l'écran réel ; `genererToken` rebranché), track `TOKEN_API_CREE` ; appel open-api `healthcheck`/GET chantier avec ce token → 200 ; révocation par l'IHM → même appel = 403. Attention : la ligne `token_api_information` de `equipe.dir.projet` est partagée avec les specs open-api : utiliser un autre compte (`ditp.pilotage` ou un compte seed dédié).
- [ ] **Step 5 : Paramétrage chantier** — `ditp.admin` sur `/panel-administrateur/chantiers/CH-902` : modifier un champ et les pondérations, enregistrer, recharger → valeurs relues ; track `CHANTIER_PARAMETRAGE_MODIFIE` avec l'original.
- [ ] **Step 6 : Lancer** les specs touchés `--repeat-each=3` → vert.
- [ ] **Step 7 : Lint + commit** (deux commits si le diff s'y prête : créations ; Albert + tokens + paramétrage).

### Task 9 : Fiabilisation restante

**Files:**
- Modify: `mon-profil-utilisateur.spec.ts`, `pages/page-mon-profil-utilisateur.ts`, `import-donnee.spec.ts`, `pages/page-mise-a-jour-donnees.ts`, `pages/admin/page-utilisateurs.ts`
- Delete: `pages/admin/page-gestion-token-api.ts` (si non rebranché en tâche 8) et méthodes mortes restantes

- [ ] **Step 1 : `mon-profil`** — l'étape des dates asserte la date attendue (valeur du seed ou date du jour selon le champ) ; nettoyage par `PROFIL_UTILISATEUR_MODIFIE` avec `originalData = { fonction: "Administrateur", service: "DITP" }` lus en base avant modification.
- [ ] **Step 2 : `import-donnee`** — `goto` direct vers la page de mise à jour de `INDICATEUR_IMPORT` ; l'id du rapport est lu dans la réponse de vérification et suivi par `RAPPORT_IMPORT_CREE {id}`.
- [ ] **Step 3 : `page-utilisateurs`** — supprimer `networkidle` et `waitForTimeout`, attendre des éléments précis.
- [ ] **Step 4 : Page objects morts** — supprimer tout ce qui n'est toujours pas utilisé (liste de l'état des lieux : `expectStructure` de `page-accueil`/`page-chantier`, `expectTitle`, `logout`, `expectReactiverNotVisible`, `expectNombreComptes`, `expectGestionDesComptesVisible`, `expectIndicateurAbsentDuTableau`, `expectLienIndicateursDesChangtiersVisible`, `page-connexion.goto`, `page-gestion-token-api.ts`).
- [ ] **Step 5 : Lancer** `import-donnee --repeat-each=5` → 5/5 vert ; specs touchés `--repeat-each=3` → vert.
- [ ] **Step 6 : Lint + commit** `infra(PIL-1846): fiabilisation des specs e2e existants`. Mettre à jour la mémoire `project_flaky_import_donnee`.

### Task 10 : Documentation, Confluence, campagne finale

**Files:**
- Modify: `apps/pilote-ppg/docs/tests-e2e-couverture.md`

- [ ] **Step 1 : Doc** — ajouter `connexion.spec.ts` et les nouveaux specs ; corriger routes `/admin/indicateurs` et météos obsolètes ; aligner chaque vérification annoncée sur le test réel ; mettre à jour la matrice profils × tests ; section « Non couvert » renvoyant à PIL-1921 / PIL-1922.
- [ ] **Step 2 : Campagne finale** — couper worktree-2, `pnpm test:e2e` complet → tout vert ; noter le nombre de tests et la durée.
- [ ] **Step 3 : Lint + commit** `infra(PIL-1846): doc de couverture e2e à jour` (Tags: documentation).
- [ ] **Step 4 : Confluence** — synchroniser la page 349077505 avec le document.
- [ ] **Step 5 : Push + PR** vers `dev` (sans gif) : résumé par bloc, failles trouvées et reportées dans PIL-1921, tests sortis vers PIL-1921/1922, résultat de la campagne finale. Puis libérer worktree-2.

### Task 11 : Firefox et WebKit sur les specs IHM

Ajout demandé par l'utilisateur le 2026-10-21. Pas de configuration conditionnelle local/CI : si la CI doit suivre, elle suit.

**Files:**
- Modify: `apps/pilote-ppg/playwright.config.ts`, `.github/workflows/e2e.yml`

- [ ] **Step 1 : Projets** `firefox` et `webkit` dans la config, chaînés par `dependencies` (chromium → firefox → webkit) pour ne jamais écrire en parallèle sur la même base ; specs d'appels directs (`api-autorisation`, `open-api/**`, `export-csv-cloisonnement`, tests `page.request` purs) exclus de firefox et webkit via `testIgnore`.
- [ ] **Step 2 : Local** — `playwright install firefox webkit`, puis suite complète → vert sur les 3 projets ; instabilités propres à un navigateur corrigées dans les specs (pas de `skip` par navigateur sans ruling).
- [ ] **Step 3 : CI** — `playwright install chromium firefox webkit --with-deps` dans `e2e.yml`.
- [ ] **Step 4 : Doc** — mentionner les navigateurs couverts dans `tests-e2e-couverture.md`.
- [ ] **Step 5 : Lint + commit** `infra(PIL-1846): e2e IHM sur Firefox et WebKit`.
