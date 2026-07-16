# Détection & filtrage du type de valeur (VI/VA/VC) à l'import Albert

**Date :** 2026-07-16
**Branche :** `feat/import-albert-fallback`

## Problème

Certains utilisateurs importent des fichiers issus de **Pilote PPG**. Ces fichiers
portent une colonne supplémentaire `type_valeur` distinguant trois concepts :

- **VI** — valeur initiale
- **VA** — valeur d'avancement (aussi « valeur actuelle »)
- **VC** — valeur cible

Dans kpilote, **seules les VA ont du sens** : les valeurs initiale et cible sont des
concepts qui n'existent pas ici. Un fichier PPG a donc plusieurs lignes par
(individu, date) — une par type — et importer aveuglément produirait des valeurs
fausses (mélange VI/VA/VC sur le même point).

La nomenclature est **hétérogène et imprévisible** : `vi`/`va`/`vc`, `VA`,
`Valeur Actuelle`, `Valeur Avancement`, `VALEUR_AVANCEMENT`, etc. On ne peut pas la
figer dans le code.

## Objectif

Étendre le pipeline de normalisation Albert pour :

1. **Détecter** la colonne portant le type de valeur (quand elle existe).
2. **Résoudre sémantiquement** — via Albert, sans nomenclature hardcodée — quelles
   valeurs de cette colonne correspondent au concept de « valeur d'avancement ».
3. **Filtrer** les lignes pour ne conserver que les VA, en écartant les autres de
   façon transparente pour l'utilisateur.

Les fichiers kpilote normaux (sans colonne type) doivent conserver un comportement
**strictement inchangé**.

## Contexte technique — pipeline existant

Le pipeline vit dans `apps/kpilote-api/src/valeurImport/` et s'orchestre dans
`commands/normaliserValeursImport.ts` :

```
Pass 1  decouvrirStructure   → plan (long | pivot)
Pass 2  resoudreIndividus    → mapping libellés → publicId (agentic loop + tool)
        appliquerPlan        → produit les triplets { individu, date, valeur } + warnings
```

Le schéma partagé (plan, item, warnings, réponse API) est dans
`packages/kpilote-shared/src/valeurImport.ts`. L'UI de revue est dans
`apps/kpilote-webapp/src/components/import-valeurs/NormalisationReviewView.tsx`.

## Design

### Vue d'ensemble

On insère une **3ᵉ passe Albert** (`resoudreTypeValeur`) entre la découverte de
structure et la résolution des individus. Elle ne tourne **que si** une colonne type
a été détectée en pass 1.

```
Pass 1   decouvrirStructure    → plan (+ colonneTypeValeur?.nom)
Pass 1b  resoudreTypeValeur     → { valeursRetenues[] }   ← NOUVEAU, conditionnel
Pass 2   resoudreIndividus      → mapping libellés → publicId
         appliquerPlan          → pré-filtre lignes non-VA, puis produit les items
```

### 1. Schéma partagé — `packages/kpilote-shared/src/valeurImport.ts`

Ajouter un champ **optionnel** `colonneTypeValeur` aux deux plans (long ET pivot) :

```typescript
const colonneTypeValeurSchema = z.object({
  nom: z.string(),
})

const planLongSchema = z.object({
  layout: z.literal('long'),
  colonneIndividu: z.string(),
  colonneDate: colonneDateSchema,
  colonneValeur: z.string(),
  colonneTypeValeur: colonneTypeValeurSchema.optional(),
})

const planPivotSchema = z.object({
  layout: z.literal('pivot'),
  colonneIndividu: z.string(),
  colonnesPivot: z.array(...).min(1),
  colonneTypeValeur: colonneTypeValeurSchema.optional(),
})
```

**Le modèle `ItemNormaliseApiModel` reste inchangé** : `{ individu, date, valeur }`.
Le type de valeur est un critère de filtrage, pas une donnée métier de kpilote — on
n'ajoute aucun champ `typeValeur`. (Cohérent avec « API agnostique / pas de concept
qui n'existe pas dans kpilote ».)

La réponse API expose les valeurs retenues pour l'affichage. On étend le plan renvoyé
(via `colonneTypeValeur`) et on ajoute au niveau réponse un objet optionnel décrivant
la résolution du type :

```typescript
resolutionTypeValeur: z
  .object({
    colonne: z.string(),
    valeursDistinctes: z.array(z.string()),
    valeursRetenues: z.array(z.string()),
  })
  .optional()
```

