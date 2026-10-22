# Audit e2e pilote-ppg : combler les trous et fiabiliser — design

Ticket : [PIL-1846](https://data-ditp.atlassian.net/browse/PIL-1846). Tickets liés : [PIL-1921](https://data-ditp.atlassian.net/browse/PIL-1921) (failles d'autorisation API, tRPC, SSR), [PIL-1922](https://data-ditp.atlassian.net/browse/PIL-1922) (habilitations de l'assistant IA).

## Intention

Sécuriser au maximum, intelligemment, ce qui peut l'être en e2e dans `apps/pilote-ppg/tests` : aujourd'hui tous les e2e passent par l'IHM, aucun n'appelle une route avec un profil non autorisé, plusieurs tests ne peuvent pas échouer et les données partagées (IND-021, CH-129) sont modifiées sans restauration fiable. Le seed e2e peut être modifié autant que nécessaire : il est fait pour ça.

## Livraison

- Une branche `test/PIL-1846-audit-e2e`, une seule PR vers `dev`, plusieurs commits (un par bloc ci-dessous).
- Pas de gif dans la PR. Les e2e se lancent vidéo off (`pnpm test:e2e`) ; le critère est qu'ils passent.
- La PR est verte : **aucun test qui échoue sur le code actuel n'est commité**, ni marqué `test.fail`/`fixme`.
- **Preuve que les e2e passent** *(décision du rédacteur)* : le workflow `.github/workflows/e2e.yml` ne tourne pas sur les PR (cron + `workflow_dispatch`), et on n'attend pas la CI. La preuve est locale : suite complète `pnpm test:e2e` verte à la fin, et chaque spec nouveau ou modifié passé avec `--repeat-each=3` pour débusquer le flaky lié au parallélisme (4 workers en local). `import-donnee` est déclaré « plus flaky » après au moins 5 passes consécutives vertes. Un `workflow_dispatch` sur la branche peut être proposé en fin de PR, sans l'attendre. Le déclencheur `pull_request` n'est pas ajouté (hors périmètre).
- **Entités partagées entre workers** : une entité dédiée du seed n'est écrite que par un seul spec ; si plusieurs tests d'un même spec l'écrivent, le spec passe en mode série.

## Frontière avec PIL-1921 et PIL-1922

Les tests qui ciblent une faille connue sont écrits avec sa correction, dans le ticket correspondant (descriptions Jira déjà mises à jour le 2026-10-21) :

- **PIL-1921** : C1 (vérification/publication d'import UI), C2 (POST open-api sur indicateur non rattaché, Content-Type non supporté), C3 (import/export métadonnées indicateurs), C4 (`propositionValeurAvancement.supprimer`), C5 (fiche conducteur hors périmètre), C6 (`/admin/utilisateur/[id]` d'un autre compte), C7 (tRPC de lecture), H4 (GET open-api filtré par territoire, indicateur non rattaché), H5 (PVA `territoireCode`).
- **PIL-1922** : `albert.evaluer` sur le chat d'un autre, outils Albert hors périmètre.

**Règle pour les surprises** : si un test prévu ici révèle une faille (il échoue parce que le code laisse passer), il n'est pas commité. La faille et le test sont ajoutés à PIL-1921 (description Jira), et la PR la liste. Candidates connues, repérées à la lecture : `utilisateur.desactiverVideoAccueil`, `desactiverPopupInfolettre`, `envoyerMailInscriptionInfolettre` (identifiant pris dans l'input, pas comparé à la session) ; `gestionTokenAPI.creerTokenAPI`/`supprimerTokenAPI` sans `checkCsrf`. Inversement, une faille listée déjà corrigée garde son test ici.

**Code de refus différent de celui annoncé** *(décision du rédacteur)* : les codes cités dans ce document (403, 404, FORBIDDEN, redirection) sont attendus, pas imposés. Si le code refuse autrement (401 au lieu de 403, 404 au lieu de 403, UNAUTHORIZED au lieu de FORBIDDEN, redirection au lieu de 404) sans exposer aucune donnée, le test asserte le code réellement constaté, exact (pas de « refus » générique), et il est commité. Seuls deux cas relèvent de la règle des surprises : l'accès passe (données renvoyées ou écriture effectuée), ou la réponse est une 500.

