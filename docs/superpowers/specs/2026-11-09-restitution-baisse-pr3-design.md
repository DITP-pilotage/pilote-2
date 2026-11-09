# Restitution des indicateurs à la baisse (PR3) — design

Date : 2026-11-09
Tickets : PIL-1778 (règles d'interprétation selon le sens souhaité), epic PIL-1775
Périmètre : `apps/kpilote-webapp`, plus un correctif ciblé dans `apps/kpilote-api` et `packages/kpilote-shared` (variation d'un individu à une seule valeur)
Branche : `feat/PIL-1778-restitution-baisse`, ouverte depuis `feat/PIL-1778-taux-baisse`. PR stackée sur #2663, elle-même stackée sur #2655 puis #2657. On stacke sur la PR2 plutôt que sur la PR1 parce que la PR2 modifie déjà `IndicateurSynthesePanel.tsx` (*choix de Claude*).

## Objectif

Depuis la PR1 (#2655), un indicateur porte un sens souhaité, `HAUSSE` ou `BAISSE`. La webapp interprète pourtant toujours les valeurs comme si plus haut était mieux : pour un taux de chômage, une hausse s'affiche en vert et le maximum observé aussi.

Cette PR applique les règles de PIL-1778 dans le panneau de synthèse de l'onglet « Résultats » de la fiche indicateur, le seul endroit de la webapp qui qualifie une valeur de favorable ou de défavorable :

1. la pastille de variation garde sa flèche et son libellé, qui décrivent le mouvement réel, mais sa couleur dépend du sens ;
2. le minimum et le maximum échangent leurs couleurs pour un indicateur à la baisse ;
3. l'écart à la médiane parle de « au-dessus / au-dessous de la médiane » dans les deux sens, et sa couleur dépend du sens.

Elle corrige au passage deux défauts existants que les indicateurs à la baisse rendraient plus visibles : la variation d'un individu à une seule valeur, comparée à 0, et l'absence de pastille quand la valeur ne bouge pas.

Critère d'acceptation du ticket : pour un indicateur à la baisse, passer de 10 à 8 est présenté comme une baisse favorable.

## Place dans le chantier

1. PR1 (#2655) : le sens souhaité, stocké, exposé, saisi et affiché dans « Informations sur l'indicateur ».
2. PR2 (#2663) : plus de taux pour un indicateur à la baisse, cible visible sans taux.
3. **PR3 (ce document)** : interpréter les valeurs selon le sens dans la webapp.

Les trois PR sont mergées sur `dev` avant le prochain déploiement en prod.

## Décisions

1. **Orange pour le défavorable, dans les deux sens** (décision de Triko). Les tons existants du composant `Pill` suffisent : `success` (vert) pour favorable, `warning` (orange) pour défavorable, `info` (bleu) pour neutre. Le ticket demandait du rouge ; on garde l'orange actuel pour que les indicateurs à la hausse ne changent pas et que la même situation ait toujours la même couleur. Aucun ton n'est ajouté à `Pill`.
2. **La flèche et le libellé décrivent le mouvement réel.** « ↑ EN HAUSSE » quand la valeur monte, « ↓ EN BAISSE » quand elle descend, quel que soit le sens. Seule la couleur porte l'interprétation.
3. **Valeur stable : pastille « → STABLE »** (décision de Triko). Quand la variation vaut exactement 0, la pastille affiche « → STABLE », sans chiffre, en ton `info`, dans les deux sens. Aujourd'hui, elle est masquée.
4. **Une seule valeur : plus de variation** (décision de Triko, option 1). L'API renvoie `variation: null` quand l'individu a moins de deux valeurs (moins de deux buckets de sa série), au lieu de comparer l'unique valeur à 0. Le panneau n'affiche alors aucune pastille, et rien à la place. La comparaison à 0 venait de #2135 (PIL-1456) sans être demandée par ce ticket.
5. **Minimum et maximum : couleurs échangées, définitions inchangées.** À la hausse, le maximum est vert et le minimum orange, comme aujourd'hui. À la baisse, le minimum est vert et le maximum orange. La médiane reste bleue. Les libellés et l'ordre des lignes ne changent pas.
6. **Écart à la médiane : nouveaux libellés, signe conservé, couleur selon le sens.** « au-dessus de la médiane » (écart > 0), « au-dessous de la médiane » (écart < 0), « à la médiane » (écart = 0), dans les deux sens. Ils remplacent « en avance » et « en retard ». À la médiane reste en ton `info`.
7. **Le sens n'est pas affiché dans l'onglet « Résultats »** (décision de Triko, option A). La PR1 l'affiche déjà dans « Informations sur l'indicateur », ce qui couvre la règle « le sens souhaité est identifiable lors de la consultation ».
8. **Un texte masqué pour les lecteurs d'écran porte l'interprétation** (*choix de Claude, annoncé à Triko*). Sur la pastille de variation : « évolution favorable » ou « évolution défavorable ». Sur la pastille d'écart : « position favorable » ou « position défavorable ». Sur les valeurs maximale et minimale : « favorable » ou « défavorable », selon le sens (*ajouté après relecture* : à la baisse, c'est une information nouvelle que seule la couleur porterait). Rien pour « STABLE », « à la médiane » et la médiane, dont le libellé suffit. Aujourd'hui, cette information n'existe que par la couleur.
9. **Une fonction pure porte la règle d'interprétation** (*choix de Claude*). Elle traduit les deux tableaux du ticket ; le composant ne fait que choisir des couleurs à partir de son résultat.
10. **Un minimum égal au maximum n'est pas interprété** (*correctif de la relecture finale*). Dans un référentiel à un seul individu (vue nationale), min = médiane = max : les trois valeurs restent en bleu, sans texte masqué. Une même valeur ne peut pas être à la fois favorable et défavorable.
11. **Ce qui s'affiche « 0 » se lit comme 0** (décision de Triko : « Si on affiche 0, on doit afficher stable », puis « harmoniser tout ça »). Une variation ou un écart que l'affichage arrondit à « 0 » donne « → STABLE » ou « à la médiane », en bleu, sans texte masqué. La règle s'appuie sur le formateur d'affichage (`formatVariationFr`, trois décimales), pour que l'interprétation suive toujours ce qui est lu.
12. **La médiane est calculée en décimal exact** (décision de Triko). Elle passait par des nombres flottants, alors que la valeur d'une série dérivée en moyenne garde toutes ses décimales : un individu seul dans son référentiel avait un écart d'environ 10⁻¹³ au lieu de 0. L'API renvoie désormais un écart exactement nul dans ce cas.

## Règle d'interprétation

Fonction pure, côté webapp :

```ts
type Interpretation = 'favorable' | 'defavorable' | 'neutre'
interpreterSelonSens(ecart: number, sensSouhaite: SensSouhaite): Interpretation
```

`ecart` est une différence signée : la variation, ou l'écart à la médiane.

| `ecart` | `HAUSSE` | `BAISSE` |
|---|---|---|
| > 0 | favorable | défavorable |
| < 0 | défavorable | favorable |
| = 0 | neutre | neutre |

Correspondance avec l'affichage :

| Interprétation | Ton de `Pill` | Classe de texte (min/max) |
|---|---|---|
| favorable | `success` | `text-success-425` |
| défavorable | `warning` | `text-warning-425` |
| neutre | `info` | — |

Fichier proposé : `apps/kpilote-webapp/src/components/indicateurs/interpreterSelonSens.ts`, à côté du panneau.

## API (`apps/kpilote-api/src`)

### `valeurAvancement/computeVariation.ts`

- Moins de deux valeurs → `null`. Signature inchangée.
- Seul appelant : `valeurAvancement/queries/listSyntheseIndividus.ts`, qui ne change pas. La règle vaut pour les séries saisies comme pour les séries dérivées, puisque les deux passent par ce calcul.

### `valeurAvancement/computeMediane.ts` et `computeEcartMediane.ts`

- Nouvelle `computeMedianeDecimal(values): Decimal | null`, calculée sans conversion en nombre (tri par `comparedTo`, moyenne des deux valeurs centrales par `plus` puis `div(2)`). `computeMediane` en devient un simple `toNumber()`, inchangé pour ses appelants.
- `listSyntheseIndividus` calcule la médiane de chaque référentiel avec `computeMedianeDecimal`, et `computeEcartMediane` accepte une médiane `Decimal | number | null`.

### Descriptions

- `packages/kpilote-shared/src/valeurAvancement.ts`, `syntheseIndividuApiModelSchema.variation` : remplacer « égale à la valeur la plus récente s'il n'en a qu'une (comparée à 0) » par « null si l'individu a moins de deux valeurs (aucune valeur précédente à comparer) ».
- `apps/kpilote-api/src/valeurAvancement/routes.ts` (l. 295-296), description de `GET /indicateurs/{id}/synthese-individus` : même changement.

Le contrat ne change pas : `variation` est déjà `number | null`. En prod, aucun client externe (clé API) ne lit cet endpoint (*confirmé par Triko*) ; le panneau de la webapp est son seul client. La PR ouverte #2359 (assistant kpilote, PIL-1684) appelle `listSyntheseIndividus` et transmet `variation` au modèle : pour elle, `null` évite de présenter une fausse variation. La description de la PR3 le signale.

## Webapp (`apps/kpilote-webapp/src`)

### Transmettre le sens

- `routes/_authenticated/indicateurs/$id.tsx` passe `sensSouhaite={indicateur.sensSouhaite}` à `IndicateurResultatsTab`.
- `components/indicateurs/IndicateurResultatsTab.tsx` reçoit `sensSouhaite: SensSouhaite` et le passe à `IndicateurSynthesePanel`.

### `components/indicateurs/IndicateurSynthesePanel.tsx`

Nouvelle prop `sensSouhaite: SensSouhaite`.

**Pastille de variation** (sous la valeur d'avancement). Elle s'affiche dès que `variation !== null`, au lieu de `variation !== null && variation !== 0`.

| Cas | Contenu | Ton à la hausse | Ton à la baisse |
|---|---|---|---|
| `variation === null` | pas de pastille | — | — |
| `variation > 0` | « ↑ EN HAUSSE : +x » | `success` | `warning` |
| `variation < 0` | « ↓ EN BAISSE : −x » | `warning` | `success` |
| `variation === 0` | « → STABLE » | `info` | `info` |

`x` est formaté par `formatVariationFr`, comme aujourd'hui.

**Données de comparaison** (`ComparaisonRow`) :

| Ligne | À la hausse | À la baisse |
|---|---|---|
| Valeur maximale observée | `text-success-425` | `text-warning-425` |
| Valeur médiane observée | `text-blue-425` | `text-blue-425` |
| Valeur minimale observée | `text-warning-425` | `text-success-425` |

**Écart à la médiane** (affiché si `ecartMediane !== null`, comme aujourd'hui) :

| Cas | Contenu | Ton à la hausse | Ton à la baisse |
|---|---|---|---|
| `ecartMediane > 0` | « +x unité · au-dessus de la médiane » | `success` | `warning` |
| `ecartMediane < 0` | « −x unité · au-dessous de la médiane » | `warning` | `success` |
| `ecartMediane === 0` | « 0 unité · à la médiane » | `info` | `info` |

`x unité` est formaté par `formatVariationAvecUniteFr`, comme aujourd'hui.

**Zéros affichés.** Avant toute interprétation, la variation et l'écart passent par `zeroSiAfficheZero(value: number): number` (`lib/format.ts`), qui renvoie 0 quand `formatVariationFr` afficherait « 0 », et la valeur telle quelle sinon. Les tableaux ci-dessus s'appliquent ensuite à cette valeur.

### Ce qui ne change pas

- Le bloc « Progression » (PR2), la « Valeur précédente » et la valeur d'avancement.
- La carte de France : dégradé bleu sans interprétation.
- La courbe d'évolution, les cartes d'indicateurs, les collections.

## Tests

**API, en TDD, dans les fichiers existants :**

- `valeurAvancement/computeVariation.test.ts` : « retourne la valeur seule (comparée à 0) si une seule entrée » devient « retourne null si une seule entrée ».
- `valeurAvancement/queries/listSyntheseIndividus.test.ts` : le test « retourne variation = valeur lorsqu'il n'y a qu'une seule valeur » devient « retourne une variation null lorsqu'il n'y a qu'une seule valeur ». Les autres attendus de `variation` des individus qui n'ont qu'une valeur passent à `null`, sans changer le reste du test : au moins « retourne un item par individu existant » (dept2), « ignore les valeurs d'autres indicateurs », « omet les individus inexistants » et les deux tests d'écart à la médiane par référentiel. Les attendus d'`ecartMediane` ne changent pas.

**Webapp :** un test unitaire de `interpreterSelonSens` qui reprend les six cases du tableau de la règle (*choix de Claude* : c'est la règle métier du ticket, et la webapp a déjà des tests de fonctions pures, comme `deriverEtatImport.test.ts`). Pas de test de composant : le panneau n'en a pas.

## Recette

Dans le seed, quatre indicateurs sont à la baisse : IND-001, IND-004, IND-023 (Délai de traitement CAF) et IND-033 (Délai de jugement pénal). Leur tendance de fond ne suffit pas à prédire la dernière variation : le générateur ajoute une oscillation qui l'emporte souvent (pour IND-023, 54 individus sur 101 montent au dernier mois). Le plan désigne donc des individus précis, choisis par une requête en base locale (*constat de la relecture*).

- Un indicateur à la baisse, sur un individu dont la dernière valeur baisse : pastille verte « ↓ EN BAISSE ».
- Le même, sur un individu dont la dernière valeur monte : pastille orange « ↑ EN HAUSSE ».
- Tout indicateur à la baisse, quel que soit l'individu : minimum vert, maximum orange, écart coloré selon le sens.
- Un indicateur à la hausse, IND-003 par exemple : rendu identique à aujourd'hui, sauf le libellé de l'écart.
- Valeur unique et valeur stable : à créer à la main en base locale, puis à remettre en état.

## Laissé au développeur

- La forme exacte du texte masqué (classe `sr-only`, ponctuation) et le masquage éventuel des flèches pour les lecteurs d'écran.
- Le choix entre réutiliser `interpreterSelonSens` pour les couleurs du minimum et du maximum ou écrire la correspondance directement.

## Hors périmètre

- Le calcul du taux à la baisse avec une valeur initiale (PIL-1777).
- Le rouge pour le défavorable, et tout nouveau ton de `Pill`.
- L'affichage du sens dans l'onglet « Résultats ».
- Le contraste des pastilles verte et orange sur leur fond teinté (environ 2,9:1), qui est un défaut existant.
- La couleur de la carte de France selon le sens.
