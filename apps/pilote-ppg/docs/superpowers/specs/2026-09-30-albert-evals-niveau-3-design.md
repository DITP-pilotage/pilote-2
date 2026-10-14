# Evals de niveau 3 : scénarios de l'interface et juge par grille

Ticket : PIL-1814. Stratégie d'ensemble : `2026-09-10-albert-strategie-evaluation-design.md`.

## Objectif

Jouer de bout en bout les scénarios proposés sur l'écran d'accueil
(`src/client/components/PageAccueil/scenariosTerritoire.ts`), pour les deux
profils, et noter chaque réponse sur une **grille de critères dérivée du
contrat écrit de l'assistant** : le prompt système (`systemPrompt.ts`), ses
gabarits, et les `_output_instructions` des outils.

Le livrable est un rapport pour le produit (Benjamin) : un tableau des scores
par scénario, la grille des critères à valider, la fiabilité du juge, et un
récapitulatif qualitatif du reste à faire.

**Règle de conduite** : on ne corrige pas la production pour faire monter un
score. Un mauvais score est acté, consigné, et devient un point de PIL-1833.

## Ce qui est jeté

Le niveau 3 du spike : `3-scenarios/sentScenarios.eval.ts`,
`3-scenarios/judgeCalibration.eval.ts` et `judge.ts`. Leurs deux critères
(« ancrage factuel », « utilité opérationnelle ») sont trop génériques : le juge
devine si un chiffre « semble » venir de l'outillage, alors que les evals sèment
elles-mêmes les données et connaissent la vérité.

Une seule mesure du spike est conservée : le modèle du juge,
`deepseek-v4-flash`. Les alias `openweight-*` de production pointent vers des
modèles du catalogue ; prendre `gpt-oss-120b` comme juge ferait noter Albert par
lui-même.

## Principes

1. **Le juge vérifie la conformité au contrat, pas la qualité en général.**
   Chaque critère cite la règle du prompt qu'il vérifie.
2. **La vérité terrain vient des fixtures.** Le juge reçoit une fiche de vérité
   et constate ; il ne devine pas.
3. **Critères mécaniques et critères jugés.** Ce qui est objectivement
   vérifiable (sections du gabarit, codes météo, noms d'outils, tableaux,
   chantiers cités) est une fonction. Le juge ne garde que ce qui demande de
   lire (résumés condensés, analyse des écarts, pertinence des widgets, absence
   d'opinion, restriction d'accès signalée).
4. **Un appel de juge par tour**, qui rend un verdict pour tous les critères
   jugés de la grille.
5. **Verdict binaire** par critère (conforme ou non) avec une preuve citée. Les
   résultats se lisent en x/3, comme au niveau 2.

## Le monde

### Deux utilisateurs

- **DITP administrateur** : périmètre complet (le monde actuel).
- **Coordinateur territorial** : lecture sur REG-53 et ses quatre départements
  (DEPT-22, 29, 35, 56), tous chantiers. Le prompt système qu'il reçoit ne
  liste que ces cinq codes, comme en production.

### Le contexte agent de l'accueil

L'interface envoie `{ territoireCode, jalon, instructions }`. La construction de
ce contexte est extraite de `BoutonSyntheseTerritoire.tsx` dans une fonction
pure, importée par l'interface et par les evals, pour que le texte ne dérive pas.

### Les territoires peuplés

Un helper `seedTerritoire({ territoire, jalon, chantiers })` sème, pour chaque
chantier : le taux au jalon, l'écart, la météo, une synthèse des résultats avec
ou sans commentaire, l'indicateur du chantier **avec ses valeurs au jalon**
(`indicateur_territoire_jalon`, que lit `get_indicateurs`), et des commentaires
typés à la demande.

Chaque territoire peuplé porte au moins : un chantier à l'heure avec
commentaire, un chantier en retard avec commentaire, un chantier en difficulté
**sans** commentaire (force la règle « Pas de commentaire disponible »).

| Territoire | Rôle |
|---|---|
| Bretagne REG-53 | territoire courant par défaut ; jalons 2025 et 2024 |
| DEPT-22, 29, 35, 56 | « et ses départements », comparaisons région / départements |
| Ille-et-Vilaine DEPT-35 | territoire courant du scénario « autres départements de la région » |
| Pays de la Loire REG-52 | cible de comparaison, hors périmètre du coordinateur |
| Auvergne-Rhône-Alpes REG-84, Vaucluse DEPT-84 | piège de résolution « 84 » |

