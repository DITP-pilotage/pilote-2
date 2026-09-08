# Tool Albert « chantiers signalés » — Design

Date : 2026-09-08
Statut : Validé

## Contexte

PILOTE dispose déjà d'un concept métier de **chantiers signalés** : 6 types d'alerte
calculés par territoire et par jalon, portés par le domaine `Alerte.ts`
(`src/server/domain/alerte/Alerte.ts`) :

| Code interne | Libellé officiel |
|---|---|
| `ecart` | Retard par rapport à la médiane |
| `baisse` | Tendance en baisse |
| `taux_non_calcule` | Taux d'avancement non calculé |
| `absence_taux_departemental` | Absence de taux d'avancement départemental |
| `meteo_non_renseignee` | Météo et synthèse non renseignées |
| `pva` | Proposition de valeur d'avancement |

Ce concept est aujourd'hui exposé uniquement via le widget
`WidgetChantiersSignales.tsx`, alimenté par `GetChantiersSignalesQuery`
(`src/server/chantiers/infrastructure/queries/GetChantiersSignalesQuery.ts`), qui
retourne des **compteurs agrégés** (`Record<TypeAlerteChantier, number>`), jamais la
liste des chantiers concernés. Le clic sur une tuile déclenche une navigation qui
filtre en mémoire, côté pages `accueil/chantier/[territoireCode]`, la liste complète
des chantiers déjà chargée.

Deux catégories existent selon la maille interrogée (sans les rendre strictement
disjointes) :
- **National** (`NAT-FR`) : `taux_non_calcule`, `absence_taux_departemental`,
  `meteo_non_renseignee`, `pva`.
- **Régional/départemental** (`REG-XX` / `DEPT-XX`) : `ecart`, `baisse`,
  `meteo_non_renseignee`, `pva`.

`meteo_non_renseignee` et `pva` sont donc communes aux deux mailles ; `ecart`/`baisse`
n'existent qu'en régional/départemental ; `taux_non_calcule`/
`absence_taux_departemental` n'existent qu'au national.

L'assistant Albert (`apps/pilote-ppg/src/server/albert/`) dispose déjà du tool
`get_chantiers` (`src/server/albert/tools/getChantiers.ts`), qui couvre notamment
`view='en_retard'` (== `ecart`) et le filtre `tendance='BAISSE'` (== `baisse`), mais
n'a aucun moyen d'identifier une météo non renseignée (son enum `meteo` ne couvre que
`SOLEIL/COUVERT/NUAGE/ORAGE`) ni les 4 autres types de signalement.

## Objectif

Permettre à l'utilisateur de demander à Albert les chantiers signalés sur un
territoire donné — une ou plusieurs catégories, avec une explication claire quand une
catégorie demandée n'existe pas à la maille interrogée — via un nouveau tool
`get_chantiers_signales`, sans dupliquer ni modifier le comportement de
`get_chantiers` ni du widget existant.

## 1. Nouvelle query : `GetChantiersSignalesDetailQuery`

Nouveau fichier `src/server/chantiers/infrastructure/queries/GetChantiersSignalesDetailQuery.ts`,
**séparé** de `GetChantiersSignalesQuery` (qui reste inchangée, dédiée au widget). Les
deux partagent la même forme de récupération de base mais des responsabilités
différentes (compteurs vs listes) : les mélanger casserait l'isolation entre le
contrat du widget et celui du tool IA.

### Entrée

```ts
{
  territoireCode: string;       // un seul territoire, pas de sous-territoires
  jalon: number;
  chantierIds: string[];        // déjà filtrés par chantiersAccessibles en amont
  categories: TypeAlerteChantier[]; // catégories demandées et applicables à la maille
}
```

### Logique

1. Réutilise la même récupération Prisma que `GetChantiersSignalesQuery.recupererChantierTerritoires`,
   en ajoutant le champ `chantier_identite.nom` (absent aujourd'hui, nécessaire pour le
   format `CH-XXX — Nom du chantier`).
2. Réutilise `compterPva` et `compterAbsenceTauxDepartemental` adaptées pour retourner
   les `Set<string>` d'ids déjà calculés (ces méthodes calculent déjà des ensembles en
   interne avant de les compter — on les expose tels quels au lieu de ne garder que
   `.size`).
