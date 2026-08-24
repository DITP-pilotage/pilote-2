# Fiabilisation du déclenchement d'`include_sous_territoires` (Albert)

Date : 2026-05-22

## Statut

Proposé

## Contexte

### Symptôme observé en prod

Un utilisateur a envoyé à Albert la prompt suivante :

> *« Compare les taux d'avancement de France entre le jalon 2026 et 2025 pour la région pays de la loire et les 5 départements qui la composent »*

Le modèle n'a pas détecté qu'il pouvait utiliser le paramètre `include_sous_territoires=true` du tool `get_taux_avancement_territoire`. Il a énuméré chaque (territoire × jalon) en appels séparés (≈ 14 appels), a atteint la limite de `stopWhen: stepCountIs(50)` une fois combinée à d'autres appels, et a rendu une réponse partielle où plusieurs taux apparaissaient comme « non disponible » alors que la donnée existe en base.

Le rejouage de la même prompt confirme un comportement instable : sur une dizaine d'exécutions, environ une sur deux échoue de manière similaire (visible dans les tables `llm_calls` et `chat_conversation`).

### Cause racine

Le tool `get_taux_avancement_territoire` (et également `get_chantiers`) expose un paramètre `include_sous_territoires: boolean` (défaut `false`) dont la description Zod est très courte :