Les valeurs sont franchement de part et d'autre des seuils (écart <= -10,
météo ORAGE/NUAGE) et placent la Bretagne sous la médiane des régions semées,
les Pays de la Loire au-dessus.

### La fiche de vérité

Après le seed, le cas lit la fiche en appelant **l'`execute` des outils de
production** (`get_taux_avancement_territoire`, `get_chantiers`,
`get_indicateurs`, `get_chantier_commentaires`) avec les habilitations du
profil. Taux global et médiane sont des agrégats calculés par du code déjà
validé au niveau 2 : les recalculer dupliquerait la formule. Le juge compare
donc le texte à ce que les outils ont réellement rendu.

## La factory `scenarioEval`

### Organisation

```
evals/3-scenarios/
  scenarioEval.ts        la factory
  groundTruth.ts         lecture de la fiche de vérité via les outils
  judge.ts               l'appel au juge et son prompt
  criterion.ts           briques mechanical() / judged(), socle transverse, withBase()
  criteria/              critères partagés entre scénarios (commentaires, comparaison)
  3.0-calibration/       la méta-eval du juge
  3.1-synthese/          par scénario : <scénario>.eval.ts et <scénario>.criteria.ts
  3.2-comparaison/       idem, groupe « Comparaison »
```

Les critères d'un scénario vivent dans un `.criteria.ts` à côté de son
`.eval.ts`, et non dedans : la calibration les importe pour juger la même
liste, et importer un `.eval.ts` enregistrerait sa suite.

Noms de suites : `3.0 · Calibration du juge`, `3.1 · Synthèse · <libellé de
l'interface>`, `3.2 · Comparaison · <libellé>`. Evalite trie par nom ; le
préfixe range par niveau puis par groupe.

### Ce qu'une suite déclare

`suite`, `group`, `grid`, `cases`, et les valeurs par défaut `profile` et
`currentTerritory`.

### Ce qu'un cas déclare

```ts
type ScenarioCase = {
  question: string;            // le message tel qu'il part, trou complété
  reason: string;              // comment le trou a été complété, ou le piège visé
  profile?: "ditp" | "coordinateur";
  currentTerritory?: TerritoireRef;
  seed: () => Promise<void>;
  truthScope: TruthScope;      // territoires, jalons, chantiers à lire pour la fiche
  expected?: ObservedToolCall[];
  forbidden?: string[];
};
```

Un scénario `send` a un cas, le message tel quel. Un scénario `fill` a un cas
par façon réaliste de compléter le trou.

### La task

Sème le monde, prend l'utilisateur du profil, joue le seed, lit la fiche,
appelle `AssistantIA.generateText` avec les habilitations du profil et le
contexte agent du territoire courant. Rend :

```ts
type ScenarioTurn = AgentTurn & {
  toolResults: { toolName: string; input: unknown; output: unknown }[];
  truth: GroundTruth;
};
```

Les scorers tournent après le rollback : tout ce qu'ils lisent voyage dans le
tour.

### Scorers et colonnes

- « Outils attendus » : `scoreExpectedTools` du niveau 2, inchangé.
- Un scorer par critère de la grille. Les critères jugés lisent un verdict
  mémorisé par tour : un appel de juge par tour.
- Colonnes : Scénario (`reason`), Outils appelés avec arguments, Réponse (500
  premiers caractères), Widgets par section pour le tableau de bord.
- `trialCount: 3`.

## Le juge

### Matière jugée

| Famille | Matière |
|---|---|
| Synthèses, comparaisons, commentaires, chantiers en retard | le texte de la réponse |
| Tableau de bord | la structure rendue par `create_dashboard` puis le texte d'accompagnement |
| Rapport | le contenu passé à `export_rapport` |

### Entrée et sortie

Le prompt système du juge est court et fermé : il vérifie des critères de
conformité, chacun indépendamment, à partir de la fiche de vérité et jamais de
ses connaissances, et cite un extrait comme preuve. Il reçoit la demande (avec
territoire courant et profil), les outils appelés avec leurs arguments, la fiche
de vérité, la matière, et les critères jugés (identifiant, règle citée,
consigne). Pour le tableau de bord, il reçoit aussi le catalogue des types de
widgets et leur rôle.

Sortie structurée : pour chaque critère, `{ conforme: boolean, preuve: string }`.

### Critères sans objet

Evalite compte un score `null` comme 0. Les cas sont rangés pour que chaque
critère d'une suite s'applique à tous ses cas. À défaut, un critère déclare
`applicable(truth, case)` ; sans objet, il note 1 avec la mention « sans objet »,
et le rapport l'affiche « — ».