Ajouter un code de warning générique pour les lignes écartées :

```typescript
code: z.enum([
  'INDIVIDU_NON_RESOLU',
  'INDIVIDU_HALLUCINE',
  'DATE_INVALIDE',
  'VALEUR_INVALIDE',
  'CELLULE_VIDE',
  'LIGNE_IGNOREE', // NOUVEAU — code générique « ligne ignorée + raison »
])
```

### 2. Pass 1 — extension de `decouvrirStructure.ts`

Albert détecte le **header** de la colonne type (pas ses valeurs). On ajoute
`colonneTypeValeur` optionnel aux schémas Zod `planLongSchema` et `planPivotSchema`,
avec un `.describe()` explicatif, et une instruction au `SYSTEM_PROMPT` :

> DÉTECTION OPTIONNELLE — Si une colonne distingue plusieurs **types de valeur**
> (valeur initiale, valeur cible, valeur d'avancement / valeur actuelle — typique des
> exports Pilote PPG), renseigne `colonneTypeValeur.nom` avec le header exact. Sinon,
> laisse ce champ absent.

Le champ étant optionnel, les fichiers sans colonne type produisent le même plan
qu'aujourd'hui.

### 3. Pass 1b — nouvelle passe `calls/resoudreTypeValeur.ts`

**Déclenchement :** uniquement si `plan.colonneTypeValeur` est présent (branche
conditionnelle dans `normaliserValeursImport.ts`).

**Entrée :** le **set des valeurs distinctes** de la colonne, extrait côté API à partir
des `rows` (helper analogue à `extraireLibellesSources`, réutilisable/paramétré par nom
de colonne). Ex : `["vi", "va", "vc"]`.

**Implémentation :** `generateObject` simple (pas d'agentic loop avec tool comme
`resoudreIndividus` — le set est petit, typiquement 2 à 4 valeurs). Suit le pattern de
`decouvrirStructure` : `ResultAsync.fromPromise`, logs `start`/`done`/`error`,
`ALBERT_TEMPERATURE`, mêmes types d'erreur (`ALBERT_NON_CONFIGURE`,
`ALBERT_UNAVAILABLE`).

**System prompt** (avec les exemples concrets fournis) :

