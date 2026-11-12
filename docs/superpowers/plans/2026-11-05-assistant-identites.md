# Identités des personnes dans l'assistant — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (exécution inline). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Albert cite les personnes par référence `@[personne:UUID]`, jamais par nom/prénom/e-mail ; le front les résout en batch et les affiche.

**Architecture:** Un module partagé définit la référence (construction, détection tolérante, substitution texte). Côté serveur, les queries des outils exposent les ids et les outils les transforment en références ; les prompts (principal et encart) apprennent à les recopier. Côté front, une procédure tRPC `albert.persons.resolve` est appelée via un batcher batshit, une entrée TanStack Query par personne, un plugin remark rend les références dans le markdown, et un composant rend les textes bruts.

**Tech Stack:** TypeScript, Prisma, tRPC v11 (`@trpc/next`), TanStack Query v5, `@yornaath/batshit` 0.14.0, react-markdown 10, vitest.

**Spec:** `docs/superpowers/specs/2026-11-05-assistant-identites-design.md`

## Global Constraints

- Aucun nom, prénom ou e-mail de personne dans une sortie d'outil, un prompt ou l'historique envoyé à Albert.
- Format de référence : `@[personne:UUID]` (texte visible par le modèle, en français).
- Libellés : personne inconnue → `une personne` ; compte désactivé → `Prénom Nom (désactivé)` ; sinon `Prénom Nom`.
- Batch : `windowedFiniteBatchScheduler({ windowMs: 10, maxBatchSize: 100 })` ; input de l'endpoint borné à 100 ids.
- Clé de cache : `["personne", id]` (id normalisé, minuscule, tirets ASCII).
- Droits de l'endpoint : session seule (`protectedProcedure`), pas d'`assertAlbertAccess` (la vue admin doit pouvoir résoudre).
- Code technique en anglais, termes domaine en français (chantier, territoire, utilisateur…) ; champs des sorties d'outils en snake_case français comme l'existant.
- Pas d'accents dans les chemins et identifiants ; exports nommés ; pas de `as never` / `as unknown` ; pas de commentaires superflus.
- Pas de tests front (convention projet) : la logique pure partagée est testée dans `src/shared`.
- Avant chaque commit : `pnpm -C apps/pilote-ppg lint` (oxlint) ; commits via le skill `commit-billable` (Refs: PIL-1860). Jamais de `cd` : chemins depuis la racine du repo.
- Tests d'intégration : demander au user de vérifier que Docker (base de test) tourne ; ne rien faire sur Docker.

## Review Focus

- Le modèle openweight écrit des tirets Unicode (`‑`, `–`…) et parfois des majuscules dans les ids (cf. `remarkChantierLinks`) → la référence doit quand même être reconnue et normalisée (test en Task 1).
- Référence entre backticks (`` `@[personne:…]` ``) → rendue comme une personne, pas comme du code (géré en Task 8, regex testée en Task 1 via `isOnlyPersonReference`).
- Id inconnu, supprimé ou malformé → « une personne », jamais d'erreur ; `queryFn` ne doit pas renvoyer `undefined` (interdit par TanStack Query) → `null` (Task 8).
- E-mail de responsable des données dont la casse diffère du compte → retrouvé quand même ; e-mail sans compte → omis, jamais transmis (test en Task 6).
- Territoire en accès restreint dans `get_chantiers` → responsables locaux, coordinateurs et auteur de synthèse masqués (test en Task 5).

---

### Task 1: Module partagé de référence de personne

**Files:**
- Create: `apps/pilote-ppg/src/shared/personne/personReference.ts`
- Test: `apps/pilote-ppg/src/shared/personne/personReference.unit.test.ts`