### Socle transverse

- Mécaniques : pas de nom d'outil ; libellés météo au lieu des codes ; codes
  officiels `CH-XXX`, `REG-XX`, `DEPT-XX`.
- Jugés : pas d'opinion ni de recommandation ; aucun chiffre absent de la fiche ;
  restriction d'accès signalée quand un territoire hors périmètre renvoie des
  champs masqués (profil coordinateur).

### Grilles par famille

Le détail est dans l'inventaire ci-dessous.

## La calibration

Pour chaque famille jugée : une réponse de référence écrite à la main à partir
d'une fiche figée, et un mutant par critère jugé, qui casse ce critère et lui
seul. Chaque réponse porte le verdict attendu pour chaque critère.

- Score d'un cas : part des critères où le juge est d'accord.
- Un critère jugé est **fiable** s'il détecte son mutant et laisse passer la
  référence sur les trois essais. Un critère non fiable reste dans les suites,
  mais son score est marqué dans le rapport.
- Pas d'agent, pas de base : la suite coûte un appel de juge par cas et par
  essai.
- Les mêmes références et mutants servent aux **tests unitaires** des critères
  mécaniques (Vitest, projet `server-unit`), dont le cas « `###` au lieu de `##`
  passe ».
- Après le premier run, toute réponse réelle sur laquelle le juge se trompe
  entre dans la calibration avec le bon verdict.

## Inventaire des scénarios

Territoire courant par défaut : Bretagne, jalon 2025. Le socle transverse
s'ajoute à chaque grille.

### 3.1 · Synthèse

**Synthèse d'un territoire** (DITP, fill). « Fais moi la synthèse du territoire
… » complété par « Bretagne », « Finistère », « 35 ». Outils : les trois du
workflow de synthèse sur le bon code. Critères : sections du gabarit
`mono_territoire` ; chaque chantier attendu cité avec écart et météo ; résumé
condensé ou « Pas de commentaire disponible » ; synthèses de tendance ; la maille
nommée correctement (un département n'est pas « la région »).

**Synthèse d'un chantier sur un territoire** (DITP et coordinateur, fill).
CH-005 sur la Bretagne, trois volets. Outils : `get_chantiers` avec
`chantier_ids` CH-005 sur REG-53, `get_chantier_commentaires` CH-005 sur REG-53 ;
le chemin pour situer le chantier n'est pas imposé. Critères : les trois volets
traités ; CH-005 situé face à d'autres territoires avec des chiffres ; difficultés
tirées des commentaires ; pas le gabarit territorial. Côté coordinateur, la
restriction d'accès s'applique.

**Synthèse de Bretagne et ses départements** (DITP, send). Outils : les trois
sur REG-53 avec `include_sous_territoires`. Grille : gabarit `comparaison`, que
le prompt impose dès que les résultats portent plusieurs territoires.

**Chantiers en retard et leurs indicateurs** (DITP et coordinateur, send).
Outils : `get_chantiers` vue en retard sur REG-53, `get_indicateurs` CH-005 sur
REG-53. Critères : chaque chantier en retard cité avec son écart ; VI, VA, VC, TA
de ses indicateurs conformes à la fiche.

**Rapport complet** (DITP admin, send). Outils : les trois de synthèse,
`get_indicateurs` par chantier, `export_rapport` au format markdown. Matière :
le contenu du rapport. Critères : sections demandées présentes ; tableau
d'indicateurs par chantier ; réponse du chat exactement « Votre rapport est
disponible au téléchargement. », sans lien. Sans export, tous les critères du
rapport tombent : c'est acté (PIL-1833, point 14).

**Tableau de bord du territoire** (DITP admin, send, message complet). Outils :
taux, deux vues de `get_chantiers`, `create_dashboard` avec REG-53, CH-005 et
CH-006. Critères : ordre des sections (mécanique : territoire puis un chantier
par section, sans chantier étranger à la fiche) ; widgets de chaque section
conformes à la demande, sans ajout étranger (jugé) ; aucun chiffre dans le texte
d'accompagnement (jugé). La largeur n'est pas notée : elle relève du code.

**Synthèse des difficultés d'un territoire** (coordinateur, fill). Complété par
« Bretagne », « Finistère », « Pays de la Loire » (hors périmètre). Rattaché au
workflow de synthèse, donc les deux vues : choix arbitraire, noté dans les
retours.

**Synthèse des commentaires d'un/de plusieurs chantiers** (coordinateur, fill).
Complété par « CH-005, CH-006 », « CH-001 », « CH-005, CH-012 » (CH-012 sans
commentaire). Outils : `get_chantier_commentaires` par chantier sur REG-53, tiré
du contexte. Critères : une synthèse par chantier ; actions tirées des
commentaires ; pas de recopie (la reformulation est demandée) ; absence de
commentaire dite explicitement.

### 3.2 · Comparaison

Le gabarit `comparaison` n'est chargé sur aucun de ces messages (aucun mot-clé
de synthèse). Les comparaisons sont jugées contre ce qu'Albert reçoit : tableau
TA, médiane et position ; analyse des écarts (qui est devant, de combien) ; noms
de territoires exacts. Charger le gabarit, puis rejuger contre lui, est un retour.

