# Sens souhaité d'un indicateur (PR1) — design

Date : 2026-11-09
Tickets : PIL-1776 (et la première règle de PIL-1778), epic PIL-1775
Périmètre : `apps/kpilote-api`, `packages/kpilote-shared`, `apps/kpilote-admin`, `apps/kpilote-webapp`
Branche proposée : `feat/PIL-1776-sens-souhaite`, ouverte depuis `dev`

## Objectif

Aujourd'hui, kpilote traite tous les indicateurs comme des objectifs à la hausse. On veut pouvoir dire, pour chaque indicateur, si une hausse ou une baisse de ses valeurs traduit une amélioration : c'est son **sens souhaité**.

- « À la hausse » : une valeur plus élevée est favorable.
- « À la baisse » : une valeur plus faible est favorable.

Le sens vaut pour tout l'indicateur, quels que soient l'individu et le référentiel. Il ne dépend pas de l'évolution constatée. Le changer ne modifie ni les valeurs d'avancement (VA) ni les valeurs cibles (VC).

Cette PR ajoute le réglage et l'affiche. Elle ne change encore aucune interprétation des valeurs.

## Place dans le chantier

L'epic est découpée en trois PR :

1. **PR1 (ce document)** : stocker le sens, l'exposer dans l'API, le saisir dans kpilote-admin, l'afficher dans la fiche indicateur de la webapp.
2. **PR2** : ne plus calculer de taux de progression pour un indicateur à la baisse (en attendant PIL-1777), et afficher la cible même sans taux.
3. **PR3** : interpréter les valeurs selon le sens dans la webapp (couleurs de la variation, min et max, libellés et couleur de l'écart à la médiane).

**Mise en prod :** les trois PR sont mergées sur `dev` avant le prochain déploiement en prod. Si la PR1 partait seule, un indicateur passé à la baisse s'afficherait encore « EN HAUSSE » en vert, avec l'ancien taux VA/VC. Aucun mécanisme de masquage n'est prévu.

**Fenêtre de l'admin (acceptée).** kpilote-admin est une instance unique qui parle aux API local, dev et prod, et valide les réponses avec le schéma partagé. Entre son déploiement avec la PR1 et celui de l'API prod, ses écrans Indicateurs échoueront donc sur l'environnement prod (`sensSouhaite` absent des réponses). C'est accepté, comme pour les champs obligatoires ajoutés par #2256 et #2258 : pas de lecture tolérante.

## Décisions

1. **Nommage.** `sensSouhaite` dans le code, valeurs `HAUSSE` et `BAISSE`. Colonne `sens_souhaite`, enum Postgres `sens_souhaite_enum`.
2. **Les indicateurs existants passent à la hausse via la migration** : la colonne est `NOT NULL DEFAULT 'HAUSSE'`. Pas de script de reprise.
3. **Le champ est obligatoire dans le `PUT /indicateurs/{id}`**, comme `unite` (#2185). Un PUT sans `sensSouhaite` est refusé (400). Le seul appelant actif est kpilote-admin, mis à jour dans cette PR. Aucun client tiers n'écrit d'indicateur. La synchro pilote-ppg appelle aussi ce PUT, mais elle n'est pas utilisée (voir « Hors périmètre »).
4. **Le champ est toujours présent dans les réponses** de `GET /indicateurs`, `GET /indicateurs/{id}` et `PUT /indicateurs/{id}`.
5. **Textes définis une seule fois dans kpilote-shared** : libellés (« À la hausse », « À la baisse ») et aides (« Une valeur plus élevée est favorable », « Une valeur plus faible est favorable »). L'admin et la webapp les importent, sur le modèle de `PERIODE_MISE_A_JOUR_LABELS`.
6. **Admin : contrôle segmenté sur sa propre ligne**, sous Visibilité / Unité (option B de la maquette). « À la hausse » est sélectionné par défaut à la création. Le sens reste modifiable en édition.
7. **Webapp : une ligne « Sens souhaité » dans l'onglet « Informations sur l'indicateur »**, juste après « Unité ». Rien d'autre dans la webapp pour cette PR : l'onglet Résultats est traité dans la PR3.
8. **Seed : quatre indicateurs à la baisse**, pour pouvoir développer et tester les PR2 et PR3 en local.
9. **Pas de nouvelle colonne** dans la liste des indicateurs de l'admin.

## Base de données (`apps/kpilote-api/prisma`)

`schema.prisma` :

```prisma
enum SensSouhaite {
  HAUSSE
  BAISSE

  @@map("sens_souhaite_enum")
}

model Indicateur {
  // …
  sensSouhaite SensSouhaite @default(HAUSSE) @map("sens_souhaite")
  // …
}
```

Migration (nommage et forme comme `20260604120000_add_indicateur_unite`) :

```sql
-- CreateEnum
CREATE TYPE "sens_souhaite_enum" AS ENUM ('HAUSSE', 'BAISSE');

-- AlterTable
ALTER TABLE "indicateur" ADD COLUMN "sens_souhaite" "sens_souhaite_enum" NOT NULL DEFAULT 'HAUSSE';
```

Le défaut reste en base : les créations directes par Prisma (fixtures de test, seed) n'ont pas à fournir le champ.

## Schémas partagés (`packages/kpilote-shared/src/indicateur.ts`)

```ts
export const SENS_SOUHAITES = ['HAUSSE', 'BAISSE'] as const
export type SensSouhaite = (typeof SENS_SOUHAITES)[number]

export const SENS_SOUHAITE_LABELS: Record<SensSouhaite, string> = {
  HAUSSE: 'À la hausse',
  BAISSE: 'À la baisse',
}

// Aide affichée avec le libellé (formulaire admin, fiche indicateur).
export const SENS_SOUHAITE_HINTS: Record<SensSouhaite, string> = {
  HAUSSE: 'Une valeur plus élevée est favorable',
  BAISSE: 'Une valeur plus faible est favorable',
}

export const sensSouhaiteSchema = z
  .enum(SENS_SOUHAITES)
  .describe(
    "Sens d'évolution souhaité de l'indicateur. `HAUSSE` : une valeur plus élevée est favorable. " +
      '`BAISSE` : une valeur plus faible est favorable. Vaut pour tous les individus et référentiels, ' +
      "ne dépend pas de l'évolution constatée, et sa modification ne change aucune valeur d'avancement ni cible.",
  )
```

- `indicateurApiModelSchema` : ajouter `sensSouhaite: sensSouhaiteSchema` (obligatoire), à côté de `unite`.
- `upsertIndicateurBodySchema` : ajouter `sensSouhaite: sensSouhaiteSchema` (obligatoire, ni `optional` ni `nullable`).
- Le champ **ne va pas** dans `indicateurMetadonneesSchema` : ces champs-là sont nullables et partiels dans le body, ce qui ne correspond pas.

## API (`apps/kpilote-api/src/indicateur`)

- **`utils.ts` → `toIndicateurApiModel`** : ajouter `sensSouhaite: indicateur.sensSouhaite`. Le type Prisma (`'HAUSSE' | 'BAISSE'`) est directement assignable au type partagé : une divergence entre les deux enums casse la compilation. Pas besoin de garde comme pour les unités.
- **`commands/upsertIndicateur.ts`** : écrire `sensSouhaite: body.sensSouhaite` dans `db().indicateur.create` et dans `db().indicateur.update`, au même niveau que `nom`, `visibilite` et `unite`.
- **`routes.ts`** : la description OpenAPI de `upsertIndicateurRoute` est déjà obsolète (elle parle de `referentielIds` et dit que seul le `nom` est mis à jour). La réécrire pour lister les champs remplacés à chaque PUT, dont `sensSouhaite`.

Les lectures (`getIndicateurByPublicId`, `listIndicateurs`) chargent le modèle complet : la nouvelle colonne y arrive sans modification.

## Admin (`apps/kpilote-admin/src/components/indicateurs`)

- **`indicateurFormSchema.ts`**
  - `buildIndicateurFormSchema` : `sensSouhaite: sensSouhaiteSchema`.
  - `buildInitialValues` : `sensSouhaite: indicateur?.sensSouhaite ?? 'HAUSSE'`.
  - `toUpsertBody` : `sensSouhaite: values.sensSouhaite`.
- **`IndicateurForm.tsx`** : une nouvelle ligne juste après la ligne Visibilité / Unité, avant la section « Métadonnées ». Elle contient un `SegmentedField` contrôlé par `Controller`, comme Visibilité :
  - libellé « Sens souhaité » ;
  - options construites depuis `SENS_SOUHAITES` et `SENS_SOUHAITE_LABELS` ;
  - sous le contrôle, une aide qui suit l'option choisie : l'aide partagée (`SENS_SOUHAITE_HINTS`), puis « Changer le sens ne modifie ni les valeurs d'avancement ni les cibles. »

  L'aide s'affiche dans un `Text` (`@pilote/kpilote-ui/Typography`) placé sous le champ. La prop `hint` de `SegmentedField` ne convient pas : `Field` l'affiche à côté du libellé, pas sous le contrôle (`packages/kpilote-ui/src/Field.tsx:44`).

Rendu attendu (option B de la maquette) :

```
Visibilité               Unité
[ Public | Privé ]       [ Pourcentage ▾ ]

Sens souhaité
[ À la hausse | À la baisse ]
Une valeur plus faible est favorable. Changer le sens ne modifie ni les valeurs d'avancement ni les cibles.
```

## Webapp (`apps/kpilote-webapp/src`)

- **`components/indicateurs/IndicateurMetadonnees.tsx`** :
  - ajouter `sensSouhaite` au type des props ;
  - ajouter un `DescriptionList.Item` « Sens souhaité » juste après « Unité ».

  Il affiche le libellé et l'aide séparés par un tiret cadratin, par exemple « À la baisse — une valeur plus faible est favorable ». L'aide est mise en minuscule initiale à l'affichage.
- **`tests/factories/api.ts` → `buildIndicateur`** : pas de modification. Cette factory passe par `indicateurApiModelSchema.parse` sur un objet non typé, et elle est déjà désynchronisée du schéma (`id: 1`, `unite: '%'`, `referentielIds`…). Ajouter le champ ne changerait rien.

## Seed (`apps/kpilote-api/prisma/seed.ts`)

- Ajouter `sensSouhaite?: SensSouhaite` au type des entrées de `indicateursSeed`.
- Passer `sensSouhaite: 'BAISSE'` sur quatre indicateurs choisis pour couvrir les deux cas (*choix de Claude, après relecture*) :

  | Indicateur | Données générées (`prisma/seedData/geo.ts`) | Sert à vérifier |
  |---|---|---|
  | IND-001 Taux de chômage | valeurs en hausse, objectifs au-dessus | cas défavorable ; taux et cible (PR2) |
  | IND-004 Délai de traitement préfectures | valeurs en hausse, objectifs au-dessus | cas défavorable ; taux et cible (PR2) |
  | IND-023 Délai de traitement CAF | valeurs en baisse (profil `trend: -1.4`), pas d'objectif | cas favorable (PR3) |
  | IND-033 Délai de jugement pénal | valeurs en baisse (même profil), pas d'objectif | cas favorable (PR3) |

  Le générateur de valeurs et d'objectifs (`geo.ts`) ne change pas. Les objectifs d'IND-001 et IND-004 restent au-dessus des valeurs, donc incohérents pour un indicateur à la baisse. Ça n'a pas d'importance : la PR2 ne calcule plus de taux pour eux, et ils servent seulement à vérifier que la cible reste affichée.
- Dans l'`upsert` des indicateurs, écrire `sensSouhaite: item.sensSouhaite ?? 'HAUSSE'` en création **et** en mise à jour. Le seed fait autorité sur ses indicateurs : un re-seed remet le sens d'origine.

## Tests

Tests d'intégration côté API seulement, dans les fichiers existants :

- **`indicateur/commands/upsertIndicateur.test.ts`** (les tests appellent la commande directement, sans passer par la route)
  - un test « persiste le sens fourni à la création et le met à jour » : création en `BAISSE`, puis mise à jour en `HAUSSE`, sur le modèle du test existant sur l'unité ;
  - `BODY_BASE` et les bodies écrits en dur sont complétés avec `sensSouhaite: 'HAUSSE'`.
- **`indicateur/queries/getIndicateurByPublicId.test.ts`** : le champ est présent dans la réponse, et vaut `HAUSSE` pour un indicateur créé par fixture sans le préciser (défaut de la base).

Pas de test dédié :
- pour le refus d'un PUT sans `sensSouhaite` : c'est le schéma Zod de la route qui le garantit, et le type TypeScript du body l'impose aux appelants. Il n'existe pas de `indicateur/routes.test.ts` aujourd'hui ;
- pour « changer le sens conserve les VA et les VC » : la commande ne touche que la table `indicateur`.

Ces deux tests seraient triviaux.

Pas de test côté admin ni côté webapp : les composants voisins n'en ont pas.

## Critères d'acceptation de PIL-1776

| Critère | Couvert par |
|---|---|
| À la création, « À la hausse » est présélectionné | `buildInitialValues` (admin) |
| Le sens peut être enregistré puis modifié | PUT + formulaire admin ; test d'intégration création puis mise à jour |
| Les indicateurs existants restent à la hausse | `DEFAULT 'HAUSSE'` de la migration |
| Modifier le sens conserve les VA et les VC | la commande ne touche que la table `indicateur` |
| La modification de sens est autorisée via l'API | champ du `PUT /indicateurs/{id}` |

Règle 1 de PIL-1778 (« le sens souhaité est identifiable lors de la consultation ») : la ligne de l'onglet Informations.

## Laissé au développeur

- Le nom exact du dossier de migration (horodatage du jour).
- La formulation de la nouvelle description OpenAPI du PUT, tant qu'elle est juste.
- La façon d'afficher l'aide sous le `SegmentedField` (prop existante ou `Text` sous le champ).

## Hors périmètre

- Toute interprétation des valeurs selon le sens : variation, min et max, médiane, écart (PR3).
- Le taux de progression des indicateurs à la baisse (PR2, puis PIL-1777 avec la valeur initiale).
- L'affichage du sens dans l'onglet Résultats, sur les cartes d'indicateurs ou dans les collections.
- La synchro pilote-ppg → kpilote (`apps/pilote-ppg/src/server/mb-sync`), qui n'est pas utilisée. Son code n'envoie pas `sensSouhaite` : il serait refusé s'il était réactivé un jour.
