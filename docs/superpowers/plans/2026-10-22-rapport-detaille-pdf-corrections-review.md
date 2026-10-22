# Rapport détaillé PDF : corrections de la code review — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger les défauts relevés par la code review de la PR #2488 avant merge : contenu tronqué dans le PDF, génération qui bloque le serveur pour tous les utilisateurs, verrou tenu pendant l'envoi, téléchargement d'une page de login, ancres mortes, `NaN` dans la cartographie.

**Architecture:** La génération pdfmake (construction du document, rendu React des SVG, mise en page) sort du thread principal de Next dans un `worker_thread` lancé par génération, qui renvoie le PDF en `Uint8Array`. Une file sérielle (une génération à la fois, jusqu'à 10 demandes en attente, file commune à tous les utilisateurs d'un conteneur) remplace le booléen `generationInProgress` ; le PDF est envoyé avec `Content-Length` après libération de la file. Les sections du PDF deviennent sécables, avec un titre jamais orphelin en bas de page.

**Tech Stack:** Next 16.3.8 (Turbopack, `output: "standalone"`), Node 24.20.0, `node:worker_threads`, pdfmake 0.3, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-01-rapport-detaille-pdf-serveur-design.md` (spec d'origine de la PR) + les remarques de review reprises ci-dessous.

## Global Constraints

- pnpm 10, jamais npm. Lint : `pnpm -C apps/pilote-ppg lint` (oxlint + tsc + prettier) avant chaque commit.
- Code technique en anglais, seuls les termes domaine en français ; aucun accent dans les nouveaux chemins et identifiants.
- Exports nommés uniquement. Pas de commentaire explicatif superflu. Jamais de `as never` ni `as unknown as X`.
- Tests : `expect(result).toEqual([{...}])` plutôt que `toHaveLength` + accès par index ; pas de variable de 1 ou 2 caractères ; seuls commentaires autorisés : given/when/then.
- Pas de tests front (composants React) : les tâches 4 et 5 côté client se vérifient au lint et par la recette du user.
- Commits via le skill `commit-billable`, préfixe `[DITP-pilotage/pilote-2]`, sans ticket (PoC). Rien n'est poussé sans demande explicite.
- Le worker est empaqueté par Turbopack via `new Worker(new URL("./x.worker.ts", import.meta.url))` : vérifié par un essai le 2026-10-22 (`next build` émet un chunk `.next/server/chunks/[worker thread]-…js`, exécutable en standalone avec les alias `@/` et `react-dom/server`). Aucune étape de build supplémentaire.

## Review Focus

- Un chantier dont une synthèse, des objectifs ou une décision stratégique dépasse une page A4 : tout le texte doit figurer dans le PDF (test tâche 1).
- Quinze utilisateurs cliquent « Télécharger le PDF » en même temps sur le national : les pages et le tRPC des autres utilisateurs restent réactifs, onze demandes (1 en cours + 10 en attente, environ 30 s d'attente au pire) sont servies l'une après l'autre, les suivantes reçoivent un 503 explicite (tests tâche 2 + recette).
- Le worker plante (exception, mémoire dépassée, boucle infinie) : 500 journalisé, la file repart pour la demande suivante, aucun worker zombie (tests tâches 2 et 3).
- Un client lent ou qui abandonne le téléchargement ne bloque plus les autres : la file est libérée avant l'envoi (test tâche 3).
- Session expirée au moment du clic : message d'erreur, pas de fichier HTML enregistré en `.pdf` (recette tâche 4).

---

### Task 1: Sections du PDF sécables, titres jamais orphelins

pdfmake ne garde que la première page d'un bloc `unbreakable` (`PageElementWriter.commitUnbreakableBlock` : « no support for multi-page unbreakableBlocks »), et une ligne de tableau `dontBreakRows` plus haute qu'une page subit le même sort.

**Files:**
- Modify: `apps/pilote-ppg/src/server/rapport-detaille/pdf/section.ts`
- Modify: `apps/pilote-ppg/src/server/pdf/primitives.ts` (`sectionTitlePdf`)
- Modify: `apps/pilote-ppg/src/server/rapport-detaille/pdf/meteoSynthese.ts` (`blocPdf` → `breakable: true`)
- Modify: `apps/pilote-ppg/src/server/rapport-detaille/pdf/generateRapportDetaillePdf.ts` (`pageBreakBefore`)
- Test: `apps/pilote-ppg/src/server/rapport-detaille/pdf/generateRapportDetaillePdf.unit.test.ts`

**Interfaces:**
- Produces: `section(titre, content, options?)` garde sa signature mais n'est plus jamais `unbreakable` ; l'option `breakable` disparaît, et ses appels (`indicateurs.ts:295`, `publications.ts:82`) sont simplifiés. `sectionTitlePdf` pose `headlineLevel: 1` sur le titre. `keepHeadlineWithNext: TDocumentDefinitions["pageBreakBefore"]` est exporté depuis `section.ts`.

- [ ] **Step 1: Write the failing tests** dans `generateRapportDetaillePdf.unit.test.ts`, avec le helper `countPages` existant et un helper local `longHtml(paragraphs: number): string` (`<p>` répétés d'une phrase d'environ 200 caractères) :

```ts
it.each([
  ["la synthèse des résultats", (html: string) => ({ synthèseDesRésultats: { ...buildTestChantierDetail().synthèseDesRésultats!, contenu: html } })],
  ["les objectifs", (html: string) => ({ objectifs: buildTestChantierDetail().objectifs.map((objectif) => ({ ...objectif, contenu: html })) })],
])("garde tout le texte de %s quand il dépasse une page", async (_, override) => {
  const render = (paragraphs: number) =>
    generateRapportDetaillePdf({
      vue: buildTestVueDEnsemble({ chantiers: [buildTestChantier({ id: "A" })] }),
      details: [buildTestChantierDetail({ chantierId: "A", ...override(longHtml(paragraphs)) })],
      context: buildTestContext({ detail: "true" }),
      hideNonApplicable: false,
      now,
    }).getBuffer();

  const pagesWithLongText = countPages(await render(40));
  const pagesWithTripleText = countPages(await render(120));

  expect(pagesWithTripleText).toBeGreaterThanOrEqual(pagesWithLongText + 2);
});
```

Ajuster les noms de champs (`contenu`, nullabilité) à `buildTestChantierDetail` dans `pdf/testHelpers.ts` si besoin, sans changer l'assertion. 40 paragraphes d'environ 200 caractères dépassent déjà une page A4.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -C apps/pilote-ppg exec vitest run --project server-unit generateRapportDetaillePdf`
Expected: FAIL. Le nombre de pages ne bouge pas entre 40 et 120 paragraphes, puisque la section est tronquée à une page.

