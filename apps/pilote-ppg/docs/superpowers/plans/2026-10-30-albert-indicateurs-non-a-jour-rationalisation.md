# Rationalisation de `get_indicateurs_non_a_jour` — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** aligner l'outil sur les conventions des autres outils de données d'Albert : `perimetre` optionnel, `detail` explicite, contrat snake_case en libellés, indicateurs introuvables signalés et accès vérifié en une requête.

**Architecture:** tout se passe dans `getIndicateursNonAJour.ts`, qui gagne une résolution des accès et une couche de restitution. `GetIndicateursIdentiteQuery` gagne un filtre `indicateurIds` et remplace `GetIndicateurContexteQuery` dans les dépendances de l'outil. `GetIndicateursNonAJourQuery` ne change pas.

**Tech Stack:** AI SDK `ai`, Zod 4, Awilix, Prisma, Vitest, Evalite.

**Spec:** `apps/pilote-ppg/docs/superpowers/specs/2026-10-30-albert-indicateurs-non-a-jour-rationalisation-design.md`

## Global Constraints

- Branche `feat/albert-indicateurs-non-a-jour-rationalisation`, créée depuis `dev`. Ne rien reprendre de `feat/albert-indicateurs-sans-vi-vc`.
- Aucun commit sans demande explicite de l'utilisateur. Message d'un commit demandé : terminé par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Aucune limite, aucun tri, aucun agrégat de dates, aucune lecture par territoire.
- Pas de normalisation des identifiants d'indicateurs, pas de changement côté client.
- Accès en sortie souple (`acces_refuse`), jamais en `throw`.
- Conventions : `expect(result).toEqual(...)` plutôt que longueur et index ; commentaires de test given/when/then seulement ; pas de variable d'un ou deux caractères ; paramètres en objet ; métier en français, technique en anglais.
- Pas de test sur le texte de la description de l'outil.
- Depuis `apps/pilote-ppg` : tests `pnpm vitest run <fichier>`, types `pnpm tsc --noEmit`, lint `pnpm lint`.

## Review Focus

1. **Région accessible, départements en partie accessibles :** seuls les départements accessibles sont interrogés, sans refus. Test en Task 3.
2. **`TOUS_DEPARTEMENTS` pour un utilisateur sans aucun département :** l'intersection vide donne `acces_refuse`, pas une liste vide lue « tout est à jour ». Test en Task 3.
3. **Identifiants en double dans `indicateur_ids` ou `territoire_codes` :** chaque identifiant n'apparaît qu'une fois dans les listes de sortie et dans l'appel à la query. Test en Task 3.
4. **Chantier demandé inaccessible et indicateur accessible dans le même appel :** l'ordre des règles de la spec s'applique, `acces_refuse` à la règle 3, sans lecture de l'indicateur. Test en Task 3.
5. **`FRANCE_ET_SES_REGIONS` sans accès à `NAT-FR` :** `acces_refuse`, même si l'utilisateur a accès à des régions. Test en Task 3.

---

### Task 1: Filtre `indicateurIds` de `GetIndicateursIdentiteQuery`

**Files:**
- Modify: `src/server/chantiers/query/GetIndicateursIdentiteQuery.ts`
- Create: `src/server/chantiers/__tests__/query/GetIndicateursIdentiteQuery.integration.test.ts`

**Interfaces:**
- Produces: `GetIndicateursIdentiteParams = { chantierIds?: string[]; indicateurIds?: string[] }`. Type de retour inchangé.

- [ ] **Step 1: Créer la branche et mesurer l'existant.** Depuis `dev`, créer la branche. Run: `pnpm eval evals/2-tools/2.2-donnees/getIndicateursNonAJour.eval.ts`. Expected: un score par cas, à noter pour Task 4. Rejouer la suite seule en cas de 503 ou 429. Si l'API reste indisponible, le dire et continuer : la mesure « avant » sera refaite depuis `dev`.

- [ ] **Step 2: Écrire les tests qui échouent.** Sur le modèle de `GetIndicateurContexteQuery.integration.test.ts` (fixtures `chantierIdentite`, `indicateurIdentite`), trois cas :
  - `"ne renvoie que les indicateurs demandés"` : IND-001 et IND-002 semés, `execute({ indicateurIds: ["IND-001"] })` renvoie le seul IND-001 avec `toEqual`.
  - `"combine indicateurIds et chantierIds"` : IND-001 sur CH-001, IND-002 sur CH-002, `execute({ indicateurIds: ["IND-001", "IND-002"], chantierIds: ["CH-001"] })` renvoie le seul IND-001.
  - `"ne renvoie pas un indicateur demandé non publié"` : statut `BROUILLON` sur l'indicateur, résultat `[]`.

