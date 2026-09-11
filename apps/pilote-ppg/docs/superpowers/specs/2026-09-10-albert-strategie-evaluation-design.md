# Stratégie d'évaluation d'Albert

Date : 2026-09-10

## Objectif

Documenter le comportement attendu d'Albert et faire évoluer ses prompts dans
le bon sens, en restant aligné sur la tâche et le langage métier.

La suite n'est pas un garde-fou de CI : elle ne bloque pas un merge, elle sert
à répondre à « est-ce que ma modification du prompt améliore quelque chose, et
où ». Les cas sont la spécification exécutable du comportement attendu.

Les cas sont écrits et lus par des développeurs, en TypeScript. Le langage
métier vit dans le contenu des cas — les questions sont celles que posent
réellement des préfets, des coordinateurs territoriaux et des référents
ministériels — pas dans le support.

### Défaillances visées en priorité

1. **Mauvaise sélection d'outils** : mauvais outil, enchaînement superflu,
   arguments erronés, ou réponse sans appel d'outil alors qu'il en fallait un.
2. **Devine au lieu de demander** : sur une demande sous-spécifiée, Albert
   choisit à la place de l'utilisateur au lieu de passer par `display_choices`.
   Mesuré à 1 essai sur 3 pendant le POC.

La factualité et la dérive de langage métier restent hors du périmètre
prioritaire. Elles sont partiellement couvertes par le juge du niveau 3.

## Les quatre niveaux

| Niveau | Ce qu'il mesure | Setup | Scoring |
|---|---|---|---|
| 1 — Déterministe | `detecterCapacities` : la détection par mots-clés qui conditionne l'exposition de `create_dashboard` et `export_rapport` | Aucun. Ni base, ni réseau | Déterministe, une note par capacity |
| 2 — Par outil | Chaque outil est-il déclenché par les formulations qui doivent le déclencher — et pas par les autres | Monde de base + tour d'agent | Déterministe sur les tool calls, arguments compris quand ils portent du sens |
| 3 — Scénarios | Les parcours réellement proposés à l'utilisateur dans l'interface, de bout en bout | Monde de base + fixtures du cas + tour d'agent + juge | Deux scorers : tool calls (déterministe) et rédaction (juge LLM) |
| 4 — Cas limites | Abréviations, formulations ambiguës, demandes sous-spécifiées, hors-sujet | Monde de base + tour d'agent | Déterministe sur les tool calls |

### Niveau 1 — Déterministe

`detecterCapacities` n'est que du matching de mots-clés : même entrée, même
sortie, toujours. Il est conservé dans la suite d'eval malgré tout, pour le
score partiel — les quatre capacities sont notées séparément, donc une
régression qui n'en casse qu'une se lit comme 0,75 et non comme un échec
opaque.

### Niveau 2 — Une suite par outil

Une suite par outil exposé, soit douze : `get_taux_avancement_territoire`,
`get_chantiers`, `get_indicateurs`, `get_chantier_commentaires`,
`get_chantier_objectifs`, `get_chantiers_signales`, `search_chantiers`,
`search_indicateurs`, `search_territoires`, `display_choices`,
`create_dashboard`, `export_rapport`.

Les deux derniers ne sont exposés que si l'intention correspondante est
détectée : leurs suites vérifient donc de bout en bout ce que le niveau 1
vérifie isolément, la détection par mots-clés incluse.

Trois à quatre cas par outil : les formulations qui doivent le déclencher, et
au moins un cas négatif — une formulation voisine qui doit en déclencher un
autre. Sans cas négatif, une suite par outil ne mesure que la capacité du
modèle à tout appeler.

Ordre de grandeur : environ cent trente tours d'agent avec `trialCount: 3`,
soit une dizaine de minutes au débit de l'API Albert.

### Niveau 3 — Scénarios de l'interface

Source : `src/client/components/PageAccueil/scenariosTerritoire.ts`, qui définit
les scénarios proposés à l'utilisateur sur l'écran d'accueil, pour deux profils
(DITP administrateur et coordinateur territorial), groupés en « Synthèse » et
« Comparaison ».

Deux modes coexistent et se traitent différemment :

- `mode: "send"` — message complet, envoyé tel quel au clic. Jouable
  directement comme cas d'eval.
- `mode: "fill"` — template à trous (`"Fais moi la synthèse du territoire "`,
  `CH-XXX`, `NOM_TERRITOIRE`) que l'utilisateur complète. Le cas d'eval doit
  compléter le trou avec une valeur du monde semé.

C'est le seul niveau qui fait intervenir un juge. Le méta-eval de calibration
du juge existant est conservé : un juge qui note tout bon ne mesure rien, et il
tourne sans appeler l'agent, donc il reste rejouable à volonté.

### Niveau 4 — Cas limites

