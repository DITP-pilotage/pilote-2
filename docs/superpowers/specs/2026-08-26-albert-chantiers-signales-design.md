# Albert — tool `get_chantiers_signales`

**Date :** 2026-08-26
**Branche :** `feat/albert-get-chantier-commentaires`
**Ticket :** [PIL-1695](https://data-ditp.atlassian.net/browse/PIL-1695) — LLM - Comprendre et restituer tous les critères des chantiers signalés

## Contexte

Dans PILOTE, la rubrique **« Chantiers signalés »** de la page d'accueil regroupe
plusieurs catégories fonctionnelles de signalement, distinctes de la notion de
chantier **« en difficulté »** (météo dégradée) ou **« en retard »** (écart à la
médiane). Cette rubrique existe déjà côté métier :

- **Calcul des compteurs** : `GetChantiersSignalesQuery`
  (`apps/pilote-ppg/src/server/chantiers/infrastructure/queries/GetChantiersSignalesQuery.ts`)
  — calcule, pour un territoire/jalon donné, un compteur par catégorie
  (`Record<TypeAlerteChantier, number>`), sans détailler quels chantiers précis
  sont concernés.
- **Exposition frontend** : route tRPC `chantier.recupererChantiersSignales`
  (`apps/pilote-ppg/src/server/infrastructure/api/trpc/routes/chantier.ts:95-114`),
  consommée par `WidgetChantiersSignales.tsx` qui affiche des tuiles cliquables
  (filtres) avec les libellés utilisateur exacts.
- **Distinction avec « en retard »/« en difficulté »** : ces deux notions vivent
  dans `GetChantiersQuery`
  (`apps/pilote-ppg/src/server/chantiers/query/GetChantiersQuery.ts`), consommée à
  la fois par la page PILOTE (routes tRPC `recupererChantiersEnRetard` /
  `recupererChantiersEnDifficulte`) et par le tool Albert `get_chantiers`
  (`apps/pilote-ppg/src/server/albert/tools/getChantiers.ts`).

Aujourd'hui, **aucun tool Albert n'expose la rubrique « Chantiers signalés »**.
Le tool `get_chantiers` existant ne connaît que `est_en_retard`
(`ecart <= -10`) et `est_en_difficulte` (météo ORAGE/NUAGE hors retard), qui ne
correspondent pas aux 6 catégories de la rubrique signalés et utilisent par
endroits un seuil différent (`<= -10` vs `< -10` pour les compteurs signalés).

## Objectif

Donner à Albert un moyen fiable de restituer les chantiers signalés d'un
territoire/jalon, avec :

- les mêmes catégories et les mêmes règles que la rubrique PILOTE,
- les catégories correctement groupées par chantier (pas de duplication),
- une distinction claire entre catégorie de signalement et état du chantier
  (météo, tendance, écart bruts),
- des règles qui diffèrent selon la maille interrogée (national vs
  régional/départemental), conformément au ticket,
- la possibilité de filtrer sur une catégorie précise (ex : « quels chantiers
  ont une PVA ? ») sans revenir toute la liste des chantiers signalés,
- le respect des habilitations déjà en place sur les tools Albert.

Est explicitement **hors scope** : toute modification du comportement de
`GetChantiersSignalesQuery` (compteurs PILOTE) et de la page d'accueil PILOTE,
qui doivent produire des résultats strictement identiques à aujourd'hui.

## Décision : un tool dédié, pas une extension de `get_chantiers`

Deux options ont été considérées :

**A. Étendre `get_chantiers`** avec un `view: "signales"` et un filtre de
catégorie. Réutilise directement la résolution de sous-territoires, les
permissions et le masquage déjà en place, mais mélange dans un même paramètre
`view` deux natures de filtres très différentes : critères booléens simples par
ligne (`en_difficulte`, `tendance`, `meteo`) et critères multi-catégories avec
roll-up inter-territorial (PVA, absence de taux départemental) et sélection
fine par catégorie. Le schema et la description du tool (déjà volumineuse)
grossiraient significativement, avec un risque de confusion pour le LLM entre
« vue » et « catégorie ».

**B. Un tool dédié `get_chantiers_signales`** (retenu). Il correspond 1:1 à la
rubrique PILOTE, au même titre que `get_chantier_objectifs` ou
`get_chantier_commentaires` correspondent chacun à une rubrique dédiée. Il
isole la logique de roll-up territorial et le gating par maille dans son
propre fichier, sans alourdir `GetChantiersQuery` ni risquer de régresser
`all`/`en_difficulte`/`tendance`/`meteo`. Le nom du tool renforce lui-même la
distinction « signalé » ≠ « en difficulté »/« en retard », ce qui réduit le
risque de confusion du LLM plutôt que de l'augmenter. Le coût (plomberie
dupliquée : permissions, résolution de sous-territoires, wiring DI) est limité
car chaque brique recopie un pattern déjà éprouvé trois fois dans le repo.

