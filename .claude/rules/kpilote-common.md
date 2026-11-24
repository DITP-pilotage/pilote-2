---
paths:
  - "apps/kpilote-*/**"
  - "packages/kpilote-*/**"
---

# kpilote : règles communes

Valent pour `kpilote-api`, `kpilote-webapp`, `kpilote-admin`, `kpilote-shared` et `kpilote-ui`. On applique ces règles au code qu'on écrit ou qu'on touche dans la PR ; on ne refactore pas l'existant hors périmètre sans demande explicite.

## Nommage

### Technique en anglais, termes métier en français
Fonctions, types, variables, paramètres, champs internes et noms de fichiers : verbes et mots techniques en anglais (`get`, `list`, `load`, `build`, `resolve`, `find`, `upsert`, `By`, `For`, `key`, `context`, `error`). Les termes du domaine restent en français : axe, modalité, combinaison, cellule, individu, indicateur, référentiel, saisie, valeur, collection, commentaire, objectif.
Pourquoi : le code se lit comme du TypeScript standard, et le vocabulaire métier reste celui de la spec.
- À faire : `loadModalitesContext`, `findOrCreateCombinaisons`, `idByKey`, `enfantsByParent`, `existingIds`
- À éviter : `chargerContexteModalites`, `trouverOuCreerCombinaisons`, `idParCle`, `existantes`

### Pas d'accent dans les identifiants
Les identifiants s'écrivent sans accent : `modalite`, `referentiel`, `Visibilite.PRIVE`.
Pourquoi : c'est la pratique constante de kpilote (aucun identifiant accentué hors un script), contrairement à pilote-ppg.

### Vocabulaire kpilote, pas celui de pilote-ppg
On parle d'**individu** (un territoire n'est qu'un cas d'individu) et de **référentiel** ; jamais de « maille » ni de « territoire » dans le code, l'UI ou les docs.
Pourquoi : kpilote est une marque blanche ; ces termes portent un sens précis dans pilote-ppg.
- À faire : `buildGrapheIndividus`, « individus enfants »
- À éviter : `buildGrapheTerritoire`, `maille`

### Pas de nom à une ou deux lettres
Sauf index de boucle et paramètres de comparateur triviaux, on écrit le nom complet.
Pourquoi : un nom court oblige à remonter au contexte pour savoir ce qu'il désigne.
- À faire : `.map((modalite) => modalite.publicId)`, `catch (error)`
- À éviter : `.map((m) => m.publicId)`, `catch (e)`

## Fonctions

### Paramètres sous forme d'objet nommé
Une fonction qui prend deux paramètres ou plus reçoit un objet déstructuré. Un paramètre unique peut rester positionnel (`useCanWriteDataIndicateur(indicateurId)`).
Pourquoi : le site d'appel dit ce qu'il passe, on ajoute un paramètre sans casser l'ordre, on ne confond pas deux `string`.
- À faire : `getAxeByPublicId({ publicId })`, `prefetchSelectedData({ queryClient, indicateurId, selected })`
- À éviter : `prefetchSelectedData(queryClient, indicateurId, selected)`

### Fonctions fléchées exportées, exports nommés
Hors composants React : `export const foo = (...): T => ...`. Jamais d'`export default` (lint `import/no-default-export`), jamais de barrel `index.ts`.
Pourquoi : forme constante de l'API et de shared (324 contre 0) ; un import nommé se renomme et se cherche sans ambiguïté.

## Code générique

### Un helper générique vit dans un module partagé, pas dans le fichier qui l'utilise
Un helper qui ne parle pas du domaine du fichier où on l'écrit (texte, nombres, dates, collections, flux, lecture de fichier, hook, filtre d'UI) va dans le module transverse du projet. Avant de l'écrire, on cherche s'il existe déjà : dans es-toolkit, puis dans ces modules.
- `packages/kpilote-shared` : logique pure utile à plusieurs projets (`texte.ts`, `nombre.ts`, `dates.ts`, `record.ts`).
- `packages/kpilote-ui` : composants et helpers d'interface (`commandFilter`, `PickerList`).
- `apps/kpilote-api` : `src/framework/` (`collections/`, `concurrency.ts`, `llm/`). Un ajout y reste soumis à « Pas de framework sans discussion ».
- `apps/kpilote-webapp` et `apps/kpilote-admin` : `src/lib/` (logique pure, hooks), et `src/api/` pour un client transverse (`api/sse.ts`).

Pourquoi : un helper rangé dans un fichier métier ne se trouve pas, et on le réécrit ailleurs. Avant PIL-1995, `commandFilter` existait en trois copies, `emptyToNull` en trois variantes et le `pad` des dates ISO en deux.
- À éviter : `components/import-valeurs/pluralize.ts`, `duplicatesOf` privé dans `valeurImport/rules.ts`, une liste cmdk recopiée de `Picker`.
- Exception : un helper de deux lignes sur es-toolkit, à un seul usage, peut rester local (`sortCandidats` dans `components/import-valeurs/grille.ts`).