- [ ] **Step 3: Vérifier l'échec.** Run: `pnpm vitest run src/server/chantiers/__tests__/query/GetIndicateursIdentiteQuery.integration.test.ts`. Expected: FAIL sur les deux premiers cas.

- [ ] **Step 4: Ajouter le filtre.** `id: { in: params.indicateurIds }` quand il est défini, sur le modèle du filtre `chantierIds`.

- [ ] **Step 5: Vérifier le succès.** Même commande. Expected: PASS.

---

### Task 2: Mode `detail` et contrat de sortie

**Files:**
- Modify: `src/server/albert/tools/libelles.ts`
- Modify: `src/server/albert/tools/getIndicateursNonAJour.ts`
- Test: `src/server/albert/__tests__/tools/libelles.unit.test.ts`, `src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts`

**Interfaces:**
- Produces: `libelleMaille({ maille }: { maille: $Enums.Maille }): "nationale" | "régionale" | "départementale"`, qui réutilise la table de `mailleDePilotage`.
- Produces, dans l'outil :

```ts
type TerritoireEnRetardRenvoye = {
  code: string;
  nom: string | null;
  date_derniere_valeur: string | null;
  mise_a_jour_attendue_depuis: string | null;
};
type MailleRenvoyee = {
  maille: ReturnType<typeof libelleMaille>;
  nb_territoires_en_retard: number;
  nb_territoires_applicables: number;
  territoires_en_retard?: TerritoireEnRetardRenvoye[];
};
type IndicateurRenvoye = {
  id: string;
  nom: string;
  periodicite: string | null;
  delai_disponibilite_mois: number | null;
  mailles: MailleRenvoyee[];
};
export type ChantierNonAJourRenvoye = {
  chantier: { id: string; nom: string };
  indicateurs: IndicateurRenvoye[];
};
export type GetIndicateursNonAJourOutput = {
  detail: "compteurs" | "territoires";
  resultats: ChantierNonAJourRenvoye[];
  acces_refuse?: true;
  chantiers_non_accessibles?: string[];
  indicateurs_non_accessibles?: string[];
  indicateurs_introuvables?: string[]; // rempli en Task 3
};
```

- [ ] **Step 1: Écrire les tests qui échouent.**
  - `libelles.unit.test.ts` : `it.each` `NAT` → `nationale`, `REG` → `régionale`, `DEPT` → `départementale`.
  - `"sans detail, interroge en compteurs même avec indicateur_ids"` : `avecDetailTerritoires: false` transmis à la query, `detail: "compteurs"` en sortie.
  - `"avec detail territoires, interroge en détail même sans indicateur"` : `avecDetailTerritoires: true`, `detail: "territoires"` en sortie.
  - `"restitue en snake_case, avec la maille en libellé"` : `QUERY_RESULT` du test existant donne, avec `toEqual`, `{ id: "IND-001", nom: "Nombre de bornes", periodicite: "Trimestrielle", delai_disponibilite_mois: 1, mailles: [{ maille: "départementale", nb_territoires_en_retard: 1, nb_territoires_applicables: 3, territoires_en_retard: [{ code: "DEPT-29", nom: "Finistère", date_derniere_valeur: "2026-01-01", mise_a_jour_attendue_depuis: "2026-05-31" }] }] }`.
  - `"en compteurs, n'ajoute pas de clé territoires_en_retard"` : maille de la query sans `territoiresEnRetard`, clé absente en sortie.
  - Mettre à jour les attentes des tests existants (`detail` en sortie, `avecDetailTerritoires` au défaut compteurs). Supprimer les deux tests sur le texte de la description.

- [ ] **Step 2: Vérifier l'échec.** Run: `pnpm vitest run src/server/albert/__tests__/tools/libelles.unit.test.ts src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implémenter.** Ajouter `libelleMaille`. Dans l'outil, ajouter le paramètre `detail` (`z.enum(["compteurs", "territoires"]).optional().default("compteurs")`, avec la description donnée dans la spec). Passer `avecDetailTerritoires: input.detail === "territoires"`. Ajouter `renvoyerChantierNonAJour` sur le modèle de `renvoyerChantierSignale`. Toute sortie porte `detail`.

- [ ] **Step 4: Vérifier le succès.** Même commande, puis `pnpm tsc --noEmit`. Expected: PASS, aucune erreur de type.

---

### Task 3: Périmètre, résolution des accès et introuvables

**Files:**
- Modify: `src/server/albert/tools/getIndicateursNonAJour.ts`
- Test: `src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts`