Conséquence annexe examinée : la valeur `"en_retard"` de `get_chantiers`
devient conceptuellement redondante avec la catégorie `retard_mediane` du
nouveau tool. Sa suppression a été envisagée puis **écartée** : `en_retard`
est profondément câblé dans `systemPrompt.ts` (gabarit de synthèse
territoriale associant `get_chantiers(view='en_retard')` et
`get_chantiers(view='en_difficulte')`, avec un template markdown consommant
`ecart`, `synthese.meteo` et le commentaire du chantier, plus plusieurs
règles de routage par mots-clés). Le retirer proprement demanderait de
réécrire ce gabarit de prompt de production et d'enrichir
`get_chantiers_signales` avec `synthese`/`commentaires` pour compenser — un
risque et un volume de travail disproportionnés par rapport au bénéfice
(élimination d'un simple recouvrement conceptuel). **Décision : `en_retard`
reste inchangé dans `get_chantiers` et dans `systemPrompt.ts`.** Le léger
recouvrement entre `get_chantiers(view='en_retard')` et
`get_chantiers_signales(categorie_signalement='retard_mediane')` est accepté
comme compromis. (Note : les widgets `widget_nombre_chantiers_en_retard` /
`widget_liste_chantiers_en_retard` de `composeDashboard.ts` sont un système
de composition de dashboard totalement indépendant du paramètre `view` —
aucun impact dans un sens comme dans l'autre.)

## Catégories et règles par maille

Un chantier est signalé s'il répond à au moins une catégorie ci-dessous,
évaluée pour le territoire/jalon interrogé. Les règles sont reprises à
l'identique de `GetChantiersSignalesQuery.agregerCompteurs` (voir la colonne
« Règle ») pour garantir la concordance avec les compteurs PILOTE existants,
exigée par le ticket.

| Code catégorie (interne) | Libellé utilisateur restitué | Maille applicable | Règle |
|---|---|---|---|
| `taux_avancement_non_calcule` | « Taux d'avancement non calculé(s) en raison d'indicateurs non renseignés » | NAT uniquement | `chantier_identite.cible_attendue = true` et `chantier_territoire_jalon.taux_avancement` null pour le jalon |
| `absence_taux_avancement_departemental` | « Chantier(s) sans taux d'avancement au niveau départemental » | NAT uniquement | Roll-up sur les `chantier_territoire` de maille DEPT enfants applicables : le département existe mais `taux_avancement` y est null (logique de `compterAbsenceTauxDepartemental`) |
| `meteo_synthese_non_renseignees` | « Chantier(s) avec météo et synthèse des résultats non renseignés » | Toutes mailles | `chantier_territoire.meteo === "NON_RENSEIGNEE"` ou `null` (le champ météo sert de proxy pour l'ensemble « météo + synthèse », comme dans l'implémentation actuelle — pas de vérification séparée sur le texte de synthèse) |
| `proposition_valeur_avancement` | « Chantier(s) avec proposition(s) de valeur d'avancement » | Toutes mailles | DEPT : `nombre_propositions_valeur_actuelle > 0` directement. NAT/REG : roll-up depuis les territoires enfants (logique de `compterPva`) |
| `retard_mediane` | « Chantier(s) avec un retard de 10 points par rapport à leur médiane {maille} » | REG/DEPT uniquement | `chantier_territoire_jalon.ecart < -10` (seuil **strict**, différent du `<= -10` utilisé par `est_en_retard` dans `get_chantiers` — volontaire, pour coller aux compteurs signalés) |
| `tendance_baisse` | « Chantier(s) avec tendance en baisse » | REG/DEPT uniquement | `chantier_territoire.tendance === "BAISSE"` |

Un même chantier peut cumuler plusieurs catégories ; il n'apparaît qu'une fois
dans le résultat, avec la liste de ses catégories.

Les chantiers en difficulté (météo ORAGE/NUAGE) ne sont jamais inclus au seul
motif de leur météo dégradée : cette condition n'apparaît dans aucune des 6
règles ci-dessus.

## Design technique

### Nouveaux fichiers

- **`apps/pilote-ppg/src/server/chantiers/domain/CalculCategoriesSignalement.ts`**
  — module de domaine partagé, extrait de `GetChantiersSignalesQuery` :
  contient les fonctions de roll-up `compterPva` et
  `compterAbsenceTauxDepartemental` (inchangées dans leur logique), ainsi
  qu'une fonction pure `categoriesApplicables(maille)` retournant les codes de
  catégorie pertinents pour une maille donnée. Réutilisé à la fois par
  `GetChantiersSignalesQuery` (compteurs PILOTE) et la nouvelle query Albert,
  pour garantir une source de vérité unique des règles métier.

- **`apps/pilote-ppg/src/server/chantiers/app/contrats/LibellesAlerteChantier.ts`**
  — constante `Record<TypeAlerteChantier, string>` extraite des tableaux
  `alertesNationales`/`alertesTerritoriales` de `WidgetChantiersSignales.tsx`,
  pour partager les libellés utilisateur exacts entre le widget PILOTE et le
  tool Albert (une seule source de vérité pour le texte affiché).

- **`apps/pilote-ppg/src/server/chantiers/query/GetChantiersSignalesListQuery.ts`**
  — nouvelle query, au grain « chantier » (contrairement à
  `GetChantiersSignalesQuery` qui ne produit que des compteurs). Signature :

  ```ts
  export type GetChantiersSignalesListParams = {
    territoireCode: string;
    jalon: number;
    chantierIds?: string[];
    categorieSignalement?: CategorieSignalement; // undefined = toutes les catégories applicables à la maille
  };

  export type ChantierSignaleResult = {
    chantier: {
      id: string;
      nom: string;
      axe: string;
      ppg: string;
      ministeres: string[];
    };
    categories_signalement: string[]; // libellés utilisateur
    meteo: string | null;
    tendance: string | null;
    ecart: number | null;
    taux_avancement: number | null;
  };

  export type GetChantiersSignalesListResult = {
    territoire_code: string;
    territoire_nom: string;
    jalon: number;
    maille: string;
    chantiers: ChantierSignaleResult[];
  };
  ```

  Logique d'exécution :
  1. Récupérer les `chantier_territoire` du territoire (même filtre de base
     que `GetChantiersQuery` : `est_applicable: true`,
     `chantier_identite.statut: "PUBLIE"`, `chantierIds` si fourni).
  2. Déterminer la maille via `territoireCodeVersMailleCodeInsee`.
  3. Calculer les catégories applicables à cette maille
     (`categoriesApplicables(maille)`), restreintes à `categorieSignalement`
     si fourni.
  4. Exécuter les roll-up nécessaires (`compterPva`,
     `compterAbsenceTauxDepartemental`) uniquement si les catégories
     correspondantes sont dans le périmètre calculé à l'étape 3 (évite des
     requêtes inutiles).
  5. Pour chaque chantier, évaluer les catégories applicables et ne conserver
     que les chantiers ayant au moins une catégorie retenue.
  6. Mapper les codes de catégorie vers les libellés utilisateur
     (`LibellesAlerteChantier`).
  7. Trier par identifiant de chantier (cohérent avec le tri par défaut de
     `GetChantiersQuery`).