Trois familles :

- **Abréviations et jargon** : « PPG » pour chantier, « VSS », « PVA »,
  « la France » pour `NAT-FR`.
- **Formulations ambiguës** : « chantiers compromis » (météo ORAGE ou chantiers
  à risque — le prompt demande de couvrir les deux), « où ça coince », « les
  points noirs ».
- **Sous-spécification et hors-sujet** : demande sans territoire ni jalon, qui
  doit passer par `display_choices` ; salutation sans intention de données, qui
  ne doit déclencher aucun outil.

La table « Comprendre les demandes utilisateur » du prompt système est la
source directe des deux premières familles : chacune de ses lignes est un
contrat explicite entre une expression et un appel d'outil.

## Le monde et les fixtures par cas

Deux étages, tous deux dans la transaction annulée à la sortie.

**Le monde de base**, partagé par tous les niveaux qui touchent la base : un
utilisateur — `llm_calls.utilisateur_id` porte une clé étrangère et l'assistant
y écrit à chaque tour comme en production — vingt chantiers aux intitulés
réalistes et volontairement proches, et le référentiel des territoires, épargné
du TRUNCATE par `integrationTestSetup`.

Le volume des chantiers n'est pas cosmétique : `search_chantiers` injecte la
liste entière des chantiers accessibles dans le prompt de son sous-agent. Avec
cinq chantiers, la recherche thématique devient triviale et `display_choices`
n'a jamais de candidats ambigus à proposer.

**Les fixtures du cas**, posées par le cas qui en a besoin, juste avant le tour
d'agent. Un cas devient donc :

```ts
{
  question: string;
  /** Motif du cas : ce qu'il cherche à vérifier. */
  reason: string;
  /** Fixtures propres au cas, posées dans la transaction avant le tour. */
  seed?: (world: EvalWorld) => Promise<void>;
  /** Outils attendus, arguments compris quand ils portent du sens. */
  expected: ObservedToolCall[];
}
```

Ce second étage résout le déséquilibre entre les niveaux. Le niveau 3 exige des
données que les autres n'utilisent pas : taux d'avancement par territoire,
météo, chantiers peuplant les vues `en_retard` et `en_difficulte`. Sans elles,
un scénario de synthèse territoriale produit une réponse vide et le juge note
le vide plutôt que la qualité. Les poser dans le monde de base ferait payer ce
coût à tous les cas et éloignerait la donnée du cas qui la justifie.

## Organisation des fichiers

```
evals/
  world.ts          monde de base + withEvalWorld        (existe)
  agentTurn.ts      tour d'agent via AssistantIA         (existe)
  judge.ts          scorer LLM-as-judge                  (existe, renommé)
  setup.ts          garde-fous d'environnement           (existe)
  env.ts            surcouche .env.evals.local           (existe)
  1-keywords/
  2-tools/          une suite par outil
  3-scenarios/      les scénarios de l'interface + calibration du juge
  4-edge-cases/
```

`fileParallelism: false` est déjà en place et devient indispensable : le
`beforeEach` de `integrationTestSetup` fait un `TRUNCATE ... CASCADE`, donc deux
fichiers d'eval en parallèle se videraient la base mutuellement. Le découpage
en une suite par outil multiplie les fichiers, ce réglage n'est plus optionnel.

## Ce qui est repris du POC, ce qui est jeté

**Repris** : l'infrastructure. `world.ts`, `agentTurn.ts`, le juge et sa
calibration, la configuration Evalite (cache coupé, parallélisme des fichiers
coupé, `maxConcurrency: 1`, timeout à 420 s), les garde-fous d'environnement, et
`AssistantIA` côté production.

**Jeté** : les jeux de cas. `toolCalls.eval.ts` est un fourre-tout de sept cas
sans structure, `qualiteReponse.eval.ts` ne couvre aucun parcours réel. Les cas
sont réécrits selon les quatre niveaux ; l'idée de mesurer la sélection d'outils
et la qualité rédactionnelle est conservée, pas son implémentation.

Le passage des identifiants et types en anglais, demandé en revue, s'applique
aux fichiers réécrits.

## Hors périmètre

- **La CI.** Les evals restent locales. `.env.evals.local` porte la clé Albert
  et n'est pas versionné.
- **Les niveaux d'intégration intermédiaires.** Les sous-agents de recherche ne
  sont pas évalués isolément. Un échec de `search_chantiers` se lit au niveau du
  tour complet, sans distinguer le retrieval de l'orchestration. C'est un choix
  assumé : un seul harnais à maintenir.
- **La factualité comme dimension propre.** Pas de suite dédiée à la « règle
  d'or » du prompt (ne jamais conclure à une absence de donnée sans avoir
  interrogé l'outil). Le juge du niveau 3 la touche indirectement.