3. Pour chaque chantier candidat, évalue **tous** les prédicats `Alerte.*`
   correspondant aux catégories demandées (même source de vérité que le widget et les
   pages d'accueil — pas de réimplémentation du seuil `ecart <= -10` ou de la
   condition `tendance === "BAISSE"`), et retient le sous-ensemble des catégories
   demandées qu'il matche.
4. Retourne une **liste plate** de chantiers (un chantier = une seule entrée, même
   s'il matche plusieurs catégories), chacun portant la liste des catégories
   matchées :

```ts
type ChantierSignale = {
  id: string;
  nom: string;
  meteo: string | null;
  ecart: number | null;
  categories: TypeAlerteChantier[]; // sous-ensemble des catégories demandées matchées
};

type GetChantiersSignalesDetailResult = ChantierSignale[];
```

Un chantier n'apparaît dans le résultat que s'il matche au moins une catégorie
demandée. Ce format plat (plutôt qu'un regroupement `{categorie, chantiers[]}[]`) évite
qu'un même chantier apparaisse dans plusieurs groupes sans lien explicite entre les
occurrences — le tool peut reconstruire aussi bien une vue par catégorie qu'une vue par
chantier à partir de cette seule liste. `meteo` et `ecart` sont déjà présents sur
chaque ligne de base (pas de coût supplémentaire) et exposés uniformément quelle que
soit la catégorie. Pas de détail par département pour `absence_taux_departemental`
(juste la liste des chantiers concernés, décision explicite pour limiter la portée).

### Enregistrement DI

- Enregistrer `getChantiersSignalesDetailQuery` dans le container `chantiers`
  (`src/server/chantiers/module.ts`), puis l'ajouter aux `exports` et au type
  `ChantierExports` de ce module — seul ajout nécessaire : `getChantiersSignalesQuery`
  (compteurs, existante) reste un détail interne au module `chantiers`, non exportée,
  puisque le tool Albert ne la consomme pas.
- L'injecter dans `src/server/albert/module.ts` comme les autres queries consommées par
  les tools (pattern `createGetChantiersTool`).

## 2. Tool Albert `get_chantiers_signales`

Nouveau fichier `src/server/albert/tools/getChantiersSignales.ts`, sur le même schéma
que `getChantiers.ts` (factory `createGetChantiersSignalesTool({ query })` puis
`({ territoiresAccessibles, chantiersAccessibles }) => tool({...})`).

### Schéma d'entrée

```ts
export const getChantiersSignalesInputSchema = z.object({
  territoire_code: z.string().describe(
    "Code du territoire (ex: NAT-FR, REG-11, DEPT-75). Un seul territoire par appel, " +
    "pas de sous-territoires."
  ),
  jalon: z.number().int().min(2022).max(new Date().getFullYear()),
  categories: z
    .array(z.enum([
      "ecart", "baisse", "taux_non_calcule",
      "absence_taux_departemental", "meteo_non_renseignee", "pva",
    ]))
    .optional()
    .describe(
      "Catégories de signalement demandées. Absent = toutes les catégories " +
      "applicables à la maille du territoire interrogé."
    ),
  chantier_ids: z.array(z.string()).optional(),
});
```

### Logique d'exécution

1. **Contrôle d'accès territoire** : si `territoire_code` n'est pas dans
   `territoiresAccessibles`, retourner immédiatement un refus explicite (pas
   d'appel à la query, pas de masquage partiel comme le fait `get_chantiers`) :
   ```ts
   { resultats: [], acces_refuse: true, _output_instructions:
     "L'utilisateur n'a pas accès à ce territoire pour les chantiers signalés. " +
     "Explique-le poliment sans donner de détail sur les données du territoire." }
   ```
   Ce comportement diffère volontairement de `get_chantiers` (qui autorise
   l'interrogation de n'importe quel territoire avec masquage de champs) : le widget
   front équivalent n'est lui-même accessible que sur les territoires autorisés de
   l'utilisateur, et ce tool reproduit cette contrainte plutôt que le modèle de
   masquage.
2. **Filtrage `chantier_ids`** : comme `get_chantiers`, filtrer par
   `chantiersAccessibles` ; si le filtre vide une liste explicitement fournie, retourner
   un message dédié (même pattern que `get_chantiers`).
3. **Résolution des catégories applicables** : à partir de la maille dérivée de
   `territoire_code` (`territoireCodeVersMailleCodeInsee`), calculer
   `categoriesApplicables` (national : `taux_non_calcule`, `absence_taux_departemental`,
   `meteo_non_renseignee`, `pva` ; régional/départemental : `ecart`, `baisse`,
   `meteo_non_renseignee`, `pva`). Séparer les catégories demandées
   (`input.categories` ou toutes les catégories applicables si absent) en
   `categoriesÀInterroger` (intersection avec `categoriesApplicables`) et
   `categoriesNonApplicables` (le reste).
4. **Appel à la query** avec `categoriesÀInterroger` uniquement.
5. **Construction de la réponse** :

```ts
type GetChantiersSignalesOutput = {
  resultats: ChantierSignale[]; // liste plate, cf. §1 — un chantier = une entrée,
                                  // categories liste tout ce qu'il matche parmi
                                  // les catégories demandées
  categories_non_applicables?: { categorie: TypeAlerteChantier; raison: string }[];
  _output_instructions: string;
};
```

Les raisons pour `categories_non_applicables` reprennent le style déjà utilisé pour
`NON_APPLICABLE_EN_RETARD_NAT_FR` dans `getChantiers.ts`, par exemple pour `ecart` au
national :
> « Le signalement "Retard par rapport à la médiane" ne peut pas être calculé au
> niveau national : il repose sur une comparaison entre le taux d'avancement d'un
> chantier sur un territoire donné et la médiane des autres territoires du même
> niveau. »

`_output_instructions` précise :
- utiliser les libellés officiels des catégories (jamais les codes internes), au
  format `CH-XXX — Nom du chantier` pour chaque chantier ;
- choisir la présentation — **par catégorie** (une section par catégorie avec la liste
  des chantiers) ou **par chantier** (un chantier avec la liste de ses catégories) —
  selon ce qui répond le mieux à la formulation de la demande de l'utilisateur (ex :
  « quels chantiers ont un problème de météo ? » → par catégorie ; « quels sont les
  signalements du chantier CH-042 ? » ou une demande portant sur plusieurs catégories
  à la fois → par chantier peut être plus lisible) ;
  un chantier concerné par plusieurs catégories ne doit **jamais** être cité comme
  deux chantiers séparés dans deux sections indépendantes sans que le lien entre les
  deux occurrences soit explicite ;
- mentionner explicitement les catégories non applicables en reprenant leur raison, ne
  pas inventer de liste vide silencieuse ;
- `meteo` et `ecart` sont présents sur chaque chantier quelle que soit la catégorie
  mais ne doivent être mis en avant que quand ils sont pertinents pour au moins une des
  catégories matchées par ce chantier (`ecart` pour "Retard par rapport à la
  médiane", `meteo` pour "Météo et synthèse non renseignées" — sinon l'assistant ne
  les mentionne pas).

### Enregistrement

- `createGetChantiersSignalesTool` enregistré dans `src/server/albert/module.ts`
  (pattern `asModuleFunction`), comme les autres tools.
- Ajouté sans condition (pas de `capacities.*`) dans l'objet `tools` de
  `src/app/api/albert/chat/route.ts`, au même niveau que `get_chantiers` — cohérent
  avec le choix de ne pas restreindre ce tool par profil utilisateur.

## 3. System prompt (`systemPrompt.ts`)

### Glossaire

Nouvelle section « Chantiers signalés », sur le modèle de la section « Météo » :
tableau code interne → libellé officiel (cf. tableau en Contexte), avec la même
consigne : ne jamais utiliser les codes internes (`ecart`, `baisse`, etc.) dans les
réponses.

Préciser explicitement le lien avec le vocabulaire déjà connu de l'assistant :
- « Retard par rapport à la médiane » **est le même critère** que « chantiers en
  retard » (`get_chantiers` view `en_retard`, écart ≤ -10 points).
- « Tendance en baisse » **est le même critère** que le filtre `tendance=BAISSE` de
  `get_chantiers`.

### Table de routage (nouvelle entrée dans « Comprendre les demandes utilisateur »
ou nouveau protocole dédié « d. Chantiers signalés »)

| Demande utilisateur | Tool à utiliser |
|---|---|
| Une seule catégorie = Retard par rapport à la médiane | `get_chantiers(view='en_retard')` — **jamais** `get_chantiers_signales` |
| Une seule catégorie = Tendance en baisse | `get_chantiers(tendance='BAISSE')` — **jamais** `get_chantiers_signales` |
| Une seule catégorie parmi {Taux non calculé, Absence taux départemental, Météo et synthèse non renseignées, PVA} | `get_chantiers_signales(categories=[...])` |
| Plusieurs catégories demandées (2 ou plus), quelles qu'elles soient | `get_chantiers_signales(categories=[...])` — y compris si Retard et/ou Baisse en font partie |
| « Chantiers signalés », « signalements » sans précision de catégorie | `get_chantiers_signales()` sans `categories` → toutes les catégories applicables à la maille |

Principe général à formuler dans le prompt : *une seule catégorie qui a un équivalent
exact dans `get_chantiers` → `get_chantiers` ; sinon (catégorie sans équivalent, ou
plusieurs catégories) → `get_chantiers_signales`.*

## 4. Cas limites

- **Un chantier matche plusieurs catégories demandées** (ex : écart ≤ -10 **et**
  météo non renseignée simultanément) : une seule entrée dans `resultats`, avec
  `categories: ["ecart", "meteo_non_renseignee"]` — jamais deux entrées séparées pour
  le même chantier.
- **Territoire non accessible** : refus explicite sans appel query (cf. §2.1).
- **Catégorie(s) demandée(s) non applicable(s) à la maille, mélangées à des catégories
  applicables** : la réponse contient les résultats des catégories applicables **et**
  les raisons des catégories non applicables, dans le même appel (décision produit
  explicite — pas de tout-ou-rien).
- **Toutes les catégories demandées sont non applicables** (ex : demander "Retard" et
  "Tendance en baisse" ensemble sur `NAT-FR` — 2 catégories donc routées vers
  `get_chantiers_signales` malgré leurs équivalents `get_chantiers`, et toutes deux non
  applicables au national) : `resultats` vide, `categories_non_applicables` rempli,
  `_output_instructions` insiste pour ne pas présenter ça comme une absence de
  données.
- **`chantier_ids` fourni mais entièrement hors `chantiersAccessibles`** : message
  dédié, aucun appel query (même pattern que `get_chantiers`).
- **Aucun chantier signalé pour une catégorie applicable** : liste vide légitime,
  l'assistant doit le dire (pas d'appel query supplémentaire nécessaire, résultat déjà
  disponible).