- [ ] **Step 3: Implement.**
  - `section()` renvoie `{ stack: [sectionTitlePdf(titre), content], margin }`, sans `unbreakable`.
  - `sectionTitlePdf` ajoute `headlineLevel: 1`.
  - `keepHeadlineWithNext` vaut `(currentNode, followingNodesOnPage) => currentNode.headlineLevel === 1 && followingNodesOnPage.length === 0`. C'est le motif documenté par pdfmake contre les titres orphelins.
  - `buildRapportDetailleDocument` renvoie `pageBreakBefore: keepHeadlineWithNext`.
  - Le `blocPdf` de `meteoSynthesePdf` passe à `breakable: true`.
  - Les petits blocs (`jauges.ts:87`, `vueDEnsemble.ts:290`, `indicateurs.ts:207`, `pageDeGarde.ts:106`, `blocRowPdf`) restent insécables : ils sont de hauteur bornée.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -C apps/pilote-ppg exec vitest run --project server-unit src/server/rapport-detaille src/server/pdf`
Expected: PASS, y compris les tests existants de `chantier`, `chantierSections` et `pageDeGarde`.

- [ ] **Step 5: Lint + commit** (`commit-billable`) : `fix: les sections du rapport détaillé PDF ne sont plus tronquées à une page`.

---

### Task 2: File de génération sérielle

**Files:**
- Create: `apps/pilote-ppg/src/server/rapport-detaille/handlers/serialQueue.ts`
- Test: `apps/pilote-ppg/src/server/rapport-detaille/handlers/serialQueue.unit.test.ts`

**Interfaces:**
- Produces:
  - `export class QueueFullError extends Error {}`
  - `export function createSerialQueue(maxPending: number): <Result>(job: () => Promise<Result>) => Promise<Result>`. Elle exécute un job à la fois, dans l'ordre d'arrivée. Elle rejette avec `QueueFullError`, sans exécuter le job, quand `maxPending` jobs attendent déjà derrière celui en cours. L'échec d'un job ne bloque pas les suivants.

- [ ] **Step 1: Write the failing tests** (jobs pilotés par des promesses différées) :
  - `exécute les jobs un par un dans l'ordre d'arrivée` : trois jobs lancés d'un coup ; le journal des débuts et fins vaut `["start 1", "end 1", "start 2", "end 2", "start 3", "end 3"]`.
  - `refuse un job quand la file d'attente est pleine` : avec `createSerialQueue(1)`, un job en cours et un en attente, le troisième rejette en `QueueFullError` et n'est jamais appelé (`expect(thirdJob).not.toHaveBeenCalled()`).
  - `passe au job suivant quand un job échoue` : le premier rejette `new Error("boom")`, le second résout `"ok"`. On attend `rejects.toThrow("boom")` puis `resolves.toBe("ok")`.