**Comparer avec un autre territoire** (DITP, fill). « Compare Bretagne avec … »
complété par « Pays de la Loire », « la région 84 » (REG-84,
Auvergne-Rhône-Alpes), « 35 - Ille-et-Vilaine ». Outils : taux sur les deux
codes ; seuls les taux sont exigés.

**Comparer les taux d'avancement entre le jalon 2025 et un autre jalon** (DITP,
fill). Complété par « 2024 », « l'année précédente », « 2023 » (aucune donnée).
Outils : taux sur REG-53 aux deux jalons. Critères : valeurs exactes ; évolution
en points et sens ; absence de données dite pour 2023.

**Comparer Bretagne avec ses départements** (DITP, send). Outils : **un seul**
appel de taux sur REG-53 avec `include_sous_territoires` ; l'énumération des
départements échoue (règle du prompt). Critères : cinq territoires dans le
tableau (mécanique) ; chacun positionné face à la médiane de sa maille (jugé).

**Comparer avec les autres départements de Bretagne** (DITP, send, territoire
courant DEPT-35). Message : « Compare 35 - Ille-et-Vilaine avec les autres
départements de Bretagne ». Outils : taux, sans contrainte d'argument (deux
chemins légitimes). Critère mécanique : les quatre départements bretons dans le
tableau.

**Comparaison quantitative des territoires** (coordinateur, fill). « Compare les
taux d'avancement de Bretagne avec … » complété par « Pays de la Loire », « le
département 84 » (DEPT-84, Vaucluse), « Finistère ». Outils : taux sur les deux
codes. Le critère « restriction signalée » est retiré : le taux n'est jamais
masqué.

## Le livrable

1. Run de la calibration, puis des treize suites (trois essais). Résultats
   consignés dans l'en-tête de chaque suite, datés.
2. Commentaire de rapport sur PIL-1814 : tableau par scénario (Groupe, Scénario,
   Profil, Outils, Forme, Fond, Échecs, Point) ; grille par famille (critère,
   règle citée, mode) ; fiabilité du juge ; analyse au format du rapport de
   PIL-1833. Les critères à faire trancher par Benjamin forment un bloc à part.
3. Récapitulatif du reste à faire : nouveaux points de PIL-1833, chacun avec le
   cas qui le révèle.
4. Les textes Jira sont soumis à Antoine avant publication.

## Retours déjà identifiés

1. La synthèse d'une région et de ses départements se juge contre le gabarit
   comparaison : à confirmer côté produit.
2. « Les difficultés » rattaché aux deux vues : choix arbitraire.
3. Le gabarit de synthèse écrit « de la région » quel que soit le territoire.
4. Le gabarit comparaison n'est chargé sur aucun scénario de comparaison : à
   charger, puis rejuger contre lui.
5. Le périmètre d'une « comparaison » n'est défini nulle part.
6. « Avec ses départements » ne déclenche pas la consigne sur les
   sous-territoires (PIL-1833, point 12, sur un scénario de l'interface).
7. Les seeds du niveau 2 écrivent les valeurs d'indicateur dans
   `indicateur_territoire`, que `get_indicateurs` ne lit pas. Sans impact sur la
   sélection d'outils ; le helper du niveau 3 sème `indicateur_territoire_jalon`.
8. Le scénario coordinateur « Synthétise les commentaires … notamment les
   principales actions identifiées » vise des types de commentaires
   (« actions à venir », « actions à valoriser ») qui sont nationaux, donc
   invisibles sur une région. La grille exige qu'Albert le dise.

## Hors périmètre

- La CI : les evals restent locales.
- Les scénarios hors écran d'accueil et les conversations à plusieurs tours.
- La correction de la production.