- **`apps/pilote-ppg/src/server/albert/tools/getChantiersSignales.ts`** —
  nouveau tool `get_chantiers_signales`, suivant le pattern établi (factory +
  closure de permissions, cf. `getChantierObjectifs.ts`/`getChantiers.ts`).

  Schema d'entrée :

  ```ts
  export const getChantiersSignalesInputSchema = z.object({
    territoire_code: z.string().describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
    jalon: z.number().int().min(2022).max(new Date().getFullYear()),
    include_sous_territoires: z.boolean().optional().default(false)
      .describe("Même sémantique que sur get_chantiers : un seul appel sur le territoire parent plutôt que N appels par sous-territoire."),
    chantier_ids: z.array(z.string()).optional(),
    categorie_signalement: z.enum([
      "taux_avancement_non_calcule",
      "absence_taux_avancement_departemental",
      "meteo_synthese_non_renseignees",
      "proposition_valeur_avancement",
      "retard_mediane",
      "tendance_baisse",
    ]).optional().describe(
      "Restreint aux chantiers ayant cette catégorie de signalement précise " +
      "(ex: 'chantiers avec une proposition de valeur d'avancement' -> proposition_valeur_avancement). " +
      "Omis : retourne tous les chantiers signalés, toutes catégories applicables à la maille confondues, " +
      "avec leurs catégories regroupées."
    ),
  });
  ```

  Sortie :

  ```ts
  export type GetChantiersSignalesOutput = {
    resultats: GetChantiersSignalesListResult[];
    non_applicable?: { raison: string };
    _output_instructions: string;
  };
  ```

  Comportement :
  - Résolution des sous-territoires et filtrage `chantiersAccessibles` /
    `territoiresAccessibles` : identique au pattern de `getChantiers.ts`
    (refus silencieux des codes non accessibles, un appel de query par code
    résolu).
  - **Non-applicabilité par maille** : si `categorie_signalement` est fournie
    et ne s'applique pas à la maille d'un territoire résolu (ex :
    `retard_mediane` sur `NAT-FR` sans sous-territoires), ce résultat porte
    `non_applicable.raison` expliquant pourquoi (même pattern que
    `NON_APPLICABLE_EN_RETARD_NAT_FR` dans `getChantiers.ts`), plutôt qu'une
    liste vide silencieuse. Avec `include_sous_territoires=true` sur un
    périmètre mixte (ex: NAT + REG + DEPT), chaque territoire résolu reçoit
    son propre résultat (applicable ou non), cohérent avec le fait que
    chaque appel de query connaît sa propre maille.
  - **Masquage territorial** : pour un territoire hors périmètre d'accès
    direct (résolu via sous-territoires mais non inclus dans
    `territoiresAccessibles`), le libellé « Tendance en baisse » est retiré
    de `categories_signalement` si présent (cohérent avec le masquage du
    champ `tendance` fait pour `get_chantiers`) ; les autres catégories
    (météo, écart, taux, PVA) restent visibles.
  - `_output_instructions` rappelle explicitement de restituer les catégories
    telles quelles (libellés fournis, pas de reformulation), de ne pas les
    confondre avec `est_en_retard`/`est_en_difficulte` (notions distinctes,
    absentes de ce tool), et que les règles diffèrent selon la maille.