- [ ] **Step 2: Run** `pnpm -C apps/pilote-ppg exec vitest run --project server-unit serialQueue`. Expected: FAIL (module absent).

- [ ] **Step 3: Implement** `createSerialQueue`. Une chaîne de promesses avec compteur `pending` suffit : on chaîne sur `tail.catch(() => undefined)` pour qu'un échec ne casse pas la chaîne.

- [ ] **Step 4: Run** la même commande. Expected: PASS.

- [ ] **Step 5: Lint + commit** : `feat: file de génération sérielle pour le PDF du rapport détaillé`.

---

### Task 3: Génération dans un worker_thread, envoi hors file

**Files:**
- Modify: `apps/pilote-ppg/src/server/rapport-detaille/pdf/generateRapportDetaillePdf.ts`
- Create: `apps/pilote-ppg/src/server/rapport-detaille/pdf/rapportDetaillePdf.worker.ts`
- Create: `apps/pilote-ppg/src/server/rapport-detaille/pdf/renderRapportDetaillePdfInWorker.ts`
- Modify: `apps/pilote-ppg/src/server/rapport-detaille/handlers/rapportDetaillePdfHandler.ts`
- Modify: `apps/pilote-ppg/src/client/components/PageRapportDétaillé/DownloadRapportDetaillePdfButton.tsx` (texte du 503)
- Modify: `docs/superpowers/specs/2026-10-01-rapport-detaille-pdf-serveur-design.md` (§ Points de vigilance et § Mesures)
- Test: `apps/pilote-ppg/src/server/rapport-detaille/handlers/rapportDetaillePdfHandler.unit.test.ts`, `apps/pilote-ppg/src/server/rapport-detaille/pdf/generateRapportDetaillePdf.unit.test.ts`