**Pages admin gardées par la session seule** *(décision du rédacteur)* : est considéré comme sensible ce qu'un utilisateur non admin ne voit nulle part ailleurs dans l'application : journaux applicatifs (`logs`), configuration des feature flags (`feature-flipping`), métadonnées chantier non publiées. Le contenu du centre d'aide et des nouveautés est destiné à tous les utilisateurs : sa simple lecture n'est pas une faille, seule sa modification doit être refusée. Si une page sensible affiche ses données à un non-admin, règle des surprises.

## État actuel utile (lu au commit 85413860b)

- Connexion : `AppActions.loginAs(email)` (`tests/actions/app.actions.ts`) via `/api/auth/callback/credentials`, pas de `storageState`. Comptes seed dans `tests/seed/utilisateurs-test.sql` (DITP_ADMIN, EQUIPE_DIR_PROJET sur CH-054/058/062/051/129, coordinateurs/préfets REG-53 et DEPT-56/29/35/22, comptes `pva.*` sur CH-129, etc.).
- Seed (`tests/seed/seed.sh`) : chantiers CH-050…CH-155 tous `PUBLIE` (aucun brouillon) ; CH-001/002/003, CH-039, CH-999 n'existent pas.
- Nettoyage : fixture `e2eContext` (`tests/fixtures.ts`, `tests/e2e-test-context.ts`) avec `track(type, filtres)`. Les specs open-api importent `test` de `@playwright/test` et ne nettoient rien.
- Sans cookie, le proxy (`src/proxy.ts:99-127`) répond **303 vers `/connexion?callbackUrl=…`** pour `/api/trpc/*`, `/api/export/*`, `/api/albert/*` : c'est le comportement attendu à tester, pas un 401.
- tRPC : `protectedProcedure` (UNAUTHORIZED sans session), `checkCsrf` (FORBIDDEN) sur les mutations.
- Aucun helper pour appeler tRPC ou `/api/*` directement.
- Playwright : `fullyParallel:false`, 2 workers en CI, 4 en local, un seul projet chromium.

## 1. Outillage

- **Client interne authentifié** : à partir d'une `page` connectée via `loginAs`, appeler `/api/*` et tRPC (`query` en GET, `mutation` en POST au format de batch/transformer réellement utilisé par l'app) avec le cookie et le jeton CSRF attendus par `checkCsrf`. Retourne statut HTTP + code d'erreur tRPC pour des assertions précises.
- **`OpenApiClient`** : ajout du POST des données indicateur (JSON et multipart selon ce que la route accepte). Tous les usages de `dispose()` passent dans un `finally` (ou une fixture qui dispose automatiquement).
- **`ApiTestContext`** : les tokens API créés sont supprimés en fin de test.
- **Suivi `e2eContext`** : nouveaux types de nettoyage selon les besoins (utilisateur créé, indicateur créé, commentaires/synthèses/objectifs/décisions créés, token API, paramétrage chantier modifié avec restauration de l'original, rapport d'import par `rapportId`). Les specs open-api passent sur `./fixtures` pour en bénéficier.

## 2. Seed

Ajouts autorisés et attendus, en veillant à ne pas casser les specs qui comptent des lignes (exports, listings, matrices) :

- Un **chantier en `BROUILLON`**, visible des profils ayant accès aux brouillons (EQUIPE_DIR_PROJET, DITP_ADMIN, DITP_PILOTAGE) et habilité pour au moins un profil sans accès aux brouillons, pour prouver qu'il lui est masqué.
- Des **entités dédiées aux tests qui écrivent** : un indicateur dédié à `import-donnee`, un indicateur dédié au formulaire indicateur (modification), un chantier dédié aux imports open-api et à la saisie de publications si nécessaire. IND-021 et CH-129 ne sont plus modifiés que par les tests PVA, qui les nettoient déjà.
- Les références à des chantiers inexistants (CH-001, CH-039, CH-999) sont remplacées par des chantiers réels hors périmètre du profil testé (ex. CH-070 pour EQUIPE_DIR_PROJET), afin qu'un 403/404 prouve un refus d'habilitation et non une absence.
- Comptes supplémentaires si un scénario l'exige (ex. compte sans gestion d'utilisateurs, compte d'un autre territoire).