### Fichiers modifiés

`apps/pilote-ppg/src/server/albert/tools/getChantiers.ts` n'est **pas
modifié** : `en_retard` y reste tel quel (voir décision ci-dessus).

- **`apps/pilote-ppg/src/server/chantiers/infrastructure/queries/GetChantiersSignalesQuery.ts`** :
  refactor pour déléguer `compterPva`/`compterAbsenceTauxDepartemental` au
  module partagé `CalculCategoriesSignalement`. Comportement et résultat
  strictement inchangés (couvert par les tests d'intégration existants de ce
  fichier, qui ne doivent pas être modifiés).

- **`apps/pilote-ppg/src/client/components/_commons/Widget/WidgetChantiersSignales/WidgetChantiersSignales.tsx`** :
  les tableaux `alertesNationales`/`alertesTerritoriales` référencent les
  libellés depuis `LibellesAlerteChantier.ts` au lieu de chaînes locales.
  Refactor de forme uniquement, aucun changement de comportement affiché.

- **`apps/pilote-ppg/src/server/chantiers/module.ts`** : wiring DI de
  `getChantiersSignalesListQuery` (`asModuleClass`).

- **`apps/pilote-ppg/src/server/albert/module.ts`** : wiring DI de
  `createGetChantiersSignalesTool` (`asModuleFunction`), ajout du type dans
  `AlbertOwnCradle`, suivant le pattern des tools existants.

- **`apps/pilote-ppg/src/app/api/albert/chat/route.ts`** : résolution du tool
  via le container avec le scope de permissions
  (`territoiresAccessibles`/`chantiersAccessibles`) et enregistrement sous la
  clé `get_chantiers_signales` dans l'objet `tools` exposé au LLM.

## Permissions et sécurité

Aucune règle nouvelle : réutilisation stricte des mécanismes existants
(`chantiersAccessibles`, `territoiresAccessibles`,
`TerritoireResolver.resoudre`, masquage silencieux des codes non accessibles).
Un chantier ou territoire non accessible n'apparaît jamais dans les résultats
au-delà de ce que `get_chantiers` autorise déjà aujourd'hui.