**Interfaces:**
- Consumes: `createSerialQueue`, `QueueFullError` (tâche 2).
- Produces:
  - `export type GenerateParams` (exporté, aujourd'hui local), données sérialisables par clonage structuré.
  - `export async function renderRapportDetaillePdf(params: GenerateParams): Promise<Uint8Array>`, implémenté par `generateRapportDetaillePdf(params).getBuffer()`.
  - `export function renderRapportDetaillePdfInWorker(params: GenerateParams): Promise<Uint8Array>`.
  - `RapportDetaillePdfDependencies` : `renderPdf: (params: GenerateParams) => Promise<Uint8Array>` est ajouté.
  - Constantes du handler : `MAX_PENDING_GENERATIONS = 10` (choix du user : jusqu'à ~30 s d'attente plutôt qu'un 503), `RETRY_AFTER_SECONDS = 10`. `DETAILS_BATCH_SIZE` reste à 10.
  - Constantes du runner : `WORKER_HEAP_LIMIT_MB = 256` (la spec mesure une génération nationale réussie avec 256 Mo de tas), `GENERATION_TIMEOUT_MS = 90_000`.

- [ ] **Step 1: Write the failing tests.** Dans `rapportDetaillePdfHandler.unit.test.ts`, `buildDependencies` reçoit `renderPdf: vi.fn(renderRapportDetaillePdf)` (rendu réel, en process). Le test existant sur le 503 est remplacé par :
  - `sert les demandes simultanées l'une après l'autre` : `renderPdf` est piloté par des promesses différées. Deux requêtes partent. Le second `renderPdf` n'est appelé qu'après la résolution du premier, et les deux réponses sont en 200 avec `Content-Type: application/pdf`.
  - `répond 503 quand la file d'attente est pleine` : un rendu bloqué et `MAX_PENDING_GENERATIONS` demandes en attente ; la requête suivante reçoit `503` et l'en-tête `Retry-After: 10`.
  - `envoie le PDF avec sa taille` : `Content-Length` est égal à la taille du buffer renvoyé par `renderPdf`.
  - `libère la file avant l'envoi` : un premier `fetch` dont on ne lit jamais le corps, puis une seconde requête, qui doit répondre 200.
  - `répond 500 et sert la demande suivante quand le rendu échoue` : `renderPdf` rejette une fois, puis la requête suivante reçoit 200.
  - `charge les lots de détails en parallèle` : avec 25 chantiers, `loadChantierDetails` est appelé 3 fois avant la première résolution.

  Dans `generateRapportDetaillePdf.unit.test.ts`, le test `renderRapportDetaillePdf renvoie un PDF complet` vérifie que le résultat est un `Uint8Array` qui commence par `%PDF` et se termine par `%%EOF` (aux espaces finales près).

- [ ] **Step 2: Run** `pnpm -C apps/pilote-ppg exec vitest run --project server-unit rapportDetaillePdfHandler generateRapportDetaillePdf`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - `renderRapportDetaillePdf` dans `generateRapportDetaillePdf.ts`.
  - **Worker** (`rapportDetaillePdf.worker.ts`) : il lit `workerData` en `GenerateParams`, appelle `renderRapportDetaillePdf`, puis `parentPort.postMessage(buffer, [buffer.buffer])`. Ce fichier ne contient que ce câblage.
  - **Runner** (`renderRapportDetaillePdfInWorker`) :
    - il crée `new Worker(new URL("./rapportDetaillePdf.worker.ts", import.meta.url), { workerData: params, resourceLimits: { maxOldGenerationSizeMb: WORKER_HEAP_LIMIT_MB } })`, un worker neuf par génération (isolation, mémoire rendue à la fin) ;
    - il résout sur `message` ;
    - il rejette sur `error`, sur un `exit` de code non nul sans message, et sur le délai `GENERATION_TIMEOUT_MS`, auquel cas il appelle `worker.terminate()` ;
    - il appelle `terminate()` dans tous les cas en fin de course.
  - **Handler** :
    - le booléen `generationInProgress` est supprimé ; on utilise `const enqueue = createSerialQueue(MAX_PENDING_GENERATIONS)` au niveau module ;
    - la file couvre le chargement des données et `renderPdf`, et renvoie le buffer ;
    - `QueueFullError` donne `503` + `Retry-After` ; toute autre erreur donne `500` + `logger.error` ;
    - **hors file** : `statusCode = 200`, `Content-Type`, `Content-Disposition` (inchangés), `Content-Length`, puis `response.end(Buffer.from(buffer))` ;
    - le streaming `pipeline` et `isClientDisconnection` disparaissent du handler ;
    - `loadAllDetails` lance les lots avec `Promise.all` au lieu de les enchaîner.
  - `defaultRapportDetaillePdfDependencies().renderPdf` vaut `renderRapportDetaillePdfInWorker`.
  - **Client** : le toast du 503 devient « Trop de PDF sont en cours de génération, réessayez dans quelques secondes. »
  - **Spec** : dans § Points de vigilance, ajouter « Génération dans un worker_thread (un par génération, tas limité à 256 Mo, délai de 90 s), file sérielle commune au conteneur, 10 demandes en attente, 503 au-delà ». Remplacer la phrase « envoi en flux » par « envoi avec Content-Length après libération de la file ».

- [ ] **Step 4: Run** `pnpm -C apps/pilote-ppg test:unit`. Expected: PASS (tous les tests unitaires).

- [ ] **Step 5: Vérifier l'empaquetage du worker.**
  Lancer `CI=true pnpm -C apps/pilote-ppg exec next build`. Expected:
  - le build réussit ;
  - un fichier `apps/pilote-ppg/.next/standalone/apps/pilote-ppg/.next/server/chunks/[worker thread]-*rapportDetaillePdf_worker*.js` existe ;
  - ce chunk, lancé dans un `new Worker(chunk, { workerData })` avec des `GenerateParams` minimales depuis `.next/standalone/apps/pilote-ppg`, renvoie un buffer qui commence par `%PDF`. Cela vérifie au passage la lecture de `public/fonts/marianne` en standalone.

  Supprimer ensuite `apps/pilote-ppg/.next`, puis `rm -rf .next` avant tout `next dev`.

- [ ] **Step 6: Lint + commit** : `perf: le PDF du rapport détaillé est généré dans un worker_thread sans bloquer le serveur`.

---

### Task 4: Téléchargement robuste côté client

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageRapportDétaillé/DownloadRapportDetaillePdfButton.tsx`

- [ ] **Step 1: Implement.** Après le traitement du 503 :
  - si `response.redirected` ou un `Content-Type` qui ne commence pas par `application/pdf`, alors toast d'erreur « Votre session a expiré, rechargez la page pour vous reconnecter. », sans téléchargement ;
  - sinon, le comportement actuel est conservé (`!response.ok` donne l'erreur générique).

- [ ] **Step 2: Lint** `pnpm -C apps/pilote-ppg lint`. Expected: OK.

- [ ] **Step 3: Commit** : `fix: le bouton PDF du rapport détaillé n'enregistre plus la page de connexion`.

---

### Task 5: Ancres des fiches chantier non chargées

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageRapportDétaillé/Chantier/DeferredRapportDétailléChantier.tsx:59`

- [ ] **Step 1: Implement.** Ajouter `id={htmlId.chantier(chantier.id)}` sur la `<section>` de l'emplacement réservé (import de `htmlId` depuis `PageRapportDétaillé`, comme dans `RapportDétailléChantier.tsx:6`). Une fois la fiche chargée, `RapportDétailléChantier` porte le même `id` à la place de l'emplacement : il n'y a jamais deux éléments avec cet `id` en même temps.

- [ ] **Step 2: Lint.** Expected: OK.

- [ ] **Step 3: Commit** : `fix: les liens de la liste des chantiers mènent aux fiches pas encore chargées`.

---

### Task 6: Cartographie d'avancement robuste à NaN

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/_commons/Cartographie/CartographieAvancement/avancementFill.ts:29`
- Test: `apps/pilote-ppg/src/client/components/_commons/Cartographie/CartographieAvancement/avancementFill.unit.test.ts` (fonction pure partagée avec le PDF serveur, donc testée)

- [ ] **Step 1: Write the failing test** `getAvancementFill renvoie le remplissage par défaut pour une valeur non finie`, avec `it.each([NaN, Infinity])` : on attend `élémentsDeLégende.DÉFAUT.remplissage`. Utiliser la légende réelle passée par `useCartographieAvancement` (la constante exportée du module de légende).

- [ ] **Step 2: Run** `pnpm -C apps/pilote-ppg exec vitest run --project client avancementFill`. Expected: FAIL (TypeError sur `NaN`).

- [ ] **Step 3: Implement.** Remplacer `if (valeur === null)` par `if (valeur === null || !Number.isFinite(valeur))`.

- [ ] **Step 4: Run** la même commande. Expected: PASS.

- [ ] **Step 5: Lint + commit** : `fix: la cartographie d'avancement ne plante plus sur une valeur non numérique`.

---

### Task 7: Vérification finale

- [ ] **Step 1:** Lancer `pnpm -C apps/pilote-ppg lint` et `pnpm -C apps/pilote-ppg test:unit`. Expected: tout vert.
- [ ] **Step 2:** Lancer `pnpm -C apps/pilote-ppg exec vitest run --project server-integration IndicateurSQLRepository GetStatistiquesAvancement`. Docker allumé, vérifié par le user. Expected: PASS.
- [ ] **Step 3:** Recette par le user, avec les URL exactes et l'action à faire pour chacune :
  - PDF national avec détail : comparer le nombre de pages avec la version précédente (270 pages) et vérifier une fiche à longue synthèse ;
  - deux onglets qui téléchargent en même temps, pendant qu'un troisième navigue dans l'app : la navigation reste fluide ;
  - session expirée : message d'erreur au lieu d'un fichier ;
  - clic sur la 30e ligne de « Liste des chantiers », détail activé.
- [ ] **Step 4:** Ne pas pousser : présenter le résumé et attendre l'accord du user.

## Hors périmètre (remarques de review reportées)

- Rechargement des ministères, axes et territoires à chaque lot tRPC (`loadChantiersByIds`, fausse session) : à traiter avec un paramètre `chantierIds` dans le use case, ticket à part.
- Caches de `iconSvg`, `meteoPictoSvg`, `jaugeSvg` et `findTerritoire` : gains marginaux une fois la génération dans un worker.
- Espaces blancs dans `htmlToPdfmake`, doublons (`separator`, couleurs hexadécimales recopiées au lieu de `color()`, taille de lot, téléchargement blob), variables `a, b` et assertions par index des tests : lot de nettoyage à part.