## Lisibilité

### Pas de ternaire imbriqué
Un ternaire ne contient pas d'autre ternaire. Au-delà d'un niveau, on écrit une fonction nommée avec des retours anticipés (ou un `switch`). Règle oxlint `no-nested-ternary`.
Pourquoi : un ternaire imbriqué se lit à rebours et cache les cas.
- À faire :
  ```ts
  const signOf = (ecart: number): string => {
    if (ecart < 0) return MINUS
    if (ecart > 0) return '+'
    return ''
  }
  ```
- À éviter : `const sign = ecart < 0 ? MINUS : ecart > 0 ? '+' : ''` (`kpilote-api/src/assistant/tools/rapport/format.ts`)
- En JSX, une suite de cas exclusifs (chargement, vide, liste) devient un composant local à retours anticipés, pas une série de `{a && !b ? ... : null}` qui répètent les négations (`ContenuCorbeille` dans `kpilote-admin/src/routes/_authed/centre-aide/index.tsx`).

### Pas de `&&` et `||` mélangés dans une même expression
On nomme chaque sous-condition par un booléen au nom métier, ou on écrit des retours anticipés.
Pourquoi : la précédence se devine mal, même parenthésée ; le nom dit l'intention.
- À faire :
  ```ts
  const hasChildren = enfants.length > 0
  const isAddingChild = ajout?.parent === modalite.id
  const showChildren = hasChildren || isAddingChild
  ```
- À éviter : `{(enfants.length > 0 || ajout?.parent === modalite.id) && (...)}` (`kpilote-admin/src/components/ModalitesArbre.tsx`), `if (!output || (pending && !isStreaming)) return null` (`kpilote-webapp/src/assistant/AssistantMessage.tsx`)

### Transformations de collection avec es-toolkit
Pour indexer, regrouper, dédoublonner, partitionner ou compter, on appelle la fonction nommée d'`es-toolkit` (`keyBy`, `groupBy`, `uniqBy`, `partition`, `countBy`, `sortBy`) au lieu de l'écrire à la main. Elles renvoient un `Record` : avec `noUncheckedIndexedAccess`, `byId[id]` est déjà typé `T | undefined`, on l'utilise tel quel. Quand une signature attend une `Map`, `toMap(record)` de `@pilote/kpilote-shared/record`, plutôt que `new Map(Object.entries(...))` au milieu d'un algo.
Pourquoi : le nom dit l'intention ; une boucle `get(k) ?? []` puis `push` se relit à chaque fois.
- À faire : `const modalitesByNiveau = groupBy(modalites, (modalite) => modalite.niveauId)`, `const individuById = keyBy(individus, (individu) => individu.id)`
- À éviter :
  ```ts
  const modalitesByNiveau = new Map<string, Modalite[]>()
  for (const modalite of modalites) {
    const list = modalitesByNiveau.get(modalite.niveauId) ?? []
    list.push(modalite)
    modalitesByNiveau.set(modalite.niveauId, list)
  }
  ```

### Pas d'IIFE
Pas de `(async () => { ... })()` ni de `(() => ...)()` en JSX : on extrait une fonction nommée.
Pourquoi : une IIFE est une fonction anonyme déguisée en expression ; son nom manque à la lecture et au test.

## Textes de l'UI

### Pas de tiret cadratin « — » dans les textes affichés
Ni dans les phrases, ni comme séparateur de titre, ni comme valeur vide. On reformule (deux phrases, deux-points, parenthèses). Une valeur absente s'affiche par un tiret simple `-`.
Pourquoi : demande d'Antoine ; c'est une marque de texte généré.
- À faire : `'Le fichier est illisible. Vérifiez son format.'`, `valeur ?? '-'`
- À éviter : `'Le fichier est illisible — vérifiez son format.'`, `valeur ?? '—'`

### Textes en français, ponctuation française
Messages affichés et messages d'erreur en français, points de suspension « … » (pas `...`), guillemets « ».

## Commentaires

### Commentaires en français, sur le pourquoi
Un commentaire explique une contrainte, un invariant ou un choix (verrou, cascade, renvoi à un doc de `docs/architecture/`), pas ce que le code dit déjà.
Pourquoi : pratique constante de l'API ; les bons noms remplacent les commentaires descriptifs.
- À faire : `// Supprimer une modalité qui précise des valeurs les rendrait orphelines.` (`deleteModalite.ts`)

## Formatage et lint

### Prettier sur les fichiers modifiés uniquement
`pnpm exec prettier --write <fichiers modifiés>`, jamais sur un dossier entier ; relire `git status` avant de committer.
Pourquoi : un formatage de dossier gonfle le diff de fichiers hors sujet.

### Le lint fait foi
`pnpm -F <package> lint` doit passer (oxlint type-aware, `tsc`, `prettier --check`). Pas de `eslint-disable` / `oxlint-disable` sans commentaire qui justifie.
Config Prettier commune : pas de point-virgule, guillemets simples, `trailingComma: all`, 100 colonnes.