**Interfaces:**
- Produces:
  - `type ResolvedPerson = { id: string; prenom: string; nom: string; email: string; service: string | null; fonction: string | null; estDesactive: boolean }`
  - `personReference(id: string): string` → `@[personne:${id}]`
  - `PERSON_REFERENCE_PATTERN: RegExp` (global, insensible à la casse ; tirets de la famille `-‐‑‒–—−` acceptés dans l'UUID, comme `remarkChantierLinks`)
  - `normalizePersonId(raw: string): string` → minuscules, tirets ASCII
  - `isOnlyPersonReference(text: string): string | null` → l'id normalisé si `text` (trimé) est exactement une référence, sinon `null`
  - `replacePersonReferences(text: string, replace: (id: string) => string): string`
  - `formatPerson(person: ResolvedPerson | null | undefined): string`

- [ ] **Step 1: Écrire les tests**

```ts
describe("personReference", () => {
  const ID = "0b3c1f2e-8a4d-4c6b-9e1f-2a3b4c5d6e7f";
  test("construit la référence", () =>
    expect(personReference(ID)).toBe(`@[personne:${ID}]`));
  test("remplace chaque référence par le libellé", () =>
    expect(replacePersonReferences(`Par @[personne:${ID}] et @[personne:${ID}].`, () => "Jeanne Martin"))
      .toBe("Par Jeanne Martin et Jeanne Martin."));
  test("reconnaît un id aux tirets Unicode et en majuscules, normalisé", () => {
    const ids: string[] = [];
    replacePersonReferences(`@[personne:${ID.toUpperCase().replaceAll("-", "‑")}]`, (id) => { ids.push(id); return ""; });
    expect(ids).toEqual([ID]);
  });
  test("ignore un texte qui ressemble sans être une référence", () => {
    const texte = "@[personne:123] [personne:abc] {{ personne(\"x\") }} @[chantier:" + ID + "]";
    expect(replacePersonReferences(texte, () => "X")).toBe(texte);
  });
  test("isOnlyPersonReference : seulement une référence seule", () => {
    expect(isOnlyPersonReference(` @[personne:${ID}] `)).toBe(ID);
    expect(isOnlyPersonReference(`voir @[personne:${ID}]`)).toBeNull();
  });
  test("formatPerson", () => {
    const p = { id: ID, prenom: "Jeanne", nom: "Martin", email: "j@x.fr", service: null, fonction: null, estDesactive: false };
    expect(formatPerson(p)).toBe("Jeanne Martin");
    expect(formatPerson({ ...p, estDesactive: true })).toBe("Jeanne Martin (désactivé)");
    expect(formatPerson(null)).toBe("une personne");
    expect(formatPerson(undefined)).toBe("une personne");
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — `pnpm -C apps/pilote-ppg exec vitest run --project server-unit src/shared/personne` → FAIL (module absent).
- [ ] **Step 3: Implémenter `personReference.ts`** selon les signatures ci-dessus (UUID : `[0-9a-f]{8}` puis 3 × `[tirets][0-9a-f]{4}` puis `[tirets][0-9a-f]{12}`).
- [ ] **Step 4: Relancer** → PASS.
- [ ] **Step 5: Lint + commit** (« module de référence de personne »).

---

### Task 2: Endpoint de résolution `albert.persons.resolve`

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/queries/ResolvePersonsQuery.ts`
- Modify: `apps/pilote-ppg/src/server/albert/module.ts` (cradle `resolvePersonsQuery` + `asModuleClass`)
- Modify: `apps/pilote-ppg/src/server/albert/infrastructure/trpc/albert.ts` (sous-router `persons`)
- Test: `apps/pilote-ppg/src/server/albert/__tests__/queries/ResolvePersonsQuery.integration.test.ts`

**Interfaces:**
- Consumes: `ResolvedPerson` (Task 1), `getServiceLibelle` (`src/utils/referentiel-services.ts`).
- Produces: `ResolvePersonsQuery.execute({ ids }: { ids: string[] }): Promise<ResolvedPerson[]>` ; procédure `albert.persons.resolve` (query, input `{ ids: z.array(z.string().uuid()).min(1).max(100) }`, sortie `ResolvedPerson[]`).

- [ ] **Step 1: Tests d'intégration** (modèle : `RecupererConversationAdminQuery.integration.test.ts`, fixtures `fixtures.utilisateur`)
  - `renvoie prénom, nom, e-mail, service libellé et fonction des ids connus`
  - `signale un compte désactivé` → `estDesactive: true` quand `date_desactivation` est renseignée
  - `omet les ids inconnus et ignore les ids malformés` → `execute({ ids: [connu, randomUUID(), "pas-un-uuid"] })` renvoie un seul élément, sans lever
- [ ] **Step 2: Lancer** (Docker allumé, à demander) — `pnpm -C apps/pilote-ppg exec vitest run --project server-integration src/server/albert/__tests__/queries/ResolvePersonsQuery` → FAIL.
- [ ] **Step 3: Implémenter** la query (Prisma `utilisateur.findMany`, ids dédoublonnés et filtrés au format UUID comme `recupererParIds`, `select` incluant `date_desactivation`, `perimetre_ministeriel`, `service`, `service_autre`), l'enregistrer dans le module, ajouter la procédure (`protectedProcedure`, sans `assertAlbertAccess`).
- [ ] **Step 4: Relancer** → PASS ; `pnpm -C apps/pilote-ppg exec tsc --noEmit` OK.
- [ ] **Step 5: Lint + commit** (« endpoint de résolution des personnes »).

---

### Task 3: Auteurs dans `get_chantier_commentaires`

**Files:**
- Modify: `apps/pilote-ppg/src/server/chantiers/query/GetChantierCommentairesQuery.ts` (type `GetChantierCommentairesResult["commentaires"][number]` + mapping l.171-190)
- Modify: `apps/pilote-ppg/src/server/albert/tools/getChantierCommentaires.ts` (`VersionCommentaire`, `regrouperParType`)
- Test: `apps/pilote-ppg/src/server/albert/__tests__/tools/getChantierCommentaires.unit.test.ts`, `apps/pilote-ppg/src/server/chantiers/__tests__/query/GetChantierCommentairesQuery.integration.test.ts`

**Interfaces:**
- Consumes: `personReference` (Task 1).
- Produces: items de la query + `auteur_creation_id: string; auteur_modification_id: string` (commentaire, synthèse, décision) ; `VersionCommentaire = { date_publication; contenu; auteur: string; modifie_par?: string }` (références).

- [ ] **Step 1: Tests**
  - unit outil : `cite l'auteur de chaque version par sa référence` → `versions[0].auteur === personReference(idAuteur)`, pas de `modifie_par` quand création = modification ; `ajoute modifie_par quand un autre utilisateur a modifié` ; `garde l'auteur de la version retenue quand des versions identiques sont dédoublonnées` (la plus récente).
  - integration query : les items exposent `auteur_creation_id` / `auteur_modification_id` des trois sources.
- [ ] **Step 2: Lancer** → FAIL.
- [ ] **Step 3: Implémenter** (ajouter les ids au mapping ; dans `regrouperParType`, construire `auteur` / `modifie_par` avec `personReference` ; mettre à jour la description de l'outil : « `auteur`, `modifie_par` : références des personnes, à recopier telles quelles »).
- [ ] **Step 4: Relancer** (unit + integration) → PASS.
- [ ] **Step 5: Lint + commit**.

---

### Task 4: Auteurs dans `get_chantier_objectifs`

**Files:**
- Modify: `apps/pilote-ppg/src/server/chantiers/query/GetChantierObjectifsQuery.ts` (`ObjectifItem` + `select`)
- Modify: `apps/pilote-ppg/src/server/albert/tools/getChantierObjectifs.ts`
- Test: `apps/pilote-ppg/src/server/albert/__tests__/tools/getChantierObjectifs.unit.test.ts`, `apps/pilote-ppg/src/server/chantiers/__tests__/query/GetChantierObjectifsQuery.integration.test.ts`

**Interfaces:**
- Produces: `ObjectifItem` + `auteur_creation_id`, `auteur_modification_id` ; sortie outil par objectif + `auteur: string`, `modifie_par?: string` (même règle que Task 3).

- [ ] **Step 1: Tests** — unit : `cite l'auteur de chaque objectif par sa référence`, `ajoute modifie_par quand il diffère` ; mettre à jour les attendus existants (`toEqual`) ; integration : ids exposés.
- [ ] **Step 2: Lancer** → FAIL.
- [ ] **Step 3: Implémenter** + description de l'outil.
- [ ] **Step 4: Relancer** → PASS.
- [ ] **Step 5: Lint + commit**.

---

### Task 5: Personnes dans `get_chantiers` et les encarts

**Files:**
- Modify: `apps/pilote-ppg/src/server/chantiers/query/GetChantiersQuery.ts` (`ChantierIdentite`, `ChantierResult`, `SyntheseResultat`, mapping)
- Modify: `apps/pilote-ppg/src/server/albert/tools/getChantiers.ts` (`ChantierRenvoye`, `renvoyerChantier`, `masquerDonneesNonAccessibles`, description)
- Modify: `apps/pilote-ppg/src/server/albert/tools/encart.ts` (`vuePourLeSousAgent`)
- Modify: `apps/pilote-ppg/src/server/albert/subagents/encartSystemPrompts.ts` (`DONNEES_ET_REGLES`, `FICHE_CHANTIER`)
- Test: `apps/pilote-ppg/src/server/albert/__tests__/tools/getChantiers.unit.test.ts`, `.../tools/redigerEncart.unit.test.ts`, `apps/pilote-ppg/src/server/chantiers/__tests__/query/GetChantiersQuery.integration.test.ts`

**Interfaces:**
- Produces:
  - query : `ChantierIdentite.directeurs_projet_ids: string[]` ; `ChantierResult.responsables_locaux_ids: string[]`, `coordinateurs_territoriaux_ids: string[]` ; `SyntheseResultat.auteur_creation_id: string | null`, `auteur_modification_id: string | null`.
  - outil : `ChantierRenvoye.chantier.directeurs_projet: string[]` ; `ChantierRenvoye.responsables_locaux: string[]`, `coordinateurs_territoriaux: string[]` ; `synthese.auteur?: string`, `synthese.modifie_par?: string` (références).
  - encart (données du sous-agent, par chantier) : `directeurs_projet`, `responsables_locaux`, `coordinateurs_territoriaux`, `auteur_synthese: string | null`.

- [ ] **Step 1: Tests**
  - unit `getChantiers` : `cite directeurs de projet, responsables locaux, coordinateurs et auteur de la synthèse par référence` ; `masque responsables locaux, coordinateurs et auteur de synthèse sur un territoire en accès restreint` → `responsables_locaux: []`, `coordinateurs_territoriaux: []`, `synthese: { commentaire: null, date_commentaire: null }` sans auteur ; `directeurs_projet` conservés (chantier accessible).
  - unit `redigerEncart` : les données envoyées au sous-agent contiennent les références (et pas d'autre forme d'identité).
  - integration query : ids exposés.
- [ ] **Step 2: Lancer** → FAIL.
- [ ] **Step 3: Implémenter**
  - query : reprendre `directeurs_projet_ids`, `responsables_locaux_ids`, `coordinateurs_territoriaux_ids`, ids d'auteur de la synthèse retenue (déjà chargés par l'`include`).
  - outil : références via `personReference` ; description : nouveaux champs = références à recopier.
  - prompt encart *(mon choix de forme)* : décrire les champs dans « Les données » ; règle « une personne se cite uniquement en recopiant exactement sa référence `@[personne:…]`, jamais entre backticks ni dans un lien ; ne jamais inventer de nom » ; ajouter à `FICHE_CHANTIER`, après l'écart, une ligne `**Directeurs de projet** : {références} · **Responsables locaux** : {références} · **Coordinateurs territoriaux** : {références}` en omettant chaque rubrique vide (ligne entière omise si tout est vide), et après le résumé `Synthèse rédigée par {auteur_synthese}` quand il existe. La règle « aucun lien » existante reste vraie.
- [ ] **Step 4: Relancer** (unit + integration) → PASS.
- [ ] **Step 5: Lint + commit**.

---

### Task 6: Responsables des données dans `get_chantier_indicateurs`

**Files:**
- Modify: `apps/pilote-ppg/src/server/chantiers/query/GetChantierIndicateursQuery.ts`
- Modify: `apps/pilote-ppg/src/server/albert/tools/getChantierIndicateurs.ts`
- Test: `apps/pilote-ppg/src/server/albert/__tests__/tools/getChantierIndicateurs.unit.test.ts`, intégration à créer : `apps/pilote-ppg/src/server/chantiers/__tests__/query/GetChantierIndicateursQuery.integration.test.ts` (ou compléter l'existant s'il apparaît)

**Interfaces:**
- Produces: par indicateur de la query `responsables_donnees_ids: string[]` ; sortie outil `responsables_donnees: string[]` (références). `indicateursPourLeSousAgent` (encart) n'est pas modifié.

- [ ] **Step 1: Tests**
  - integration : `retrouve l'id d'un responsable des données par son e-mail, sans tenir compte de la casse` ; `omet un e-mail sans compte` ; `JSON.stringify(result)` ne contient aucun des e-mails de la fixture.
  - unit outil : `cite les responsables des données par référence`.
- [ ] **Step 2: Lancer** → FAIL.
- [ ] **Step 3: Implémenter** : une seule requête `utilisateur.findMany` sur l'ensemble des e-mails de tous les indicateurs (comparaison insensible à la casse), `Map` e-mail minuscule → id ; ne jamais renvoyer `responsables_donnees_mails`.
- [ ] **Step 4: Relancer** → PASS.
- [ ] **Step 5: Lint + commit**.

---

### Task 7: Règle de citation dans le prompt principal

**Files:**
- Modify: `apps/pilote-ppg/src/server/albert/systemPrompt.ts` (section « Rédiger », près de la règle des identifiants CH-XXX l.196)
- Test: `apps/pilote-ppg/src/server/albert/__tests__/systemPrompt.unit.test.ts`

- [ ] **Step 1: Test** `indique de citer les personnes par leur référence` → le prompt contient `@[personne:` et une consigne de ne jamais inventer de nom.
- [ ] **Step 2: Lancer** → FAIL.
- [ ] **Step 3: Ajouter** la règle (3 puces, cf. spec « Prompt système ») : recopier exactement la référence, hors backticks et hors lien ; ne jamais inventer, deviner ni modifier ; une personne absente des résultats ne se cite pas.
- [ ] **Step 4: Relancer** → PASS.
- [ ] **Step 5: Lint + commit**.

---

### Task 8: Résolution front et rendu dans le markdown

**Files:**
- Modify: `apps/pilote-ppg/package.json` (`pnpm -C apps/pilote-ppg add @yornaath/batshit@0.14.0`)
- Create: `apps/pilote-ppg/src/client/components/_commons/ChatUI/persons/personBatcher.ts`
- Create: `apps/pilote-ppg/src/client/components/_commons/ChatUI/persons/usePerson.ts`
- Create: `apps/pilote-ppg/src/client/components/_commons/ChatUI/persons/remarkPersonReferences.ts`
- Create: `apps/pilote-ppg/src/client/components/_commons/ChatUI/persons/PersonMention.tsx`
- Modify: `apps/pilote-ppg/src/client/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip.tsx` (prop optionnelle `email?: string`, ligne « E-mail : » dans l'infobulle)
- Modify: `apps/pilote-ppg/src/client/components/_commons/ChatUI/AssistantMessageText.tsx` (plugin + composant `span`)

**Interfaces:**
- Consumes: `albert.persons.resolve` (Task 2), `PERSON_REFERENCE_PATTERN`, `isOnlyPersonReference`, `formatPerson`, `ResolvedPerson` (Task 1).
- Produces:
  - `personQueryKey(id: string): readonly ["personne", string]`
  - `usePerson(id: string): UseQueryResult<ResolvedPerson | null>` — `queryFn` : `batcher.fetch(id)` puis `?? null` ; `staleTime: 10 * 60 * 1000` *(mon choix)*.
  - `readCachedPerson(queryClient: QueryClient, id: string): ResolvedPerson | null | undefined`
  - `PersonMention({ id }: { id: string })` : chargement → `…` ; trouvée → `NomUtilisateurAvecTooltip` (nom = `formatPerson(person)`, service, fonction, email) ; `null`/erreur → `une personne`.
  - `remarkPersonReferences()` : plugin remark.

- [ ] **Step 1: Installer batshit** et vérifier que la version 0.14.0 est dans `package.json` et le lockfile.
- [ ] **Step 2: Batcher** — `create({ fetcher, resolver: keyResolver("id"), scheduler: windowedFiniteBatchScheduler({ windowMs: 10, maxBatchSize: 100 }) })`, créé une fois par client tRPC (mémoïsé hors hook, par ex. `WeakMap` indexée sur `api.useUtils().client`) ; le `fetcher` appelle `client.albert.persons.resolve.query({ ids })`.
- [ ] **Step 3: `usePerson` / `readCachedPerson`** (clé `personQueryKey(id)`).
- [ ] **Step 4: Plugin remark** sur le modèle de `remarkChantierLinks.ts` : découpe les nœuds `text` sur `PERSON_REFERENCE_PATTERN` ; remplace aussi un nœud `inlineCode` dont `isOnlyPersonReference` renvoie un id ; nœud produit : `{ type: "personMention", data: { hName: "span", hProperties: { dataPersonId: id } }, children: [{ type: "text", value: "une personne" }] }` ; ne descend pas dans `link`/`linkReference`.
- [ ] **Step 5: Brancher** dans `AssistantMessageText` : ajouter le plugin après `remarkChantierLinks` ; `components.span` rend `<PersonMention id=… />` quand la prop `data-person-id` est présente, sinon un `span` normal.
- [ ] **Step 6: Vérifier** — `pnpm -C apps/pilote-ppg exec tsc --noEmit` et `pnpm -C apps/pilote-ppg test:client` (non-régression) OK. Le user teste lui-même le rendu.
- [ ] **Step 7: Lint + commit**.

---

### Task 9: Textes bruts (copie, export, suites, vue admin)

**Files:**
- Create: `apps/pilote-ppg/src/client/components/_commons/ChatUI/persons/TextWithPersons.tsx`
- Create: `apps/pilote-ppg/src/client/components/_commons/ChatUI/persons/textWithCachedPersons.ts`
- Modify: `ChatUI/AssistantMessage.tsx` (`copierTexte`, l.122-142), `ChatUI/EncartSynthese.tsx` (`copier`, l.72-74), `ChatUI/exporterEncart.ts` (`nomEncart`), `ChatUI/ChoicesInline.tsx` (libellé affiché l.100 ; envoi l.64 inchangé), `ChatUI/UserMessage.tsx`, `PagePanelAdministrateur/Albert/ConversationTranscript.tsx` (question utilisateur), `PagePanelAdministrateur/Albert/AlbertDashboardTable.tsx` (titre, premier message)

**Interfaces:**
- Consumes: `replacePersonReferences`, `formatPerson` (Task 1) ; `readCachedPerson`, `PersonMention` (Task 8).
- Produces:
  - `textWithCachedPersons({ text, queryClient }: { text: string; queryClient: QueryClient }): string` — synchrone, lit le cache (les personnes affichées sont déjà résolues ; pas d'appel réseau avant `copyText`, pour garder le geste utilisateur exigé par le presse-papiers) ; absente du cache → `une personne`.
  - `TextWithPersons({ text }: { text: string })` — découpe `text` sur `PERSON_REFERENCE_PATTERN` et rend `PersonMention` pour chaque référence.

- [ ] **Step 1: Implémenter les deux utilitaires.**
- [ ] **Step 2: Copie et export** : `copierTexte` et `copier` passent le texte par `textWithCachedPersons` ; `nomEncart` reçoit un markdown déjà substitué par l'appelant (le nom de fichier ne doit pas contenir de référence). Export PDF : rien (clone du DOM rendu).
- [ ] **Step 3: Affichages bruts** : `ChoicesInline` (affichage seulement), `UserMessage`, question utilisateur de `ConversationTranscript`, titre et premier message de `AlbertDashboardTable` → `TextWithPersons`.
- [ ] **Step 4: Vérifier** — `tsc --noEmit`, `pnpm -C apps/pilote-ppg test:client` OK.
- [ ] **Step 5: Lint + commit**.

---

### Task 10: Vérification finale

- [ ] `pnpm -C apps/pilote-ppg lint`, `pnpm -C apps/pilote-ppg exec tsc --noEmit`, `pnpm -C apps/pilote-ppg test:server:unit`, `pnpm -C apps/pilote-ppg test:server:integration` (Docker allumé), `pnpm -C apps/pilote-ppg test:client` : tout vert, sortie citée.
- [ ] Revue de la branche entière (skill `code-review`), puis push + PR (pas de merge local).