Le câblage Awilix résout les dépendances par nom : `getIndicateursIdentiteQuery` et `territoireResolver` sont déjà disponibles dans le module `albert`, `module.ts` ne change pas.

**Interfaces:**
- Consumes: `GetIndicateursIdentiteQuery.execute({ indicateurIds })` (Task 1), `GetIndicateursNonAJourOutput` (Task 2).
- Produces: `createGetIndicateursNonAJourTool({ getIndicateursNonAJourQuery, getIndicateursIdentiteQuery, territoireResolver })`, puis `({ territoiresAccessibles, chantiersAccessibles })`. `GetIndicateurContexteQuery` n'est plus une dépendance.

- [ ] **Step 1: Écrire les tests qui échouent.** Dans `buildTool`, remplacer le mock de contexte par un mock d'identité alimenté par `chantierParIndicateur`, et ajouter le mock `territoireResolver` de `getChantiers.unit.test.ts`. Chaque cas vérifie la sortie avec `toEqual`, et les appels aux mocks avec `toHaveBeenCalledWith` ou `not.toHaveBeenCalled`.

  Territoires :
  - `"sans perimetre, interroge tous les territoires accessibles sans appeler le resolver"`.
  - `"refuse un territoire désigné inaccessible"` : `SELECTION` avec `REG-11` donne `{ detail: "compteurs", resultats: [], acces_refuse: true }`, query non appelée.
  - `"une sélection dont un seul code est inaccessible est refusée"` : `["DEPT-29", "REG-11"]` donne `acces_refuse`.
  - `"refuse France et ses régions sans accès à NAT-FR"` : `FRANCE_ET_SES_REGIONS` avec `territoiresAccessibles: ["REG-53"]` donne `acces_refuse`.
  - `"refuse une région et ses départements sans accès à la région"` : `region_code: "REG-11"` donne `acces_refuse`.
  - `"ne garde que les départements accessibles d'une région accessible"` : le resolver renvoie `["REG-53", "DEPT-29", "DEPT-35", "DEPT-56"]`, les accès `["REG-53", "DEPT-29"]`, la query reçoit `territoireCodes: ["REG-53", "DEPT-29"]`, sans refus.
  - `"TOUS_DEPARTEMENTS n'exige aucun territoire désigné"` : le resolver renvoie `["DEPT-29", "DEPT-35"]`, les accès `["DEPT-29"]`, la query reçoit `["DEPT-29"]`.
  - `"refuse TOUS_DEPARTEMENTS sans aucun département accessible"` : les accès `["REG-53"]` donnent `acces_refuse`.
  - `"refuse sans aucun territoire accessible"` : sans `perimetre`, accès `[]`.

  Chantiers et indicateurs :
  - `"signale les chantiers demandés inaccessibles dans le refus"` : `chantier_ids: ["CH-999"]` donne `{ detail: "compteurs", resultats: [], acces_refuse: true, chantiers_non_accessibles: ["CH-999"] }`.
  - `"refuse un chantier inaccessible même avec un indicateur accessible"` : `chantier_ids: ["CH-999"]`, `indicateur_ids: ["IND-001"]`, requête d'identité et query non appelées.
  - `"n'appelle pas la requête d'identité sans indicateur demandé"`.
  - `"vérifie plusieurs indicateurs en une seule requête d'identité"` : `toHaveBeenCalledTimes(1)`, `{ indicateurIds: ["IND-001", "IND-002"] }`.
  - `"des indicateurs tous introuvables ne sont pas un refus"` : `{ detail: "compteurs", resultats: [], indicateurs_introuvables: ["IND-404"] }`, query non appelée.
  - `"refuse quand aucun indicateur n'est interrogeable et qu'un est inaccessible"` : IND-003 sur CH-003 et IND-404 donnent `{ detail: "compteurs", resultats: [], acces_refuse: true, indicateurs_non_accessibles: ["IND-003"], indicateurs_introuvables: ["IND-404"] }`, sans `CH-003` dans la sortie.
  - `"mélange interrogé, inaccessible et introuvable"` : la query reçoit `indicateurIds: ["IND-001"]`, la sortie porte les deux listes et les résultats.
  - `"un indicateur nommé ajoute son chantier à ceux demandés"` : `chantier_ids: ["CH-001"]`, `indicateur_ids: ["IND-002"]`, IND-002 sur CH-002 accessible, la query reçoit `chantierIds: ["CH-001", "CH-002"]`.
  - `"dédoublonne les identifiants demandés"` : `indicateur_ids: ["IND-404", "IND-404"]` donne `indicateurs_introuvables: ["IND-404"]`, et `["IND-001", "IND-001"]` donne `indicateurIds: ["IND-001"]`.

  Supprimer les tests fondés sur `territoire_code` et `GetIndicateurContexteQuery`.

