# Cartographie des indicateurs non à jour — design

Date : 2026-10-12
Périmètre : `apps/pilote-ppg` (page chantier)
Branche : `feat/cartographie-indicateurs-non-a-jour`, ouverte depuis `feat/indicateurs-non-a-jour-assistant` (PR #2546)

## Objectif

Depuis la PR #2546, `indicateur_territoire.est_a_jour` est calculé par territoire. On peut donc repérer précisément les territoires dont les données ne sont pas à jour. Cette évolution ajoute une carte qui les montre sur la page chantier, à deux niveaux :

- **chantier** : sur quels territoires au moins un indicateur du chantier n'est-il pas à jour ?
- **indicateur** : sur quels territoires cet indicateur n'est-il pas à jour, et depuis quand ?

Le modèle est `WidgetCartographiePVA` : une carte, une légende, un tableau des territoires sélectionnés et le sélecteur « Ajouter un territoire ».

## Définition de « non à jour »

C'est la même que dans l'assistant IA et les mails : indicateur publié, dans un chantier publié, `est_applicable = true`, et `est_a_jour` faux ou NULL. Un territoire applicable qui n'a aucune valeur est donc non à jour.

Aucun changement dbt ni Prisma.

## Décisions

1. **Couleur binaire.** Au niveau chantier, un territoire est « non à jour » dès qu'au moins un indicateur du chantier y est non à jour. L'infobulle donne seulement le nombre d'indicateurs non à jour, sans le nombre d'indicateurs applicables.
2. **« À jour » en couleur neutre**, comme le défaut des cartes PVA (`#bababa`). « Non à jour » prend la couleur d'avertissement DSFR `dsfr-warning-425` (`#B34000`, déjà définie dans `tailwind.config.js`), cohérente avec les alertes de mise à jour de la page chantier. « Non applicable » est hachuré (`REMPLISSAGE_HACHURE`).
3. **Pas d'appel direct à `GetIndicateursNonAJourQuery`.** Sa sortie est faite pour un LLM : elle ne contient que les territoires en retard, imbriqués par chantier, indicateur puis maille, et elle ne permet pas de distinguer « à jour » de « non applicable ». Une carte a besoin de tous les territoires, à plat.
4. **La définition de « non à jour » est partagée.** Les `where` Prisma (périmètre publié et prédicat « non à jour ») sont sortis dans un module commun, utilisé par `GetIndicateursNonAJourQuery` et par la nouvelle requête. Une seule définition, qui ne peut pas diverger.
5. **Applicabilité calculée depuis `indicateur_territoire`.** Au niveau chantier, un territoire est non applicable si aucun indicateur publié du chantier n'y est applicable. On reste sur une seule source, sans passer par `chantier_territoire.est_applicable`.
6. **Pas d'export CSV dans cette itération.** `renderBoutonExportCsv` renvoie `null` pour ce type de carte. L'export image du widget fonctionne sans travail supplémentaire.
7. **Pas de notion de jalon.** La fraîcheur décrit l'état courant, elle ne dépend pas d'une année.

## Serveur

### Module partagé : `server/chantiers/infrastructure/queries/indicateurNonAJour.ts`

```ts
export const perimetreIndicateursPubliesWhere = (params: {
  chantierIds: string[];
  territoireCodes?: string[];
  indicateurIds?: string[];
}): Prisma.indicateur_territoireWhereInput;

export const nonAJourWhere: Prisma.indicateur_territoireWhereInput; // est_applicable true ET (est_a_jour false OU null)

export const formatDate: (date: Date | null) => string | null;
```

`GetIndicateursNonAJourQuery` est refactorée pour les utiliser. Son comportement ne change pas, et ses tests d'intégration existants servent de filet de sécurité.

### Requête : `GetTerritoiresNonAJourQuery`

Elle est enregistrée dans le container `chantiers` et expose deux méthodes, qui ont chacune un type de retour précis :

```ts
export type TerritoireNonAJourChantierViewModel = {
  territoireCode: string;
  estApplicable: boolean;
  nbIndicateursNonAJour: number;
};

export type TerritoireNonAJourIndicateurViewModel = {
  territoireCode: string;
  estApplicable: boolean;
  estAJour: boolean;
  dateDerniereValeur: string | null;      // ISO, date_valeur_actuelle_mandat
  miseAJourAttendueDepuis: string | null; // ISO, prochaine_date_maj
};

byChantier({ chantierId }): Promise<TerritoireNonAJourChantierViewModel[]>;
byIndicateur({ chantierId, indicateurId }): Promise<TerritoireNonAJourIndicateurViewModel[]>;
```

- Il n'y a qu'un `findMany` sur `indicateur_territoire`, avec `perimetreIndicateursPubliesWhere` et les mailles `NAT`, `REG` et `DEPT`, sans filtre sur `est_a_jour`. Pour un chantier de 20 indicateurs, cela représente environ 2 500 lignes.
- **byChantier** agrège en JS par `territoire_code` :
  - `estApplicable` vaut vrai si au moins une ligne est applicable ;
  - `nbIndicateursNonAJour` est le nombre de lignes qui satisfont le prédicat « non à jour ».
- **byIndicateur** renvoie une ligne par territoire :
  - `estApplicable` vaut `est_applicable === true` ;
  - `estAJour` vaut `est_a_jour === true` ;
  - les dates sont formatées en ISO.
- Le prédicat « non à jour » côté JS reflète exactement `nonAJourWhere`. Un test d'intégration vérifie la cohérence avec `GetIndicateursNonAJourQuery` sur un même jeu de données.

### Routes tRPC

- `chantier.getTerritoiresNonAJour({ chantierId })`
- `indicateur.getTerritoiresNonAJour({ chantierId, indicateurId })`

Les deux routes vérifient l'habilitation en lecture sur le chantier (`Habilitation.vérifierLesHabilitationsEnLecture(chantierId, null)`), comme `chantier.recupererPVAChantierTerritoires`. Les territoires ne sont pas filtrés : comme pour la carte PVA chantier, toute la carte est affichée.

## Client

### Widget : `_commons/Widget/WidgetCartographieIndicateursNonAJour/`

La structure reprend celle de `WidgetCartographiePVA` :

- `WidgetCartographieIndicateursNonAJour.tsx` : contexte, `ChantierProvider`, `IndicateurProvider` (`useSuspenseQuery`), contenu commun et API publique `mode: "chantier" | "indicateur"` ;
- `useNonAJourMapData.tsx` : remplissage, libellé et infobulle par territoire ;
- `TerritoiresNonAJourTable.tsx` : tableau des territoires sélectionnés ;
- `nonAJourDisplay.ts` : couleurs, légende et textes partagés entre l'infobulle et le tableau ;
- constantes de légende dans `client/constants/légendes/legendItemsIndicateursNonAJour.ts`.

Composants réutilisés : `CartographieV2`, `LegendeCartographie`, `BaseCartographieWidgetLayout`, `WidgetCartographieTitle`, `ComplementsCartographie`, `AjouterTerritoirePicker`, `useSelectionTerritoires`, `TerritoireLabel`.

| | Mode chantier | Mode indicateur |
|---|---|---|
| Couleur | Non à jour (≥ 1 indicateur) / À jour / Non applicable | Non à jour / À jour / Non applicable |
| Infobulle | « 3 indicateurs non à jour » / « À jour » / « Non applicable » | « Non à jour », « Dernière valeur : 01/03/2026 », « Mise à jour attendue depuis le 30/06/2026 » / « À jour » / « Non applicable » |
| Tableau | Territoire, nombre d'indicateurs non à jour | Territoire, date de la dernière valeur, mise à jour attendue depuis |

Si une date est absente, on affiche « Aucune valeur » pour la dernière valeur et « - » pour la mise à jour attendue.

Dans le tableau, les territoires non à jour apparaissent en premier. En mode chantier, ils sont triés par nombre d'indicateurs non à jour décroissant.

Libellés de légende :

- chantier : « Un ou plusieurs indicateurs ne sont pas à jour » / « Tous les indicateurs sont à jour » / « Territoire où le chantier prioritaire ne s'applique pas » ;
- indicateur : « L'indicateur n'est pas à jour » / « L'indicateur est à jour » / « Territoire où l'indicateur ne s'applique pas ».

### Intégration

- `PageChantier/ComparaisonTerritoires/ComparaisonTerritoires.tsx` : nouveau type `"nonAJour"`, avec le libellé « Carte des indicateurs non à jour », rendu en `mode="chantier"`.
- `IndicateursChantier/Bloc/Détails/ComparaisonTerritoires/ComparaisonTerritoiresIndicateur.tsx` : nouveau type `"nonAJour"`, avec le libellé « Carte de mise à jour de l'indicateur », rendu en `mode="indicateur"`.

Le dashboard de l'assistant IA n'est pas concerné.

## Tests

- **Intégration** (`GetTerritoiresNonAJourQuery.integration.test.ts`) :
  - byChantier : compte des indicateurs non à jour par territoire, `est_a_jour` NULL compté comme non à jour, territoire sans indicateur applicable marqué non applicable, exclusion des indicateurs et chantiers non publiés, exclusion des autres chantiers ;
  - byIndicateur : à jour, non à jour avec ses dates, non applicable, aucune valeur (dates nulles) ;
  - cohérence : sur un même jeu de données, les territoires non à jour de `byIndicateur` sont exactement ceux renvoyés par `GetIndicateursNonAJourQuery` avec `avecDetailTerritoires`.
- **Non-régression** : les tests d'intégration existants de `GetIndicateursNonAJourQuery` passent sans modification après le refactor.
- **Client** : pas de test, comme pour les autres cartes (aucune logique complexe).
- **E2E** : à proposer en fin de développement, sans lancement systématique.

## Hors périmètre

- Export CSV.
- Widget dans le dashboard de l'assistant IA.
- Liste des indicateurs non à jour dans l'infobulle chantier.
- Filtrage des territoires par habilitation territoriale.