## Tests prévus

- **`CalculCategoriesSignalement.unit.test.ts`** : règles de catégorisation
  pure par maille (NAT/REG/DEPT), roll-up PVA et absence de taux
  départemental, cas limites (chantier sans jalon, `cible_attendue=false`,
  territoire sans enfants).
- **`GetChantiersSignalesListQuery.integration.test.ts`** (même pattern que
  `GetChantiersSignalesQuery.integration.test.ts` et
  `GetChantiersEnRetardQuery.integration.test.ts`, via
  `createIntegrationTest`/fixtures) : un chantier avec plusieurs catégories
  n'apparaît qu'une fois avec toutes ses catégories ; filtrage par
  `categorieSignalement` ; exclusion des chantiers non applicables/sans
  ministère ; propagation PVA depuis les enfants pour NAT et REG ; absence de
  taux départemental uniquement au NAT.
- **`getChantiersSignales.unit.test.ts`** (pattern
  `getChantierObjectifs.unit.test.ts`/`getChantiers` : `buildTool`,
  `executeTool`, `mock<...Query>`) : accès chantier/territoire refusé,
  résolution de sous-territoires avec exclusion silencieuse des codes non
  accessibles, masquage de `tendance_baisse` pour territoire hors périmètre,
  `non_applicable` renvoyé pour une catégorie hors maille, regroupement
  multi-catégories par chantier.
- **Non-régression** : les tests existants de `GetChantiersSignalesQuery`
  (compteurs) et de `getChantiers.ts` (hors suppression de `en_retard`)
  doivent continuer à passer sans modification de leurs assertions.

## Critères d'acceptation (repris du ticket, mappés au design)

- [ ] « Quels sont les chantiers signalés ? » → `get_chantiers_signales` sans
  `categorie_signalement`, retourne tous les chantiers signalés du
  territoire/jalon avec leurs catégories groupées.
- [ ] Les chantiers en difficulté ne sont pas inclus au seul motif de la
  météo dégradée (aucune des 6 règles ne teste ORAGE/NUAGE).
- [ ] Au national, seules `taux_avancement_non_calcule`,
  `absence_taux_avancement_departemental`, `meteo_synthese_non_renseignees`,
  `proposition_valeur_avancement` sont prises en compte.
- [ ] Au régional/départemental, seules `retard_mediane`, `tendance_baisse`,
  `meteo_synthese_non_renseignees`, `proposition_valeur_avancement` sont
  prises en compte.
- [ ] Chaque chantier signalé est restitué avec sa ou ses catégories.
- [ ] Catégories multiples regroupées par chantier (pas de duplication).
- [ ] Libellés utilisateur restitués (jamais de nom technique de filtre).
- [ ] Albert dispose d'un moyen de ne pas confondre « signalé », « en
  retard » (`get_chantiers(view='en_retard')` reste disponible en parallèle
  de `get_chantiers_signales(categorie_signalement='retard_mediane')`) et
  « en difficulté » (reste exclusivement dans `get_chantiers`).
- [ ] Résultats concordant avec les compteurs et filtres PILOTE pour un même
  territoire/jalon (garanti par le partage des règles via
  `CalculCategoriesSignalement` et les libellés via
  `LibellesAlerteChantier`).
- [ ] Filtrage par catégorie individuelle possible (`categorie_signalement`),
  non couvert explicitement par le ticket mais demandé en complément lors du
  brainstorm.

## Points de vigilance explicitement tranchés

- **Seuil de retard** : `< -10` strict pour `retard_mediane` (catégorie
  signalé), différent du `<= -10` de `est_en_retard` dans `get_chantiers`.
  Volontaire, pour matcher exactement les compteurs PILOTE existants.
- **« Météo et synthèse non renseignées »** : implémenté comme un proxy sur
  le seul champ météo (`NON_RENSEIGNEE`/`null`), sans vérification séparée du
  texte de synthèse — reprise à l'identique du comportement actuel de
  `GetChantiersSignalesQuery`, pour respecter l'exigence de concordance avec
  les compteurs PILOTE.
- **`en_retard` conservé** : `get_chantiers(view='en_retard')` n'est pas
  supprimé malgré le recouvrement conceptuel avec `retard_mediane`, pour ne
  pas toucher au gabarit de synthèse territoriale et aux règles de routage
  déjà calées dans `systemPrompt.ts`. Recouvrement accepté comme compromis.