> Tu reçois l'ensemble des valeurs distinctes d'une colonne qui indique le **type de
> valeur** dans un fichier de données territorial (souvent issu de Pilote PPG).
> Trois concepts coexistent :
> - **valeur initiale** (VI) — état de départ ;
> - **valeur cible** (VC) — objectif visé ;
> - **valeur d'avancement / valeur actuelle** (VA) — mesure constatée courante.
>
> kpilote n'importe **que les valeurs d'avancement (VA)**. Ta tâche : parmi les valeurs
> fournies, renvoie **exactement** celles (recopiées à l'identique) qui correspondent au
> concept de valeur d'avancement / valeur actuelle.
>
> La nomenclature varie : `va`, `VA`, `Valeur Actuelle`, `Valeur Avancement`,
> `VALEUR_AVANCEMENT`, etc. Ne conserve jamais les valeurs correspondant à VI ou VC.
> Si aucune valeur ne correspond clairement à une valeur d'avancement, renvoie une liste
> vide.

**Schéma de sortie :**

```typescript
z.object({
  valeursRetenues: z.array(z.string()), // sous-ensemble du set fourni, recopié à l'identique
})
```

### 4. Orchestration — `commands/normaliserValeursImport.ts`

Après la découverte réussie, avant `resoudreIndividus` :

- si `plan.colonneTypeValeur` absent → chemin actuel inchangé, `valeursRetenues` non
  défini ;
- si présent → extraire le set distinct, appeler `resoudreTypeValeur`, récupérer
  `valeursRetenues` et le passer à `appliquerPlan`. La réponse porte
  `resolutionTypeValeur` pour l'UI.

Les erreurs Albert de la passe 1b se mappent comme les autres
(`ALBERT_NON_CONFIGURE` / `ALBERT_UNAVAILABLE`). **Note :** l'absence de VA résolue
n'est **pas** une erreur (voir §6) — c'est un résultat `valeursRetenues: []` traité en
non-bloquant.

### 5. `appliquerPlan.ts` — pré-filtrage au niveau ligne

Nouveau paramètre optionnel `typeValeur?: { colonne: string; valeursRetenues: string[] }`.

Quand il est fourni, on filtre **au niveau ligne, en amont** de la logique long/pivot
existante (donc commun aux deux layouts, avant l'expansion pivot) :

- On normalise pour comparer (trim + casse insensible) la cellule
  `row[typeValeur.colonne]` contre `valeursRetenues`.
- Ligne retenue (valeur ∈ `valeursRetenues`) → traitée normalement.
- Ligne écartée → un warning générique `LIGNE_IGNOREE` :
  > `Ligne {i} : valeur « vc » écartée (colonne « type_valeur ») — seules les valeurs d'avancement sont importées.`

Le `WarningApplication.code` gagne `'LIGNE_IGNOREE'`.

### 6. Cas « aucune VA résolue » — non-bloquant, tout écarter

Si `valeursRetenues` est vide (colonne détectée mais Albert n'a identifié aucune VA) :
toutes les lignes de la colonne sont écartées → **0 item produit**, et on émet **un
warning global** (non rattaché à une ligne) :

> Aucune valeur d'avancement n'a pu être identifiée dans la colonne « type_valeur ».
> Aucune valeur n'a été importée. Vérifiez le fichier ou la nomenclature.

C'est prudent : on préfère un import vide + message clair plutôt que d'importer des
VI/VC par erreur. (Non-bloquant : pas d'erreur 422, la review s'affiche normalement
avec 0 item et le warning.)

### 7. UI — `NormalisationReviewView.tsx`

Nouveau **bloc dédié « Type de valeur »**, affiché seulement si `resolutionTypeValeur`
est présent dans la réponse :

- colonne détectée (`type_valeur`) ;
- valeurs **retenues** (VA) vs **écartées** (le complément de `valeursDistinctes`) ;
- s'appuie sur le compteur de lignes ignorées déjà dérivable des warnings.

Les lignes écartées apparaissent dans la **liste de warnings existante** (ligne +
raison), via le code générique `LIGNE_IGNOREE`. Pas de composant de warning
spécifique : bloc dédié pour le résumé de la règle + warnings génériques pour le détail
ligne à ligne.

## Découpage par unité

| Unité | Fichier | Responsabilité |
|-------|---------|----------------|
| Schéma plan + réponse | `kpilote-shared/src/valeurImport.ts` | `colonneTypeValeur` optionnel, `resolutionTypeValeur`, code `LIGNE_IGNOREE` |
| Détection header | `calls/decouvrirStructure.ts` | schéma Zod + prompt : détecter `colonneTypeValeur.nom` |
| Résolution sémantique | `calls/resoudreTypeValeur.ts` (nouveau) | set distinct → `valeursRetenues` via Albert |
| Orchestration | `commands/normaliserValeursImport.ts` | brancher 1b conditionnellement, exposer `resolutionTypeValeur` |
| Filtrage | `appliquerPlan.ts` | pré-filtre ligne + warning `LIGNE_IGNOREE` + warning global si vide |
| UI | `NormalisationReviewView.tsx` | bloc « Type de valeur » + warnings existants |

## Tests (kpilote-api)

- `resoudreTypeValeur` : mock Albert, vérifie le sous-ensemble retourné (nomenclatures
  variées `vi`/`va`/`vc`, `Valeur Avancement`, `VALEUR_AVANCEMENT`).
- `appliquerPlan` avec `typeValeur` :
  - layout **long** PPG → seules les lignes VA produisent des items, warnings
    `LIGNE_IGNOREE` sur VI/VC ;
  - layout **pivot** avec colonne type → filtrage par ligne avant expansion ;
  - `valeursRetenues: []` → 0 item + warning global ;
  - `typeValeur` absent → comportement identique à aujourd'hui (non-régression).
- Orchestration `normaliserValeursImport` : fichier sans colonne type → pas d'appel à
  `resoudreTypeValeur`, réponse sans `resolutionTypeValeur`.

Conventions de test respectées : `uuidv7`, valeurs hardcodées, fixtures variadic.

## Hors scope (YAGNI)

- Stockage du type de valeur en base ou dans le modèle final.
- Gestion d'un `sensEvolutionAttendu` ou de la baisse.
- Support d'autres discriminants génériques que le type de valeur (on nomme
  explicitement `colonneTypeValeur`, pas `colonneDiscriminante`) — l'esprit générique
  vit uniquement côté warning (`LIGNE_IGNOREE`).