> *« Si true, inclut les données des sous-territoires (ex: départements d'une région) »*

Le system prompt mentionne ce paramètre une seule fois, dans le workflow « a. Synthèse complète d'un territoire ». Le workflow « b. Comparaison temporelle entre jalons » — celui qui s'applique à la prompt en cause — n'évoque pas du tout la dimension territoriale et incite donc à un appel par jalon, sans recombinaison avec `include_sous_territoires`.

Conséquence : quand l'utilisateur combine *« compare entre jalons »* (workflow b) et *« région X et ses départements »* (cas non couvert par b), le LLM compose naïvement les deux dimensions sous forme d'énumération.

### Critère de succès retenu

L'objectif est la **robustesse du déclenchement** d'`include_sous_territoires` (option A retenue lors du cadrage). Le tool reste tel qu'il est : on ne change pas son API pour accepter un tableau de codes. On agit uniquement sur les signaux donnés au modèle pour qu'il choisisse le bon paramètre.

## Décision

Combiner deux leviers (approche 3 retenue lors du cadrage) :

1. **Prompt engineering ciblé** (couverture large, probabiliste) — descriptions Zod et descriptions de tools enrichies, workflow (b) complété, exemple concret calqué sur la prompt qui a échoué.
2. **Détection d'intention pré-LLM** (couverture explicite, déterministe) — nouvelle capacity `inclureSousTerritoires` dans `detecteurIntention.ts`, qui injecte conditionnellement dans le system prompt un bloc d'instruction impérative.

La température n'est pas modifiée dans cette itération : on mesure l'effet du prompt engineering seul avant de toucher au paramètre de sampling.

## Changements détaillés

### 1. Description Zod du paramètre `include_sous_territoires`

Deux fichiers, même traitement :

- `apps/pilote-ppg/src/server/albert/tools/getTauxAvancementTerritoire.ts:22-28`
- `apps/pilote-ppg/src/server/albert/tools/getChantiers.ts:20-26`

Avant :

```ts
include_sous_territoires: z
  .boolean()
  .optional()
  .default(false)
  .describe("Si true, inclut les données des sous-territoires (ex: départements d'une région)")
```

Après :

```ts
include_sous_territoires: z
  .boolean()
  .optional()
  .default(false)
  .describe(
    "Mets `true` quand la demande couvre un territoire ET ses sous-territoires " +
    "(ex: « la région X et ses départements », « la région X et les départements qui la composent », " +
    "« détaille par département », « décomposé par sous-territoire »). " +
    "Dans ce cas, fais UN SEUL appel sur le territoire parent avec ce flag à true, " +
    "plutôt que d'énumérer chaque sous-territoire avec des appels séparés."
  )
```

### 2. Description des tools (`tool({ description })`)

Ajouter dans la description d'`get_taux_avancement_territoire` (`getTauxAvancementTerritoire.ts:61-67`) un bloc d'avertissement juste après la phrase existante sur `include_sous_territoires` :

```
⚠️ Si la demande couvre un territoire ET ses sous-territoires (ex: « région X et ses départements »),
fais UN SEUL appel avec include_sous_territoires=true plutôt que N appels individuels.
Cette règle s'applique aussi pour les comparaisons entre jalons : un appel par jalon avec
include_sous_territoires=true, pas un appel par (territoire × jalon).
```

Appliquer le même bloc à `get_chantiers` (`getChantiers.ts:117`) juste après *« Quand include_sous_territoires=true, retourne aussi les chantiers de chaque sous-territoire. »*.

### 3. System prompt — workflow (b) « Comparaison temporelle entre jalons »

Fichier : `apps/pilote-ppg/src/server/albert/systemPrompt.ts:369-374`

Compléter le protocole pour expliciter la combinaison comparaison temporelle × sous-territoires, et ajouter un exemple calqué sur la prompt qui a échoué :

```
### b. Comparaison temporelle entre jalons
**Déclencheur** : l'utilisateur demande de comparer entre deux jalons/années.

**Protocole** :
1. Appelle le(s) outil(s) pertinent(s) une fois par jalon demandé
2. **Si la comparaison porte aussi sur un territoire ET ses sous-territoires** (ex: « France + région + ses départements »), passe `include_sous_territoires=true` sur le territoire parent. **Un appel par jalon**, pas un appel par couple (territoire × jalon). N'énumère jamais les sous-territoires manuellement.
3. Compare les résultats et présente l'évolution

**Exemple** : « Compare les TA de France entre 2025 et 2026 pour la région Pays de la Loire et ses 5 départements »
→ 2 appels seulement : `get_taux_avancement_territoire(territoire_code='REG-52', jalon=2025, include_sous_territoires=true)` et `get_taux_avancement_territoire(territoire_code='REG-52', jalon=2026, include_sous_territoires=true)`. Si NAT-FR est aussi demandé, +1 appel par jalon avec NAT-FR (sans include_sous_territoires).
```

### 4. Nouvelle capacity `inclureSousTerritoires`

#### 4a. `detecteurIntention.ts`

Ajouter une liste `MOTS_CLES_SOUS_TERRITOIRES` et étendre `Capacities` :

```ts
const MOTS_CLES_SOUS_TERRITOIRES = [
  "et ses départements",
  "et ses departements",
  "et les départements qui",
  "et les departements qui",
  "et ses sous-territoires",
  "et ses sous territoires",
  "détaille par département",
  "detaille par departement",
  "détaillé par département",
  "detaille par departement",
  "décomposé par",
  "decompose par",
  "et ses régions",
  "et ses regions",
  "par sous-territoire",
  "par sous territoire",
];

export interface Capacities {
  synthese: boolean;
  dashboard: boolean;
  exportRapport: boolean;
  inclureSousTerritoires: boolean;
}
```

Étendre `detecterCapacities` pour calculer le nouveau flag via `MOTS_CLES_SOUS_TERRITOIRES.some(contient)`.

#### 4b. `systemPrompt.ts`

Dans `buildChatSystemPrompt`, construire un bloc conditionnel :

```ts
const consigneSousTerritoires = capacities.inclureSousTerritoires
  ? `
## ⚠️ Sous-territoires détectés dans la demande

L'utilisateur a explicitement demandé un territoire **et ses sous-territoires**.

**Règle impérative** : pour CHAQUE appel à \`get_taux_avancement_territoire\` ou \`get_chantiers\`, passe \`include_sous_territoires=true\` sur le territoire parent.

N'énumère **JAMAIS** les sous-territoires manuellement (pas d'appel séparé pour chaque département/région). Un seul appel sur le parent avec le flag suffit.

Cette règle prime sur tout autre protocole : même en comparaison entre jalons, tu fais **un seul appel par jalon** avec le flag, pas un appel par couple (sous-territoire × jalon).
`
  : "";
```

L'injecter dans le template du system prompt juste après `${agentContextSection}` (avant la section *« # Territoires accessibles »*).

### 5. Tests

#### 5a. `apps/pilote-ppg/src/server/albert/__tests__/detecteurIntention.test.ts`

Ajouter un bloc de tests pour la nouvelle capacity, couvrant :
- 5 formulations positives représentatives de la liste de mots-clés
- 3 formulations négatives qui ne devraient pas matcher (territoire seul, comparaison entre régions, synthèse simple)

#### 5b. Nouveau fichier `apps/pilote-ppg/src/server/albert/__tests__/systemPrompt.test.ts`

Deux cas :
- Avec `inclureSousTerritoires: true` → le prompt assemblé contient le bloc d'instruction (vérifier sur 2 marqueurs : titre du bloc + mention `include_sous_territoires=true`)
- Avec `inclureSousTerritoires: false` → le bloc d'instruction est absent

#### 5c. Pas de tests unitaires sur les sections 1, 2, 3

Ce sont des modifications de chaînes de caractères passives. Le risque de régression unitaire est nul ; la validation passe par un test manuel post-deploy reproduisant la prompt qui a échoué.

## Conséquences

### Positives

- Le cas observé en prod (prompt explicite *« et les départements qui la composent »*) est verrouillé de manière déterministe par le keyword matching (section 4).
- Les variantes de tournure non listées bénéficient du filet général via sections 1+2+3.
- Aucun changement d'API tool, donc rien à migrer côté consommateurs.
- Effort de maintenance minimal : la liste de mots-clés s'étend facilement si de nouvelles tournures problématiques émergent.

### Négatives / Risques

- Le system prompt s'allonge (un bloc conditionnel d'environ 10 lignes ; le workflow b gagne ~5 lignes). Risque de dilution mineur.
- La détection par keywords reste sensible aux faux négatifs sur des tournures non listées (ex: *« avec le détail régional »*, *« par échelon départemental »*). Le filet général (sections 1-3) couvre partiellement ces cas, mais sans garantie déterministe.
- Risque très faible de faux positif : la liste est volontairement restreinte à des tournures sans ambiguïté.

### Hors scope

- Modification de la température du modèle (mise de côté pour cette itération).
- Refonte de l'API tool pour accepter `territoire_codes: string[]` (option B du cadrage, non retenue).
- Mise en place d'un eval set automatisé pour mesurer le taux de déclenchement (à envisager dans une itération ultérieure).