## 3. Nouveaux tests

### 3.1 `api-autorisation.spec.ts` (appels directs)

- Sans cookie : un échantillon de routes tRPC, export et Albert répond 303 vers `/connexion`.
- Mutations `utilisateur.*` : `creer`/`modifier` hors périmètre (territoire ou chantier non géré, profil sans gestion) → FORBIDDEN ; `desactiver`/`reactiver` d'un compte hors périmètre → FORBIDDEN ; sans jeton CSRF → FORBIDDEN. Les trois routes candidates (vidéo d'accueil, popup et mail infolettre) sur l'identifiant d'un autre compte : selon la règle des surprises.
- `gestionTokenAPI.creerTokenAPI`/`supprimerTokenAPI` par un profil non DITP_ADMIN → refus.
- `parametrageChantier.*` (lecture, `save`, `savePonderationsIndicateurs`) par un profil non DITP_ADMIN → FORBIDDEN.

### 3.2 Accès hors périmètre par URL

- `/chantier/CH-129/DEPT-13` pour un coordinateur DEPT-56 → 404, jamais 500 (comportement réel à constater ; la page ne contrôle aujourd'hui que le chantier, pas le territoire : si l'accès passe, règle des surprises).
- Spec paramétré des gardes du panel admin : chaque page de `/panel-administrateur/*` et `/admin/*` × un ou plusieurs profils non autorisés → redirection ou 404 selon la garde de la page. Les pages gardées seulement par la session (`centre-aide`, `feature-flipping`, `logs`, `nouveaute`, `parametrage-metadata-chantier`) : le test vérifie que les routes tRPC qu'elles appellent refusent ; si la page affiche des données sensibles à un non-admin, règle des surprises.

### 3.3 Cloisonnement des exports CSV

- Chantiers, indicateurs, historique : avec un profil restreint, le CSV ne contient que les chantiers/territoires de son périmètre (lignes attendues présentes, lignes hors périmètre absentes), y compris avec `?statut=BROUILLON` forcé dans l'URL (le chantier brouillon reste absent pour un profil sans accès aux brouillons). Avec un profil ayant accès aux brouillons, il est présent.
- Utilisateurs : refusé à un profil sans gestion ; pour un coordinateur, limité à son périmètre.
- Les exports existants vérifient au moins une ligne de contenu, pas seulement l'en-tête.

### 3.4 Open-api indicateur

- POST nominal (EQUIPE_DIR_PROJET, sur l'indicateur dédié) puis relecture par GET : les valeurs écrites sont relues. Nettoyage des mesures importées.
- Négatifs hors PIL-1921 : profil sans écriture sur le chantier → 403 ; chantier réel hors périmètre → 403 ; corps invalide → 400 avec erreurs.
- Les 4 specs d'import remplacent CH-999 par un chantier réel hors périmètre.

### 3.5 `saisie-commentaire.spec.ts` (par l'IHM)

- Publication d'un commentaire national par un profil habilité, visible dans l'historique (`expectHistoriqueCommentaire` rebranché).
- Brouillon territorial : visible de son auteur, invisible d'un autre compte du même territoire tant qu'il n'est pas publié.
- Publication de la météo (synthèse des résultats) et sa répercussion sur l'accueil.
- Tout ce qui est écrit est nettoyé.

### 3.6 `accueil.spec.ts`

- Liste des chantiers par profil (un profil national, un profil restreint : chantiers attendus présents, hors périmètre absents).
- Accès à `/accueil/chantier/<territoire non habilité>` → redirection.
- Filtre ministère : la liste se restreint au ministère choisi.

### 3.7 Créations de bout en bout

- Création réelle d'un compte utilisateur par l'IHM, puis conflit d'email (même email → message d'erreur). Compte supprimé en nettoyage.
- Soumission réelle de la création d'indicateur (`clickCreerIndicateur`, `remplirChampTexte`, `expectAlerteSuccesCreation` rebranchés), relecture, suppression en nettoyage.