- **Sous-territoires** : non supporté par ce tool (contrairement à `get_chantiers`).
  Une demande du type « chantiers signalés de la région X et ses départements »
  nécessite un appel par territoire (parent + chaque département), pas de flag
  `include_sous_territoires`.

## 5. Tests

- **Query** (`GetChantiersSignalesDetailQuery.integration.test.ts`, même dossier que
  `GetChantiersSignalesQuery.integration.test.ts`) : tests d'intégration avec
  `createIntegrationTest` + `fixtures`, un test par catégorie (au moins un cas où le
  chantier apparaît, un cas où il n'apparaît pas), un test dédié où un même chantier
  matche 2 catégories demandées simultanément (vérifie une seule entrée avec les 2
  catégories dans `categories`, pas deux entrées), plus les cas spécifiques national
  (PVA remontées depuis les enfants, absence de taux départemental) déjà couverts pour
  la query existante mais à revalider en version « liste ».
- **Tool** (`getChantiersSignales.unit.test.ts`, même dossier que
  `getChantierObjectifs.unit.test.ts`) : mock de la query, vérifie :
  - le refus territoire non accessible,
  - le filtrage `chantier_ids` par `chantiersAccessibles`,
  - la séparation catégories applicables / non applicables selon la maille (au moins
    un cas national, un cas régional, un cas départemental),
  - le comportement par défaut sans `categories` fourni.

## Hors périmètre

- Pas de modification de `GetChantiersSignalesQuery` ni de `WidgetChantiersSignales.tsx`
  (le widget garde sa propre logique de regroupement par tuiles, indépendante de ce
  tool).
- Pas de détail par département pour la catégorie « Absence de taux d'avancement
  départemental » (juste la liste des chantiers concernés).
- Pas de support de `include_sous_territoires` sur ce tool.
- Pas de restriction par profil utilisateur (exposé à tous les utilisateurs ayant
  accès à Albert, comme la quasi-totalité des tools existants).
- Pas de masquage partiel façon `get_chantiers` pour les territoires à accès restreint
  — refus complet à la place (cf. §2.1).