- [ ] **Step 2: Vérifier l'échec.** Run: `pnpm vitest run src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implémenter le schéma.** Retirer `territoire_code`. Ajouter `perimetre` : l'union des cinq `variantesPerimetre`, `.optional()`, décrite par `descriptionPerimetre({ types })` suivi de la phrase de la spec sur le défaut et le territoire courant.

- [ ] **Step 4: Implémenter `resoudreAcces`.** Fonction locale au fichier, qui applique dans l'ordre les règles 1 à 5 de la section « Accès » de la spec et s'arrête au premier refus. Elle renvoie soit un refus portant les listes déjà calculées, soit `{ chantierIds, territoireCodes, indicateurIds?, chantiersNonAccessibles, indicateursNonAccessibles, indicateursIntrouvables }`. Un cas à part : tous introuvables renvoie une sortie sans refus et sans appel à la query. Dédoublonner `input.indicateur_ids` avec `new Set` avant tout traitement.

- [ ] **Step 5: Réécrire la description de l'outil.** Suivre la section « Description de l'outil » de la spec, avec la sémantique des `null` de la section « Sortie » et la proposition du détail après des compteurs. Retirer la phrase sur `indicateur_ids` ou `territoire_code` qui déclenche le détail.

- [ ] **Step 6: Vérifier le succès.** Run: `pnpm vitest run src/server/albert && pnpm tsc --noEmit`. Expected: PASS, aucune erreur de type.

---

### Task 4: Prompt système, eval N2 et mesure

**Files:**
- Modify: `src/server/albert/systemPrompt.ts`
- Modify: `evals/2-tools/2.2-donnees/getIndicateursNonAJour.eval.ts`

**Interfaces:**
- Consumes: le schéma d'entrée de Task 2 et Task 3.

- [ ] **Step 1: Ajouter l'exemple au prompt.** Dans « Exemples » : « Sur quels territoires le CH-018 a des indicateurs non à jour ? » → get_indicateurs_non_a_jour sur CH-018 avec le détail par territoires, sans périmètre.

- [ ] **Step 2: Mettre à jour la suite d'eval.** Corriger le commentaire d'en-tête (`territoire_code` devient `perimetre`), puis modifier deux cas existants :
  - « Sur quels territoires les données de l'indicateur IND-894 ne sont pas à jour ? » : `{ indicateur_ids: ["IND-894"], detail: "territoires" }`.
  - « L'IND-894 est-il à jour au niveau national ? » : `{ indicateur_ids: ["IND-894"], perimetre: { type: "SELECTION", territoire_codes: ["NAT-FR"] } }`.

  Ajouter ces cas :
  - « Sur quels territoires le CH-018 a des indicateurs non à jour ? » : `{ chantier_ids: ["CH-018"], detail: "territoires" }`.
  - « Donne les départements non à jour pour l'IND-894 » : `{ indicateur_ids: ["IND-894"], detail: "territoires", perimetre: { type: "TOUS_DEPARTEMENTS" } }`.
  - « Les données du CH-018 sont-elles à jour en REG-53 et ses départements ? » : `{ chantier_ids: ["CH-018"], perimetre: { type: "REGION_ET_SES_DEPARTEMENTS", region_code: "REG-53" } }`.
  - « Quels sont les indicateurs non à jour, avec le détail par territoire ? » : `{ detail: "territoires" }`.
  - « Quels chantiers ont des indicateurs à mettre à jour ? » : `{ detail: "compteurs" }` si le scorer voit la valeur par défaut dans l'appel, sinon `toolName` seul, à vérifier dans `evals/scoreExpectedTools.ts` et à la première exécution.

- [ ] **Step 3: Vérifier tests et lint.** Run: `pnpm vitest run src/server/albert && pnpm tsc --noEmit && pnpm lint`. Expected: PASS, aucune erreur.

- [ ] **Step 4: Mesurer.** Run: `pnpm eval evals/2-tools/2.2-donnees/getIndicateursNonAJour.eval.ts`. Expected : les cas communs ne régressent pas face à la mesure de Task 1. Rejouer la suite seule en cas de 503 ou 429.

- [ ] **Step 5: Rapporter.** Donner à l'utilisateur le tableau avant/après par cas et le verdict de chaque cas en échec, sans corriger un attendu sans le signaler. Demander s'il souhaite lancer `pnpm test:e2e` et créer le commit.