### 3.8 Albert, tokens, paramétrage chantier

- `/api/albert/chat` : 401 sans session (si atteignable derrière le proxy, sinon 303), 403 pour un compte sans accès Albert. Aucun appel au LLM.
- `/api/albert/rapports/[userId]/[filename]` : 403 pour le `userId` d'un autre, 400 pour un nom de fichier invalide, 404 pour un fichier absent.
- Tokens API : génération par l'IHM (DITP_ADMIN, page de gestion des tokens ou fiche utilisateur), appel open-api réussi avec ce token, révocation, puis 403 avec le même token.
- Paramétrage chantier par tRPC (DITP_ADMIN) : `save` et `savePonderationsIndicateurs` puis relecture ; l'original est restauré.

## 4. Fiabilisation de l'existant

- `open-api/error-management.spec.ts:47` : remplacer le faux test « 500 » (qui attend 403) par une vraie erreur inattendue si on peut la provoquer proprement en e2e ; sinon le supprimer et le signaler dans la PR.
- `admin-indicateurs-formulaire.spec.ts` : création réellement soumise (cf. 3.7) ; la modification se fait sur l'indicateur dédié, restaurée même si le test échoue (nettoyage par `e2eContext`, pas par l'IHM en fin de test).
- `mon-profil-utilisateur.spec.ts` : l'étape des dates (l.65-79) vérifie une vraie valeur ; le nettoyage restaure les valeurs du seed (fonction `Administrateur`, service `DITP`).
- `import-donnee.spec.ts` : `goto` direct vers la page de mise à jour, nettoyage par `rapportId`, indicateur dédié. Il ne doit plus être flaky (mettre à jour la mémoire « flaky import-donnee » une fois prouvé).
- Specs open-api : assertions sur les valeurs (pas `toBeDefined`), `dispose` dans un `finally`, nettoyage des écritures sur CH-129 (ou passage sur le chantier dédié).
- `pages/admin/page-utilisateurs.ts` : suppression de `networkidle` et `waitForTimeout`, attente d'éléments précis.
- `information-chantier.spec.ts:122` : `/chantier/CH-001/NAT-FR` remplacé par un chantier réel hors périmètre.
- Page objects morts : rebrancher ceux utiles aux nouveaux tests, supprimer les autres, dont `pages/admin/page-gestion-token-api.ts` (URL obsolète) et les `expectStructure` morts de `page-accueil.ts` et `page-chantier.ts`.

## 5. Documentation

- `apps/pilote-ppg/docs/tests-e2e-couverture.md` : ajouter `connexion.spec.ts` et les nouveaux specs ; corriger les routes `/admin/indicateurs` et les météos obsolètes ; aligner chaque vérification annoncée sur ce que le test fait réellement ; mettre à jour la matrice profils × tests ; ajouter une section « Non couvert » renvoyant à PIL-1921 et PIL-1922.
- Synchroniser la page Confluence 349077505 avec le document.

## Non-objectifs

- Corriger les failles (PIL-1921, PIL-1922).
- PagePilotage, Pilote Eval, pilote-ppg-data-management, Keycloak.
- Tests unitaires ou d'intégration hors Playwright.
- Gifs et vidéos e2e.

## Anti-objectifs

- Un test vert qui ne peut pas échouer (assertion vide, 403 obtenu sur une entité inexistante).
- Un test qui dépend de l'ordre d'exécution ou d'une donnée modifiée par un autre spec.
- Une PR rouge, ou des tests désactivés pour la rendre verte.

## Laissé au builder

- Le découpage exact en commits, dans l'ordre : outillage + seed, puis un commit par bloc de tests, fiabilisation, doc.
- Le choix des profils et entités précis pour chaque scénario, tant qu'ils respectent les règles ci-dessus.
- La forme du client tRPC (fixture ou classe), alignée sur le style des page objects existants.
