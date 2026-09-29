# Annuaire des coordinateurs et responsables locaux — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** ajouter à pilote-ppg une page `/annuaire` avec deux onglets (Coordinateurs PILOTE, Responsables locaux). Chaque onglet a deux regroupements, des filtres, et une copie des adresses e-mail.

**Architecture :** un module serveur `annuaire` en lecture seule (CQRS léger : deux classes Query avec `run()`, exposées par un routeur tRPC) lit ce que dbt a calculé dans `chantier_territoire`. Il renvoie des affectations à plat. Côté client, `DataTable` (react-table v9) les regroupe avec `columnGroupingFeature`, sans dépliage : une ligne par groupe, qui liste `row.subRows`. Onglet, regroupement, filtres, tri et page sont dans l'URL (nuqs).

**Tech Stack :** Next.js (pages router), tRPC, Prisma 6, Awilix (système de modules), @tanstack/react-table v9, nuqs 2, radix-ui (Tabs), sonner, Tailwind, Vitest.

**Spec :** `docs/superpowers/specs/2026-09-29-annuaire-ppg-design.md`

## Global Constraints

- Toutes les commandes se lancent depuis `apps/pilote-ppg/`.
- **Ne pas commiter** sans demande explicite de l'utilisateur. Les étapes « Point de contrôle » remplacent les commits.
- Pas de tests unitaires client ni de tests e2e pour cette fonctionnalité. Seuls les tests serveur sont écrits (intégration pour les Query, unitaire pour la catégorie de log).
- Tests : `expect(result).toEqual([{...}])` plutôt que `toHaveLength` suivi d'un accès par index. Pas de commentaires hors `// Given / // When / // Then`, sauf pour signaler une donnée indispensable au scénario.
- Pas de variable de 1 ou 2 caractères (`error` et non `e`, `ligne` et non `l`).
- Utiliser `$Enums` de `@prisma/client` pour les valeurs d'enum Prisma.
- Couleurs via la config Tailwind (`primary`, `dsfr-*`), jamais de couleur en dur. Aucune classe `fr-*` dans les nouveaux composants. `clsxm` pour fusionner les classes.
- Libellés exacts : onglets « Coordinateurs PILOTE » et « Responsables locaux », message « Adresse e-mail copiée », libellé accessible « Copier l'adresse e-mail de {Prénom} {Nom} ».
- Feature flag : `NEXT_PUBLIC_FF_ANNUAIRE`, clé de config `annuaire`.
- Paramètres d'URL : `onglet`, `groupement`, `territoire`, `chantier`, `q`, `sort`, `page`, `pageSize`.
- Regroupements : coordinateurs `territoire` (défaut) et `coordinateur` ; responsables `couple` (défaut) et `responsable`.
- Nom affiché d'un territoire : `territoire.nom_affiche` (par exemple « 69 - Rhône »), comme le reste de l'application.

## Review Focus

- **Identifiant non UUID dans `*_ids`** : `utilisateur.id` est un `uuid` Postgres. Un identifiant malformé ferait échouer toute la requête Prisma. Il doit être ignoré. Test dans la tâche 1.
- **Utilisateur désactivé entre deux passages de dbt** : il apparaît quand même, comme sur la page chantier (`PrismaUtilisateurRepository.recupererParIds` ne filtre pas sur `date_desactivation`). Test dans les tâches 1 et 2.
- **Personne responsable uniquement sur des chantiers non publiés** : absente de `personnes`. Test dans la tâche 2.
- **Presse-papiers indisponible** (contexte non sécurisé, permission refusée) : pas d'erreur silencieuse. Afficher un message d'erreur au lieu de « Adresse e-mail copiée ». Code dans la tâche 6, à vérifier manuellement en tâche 8.
- **Valeur de `groupement` invalide dans l'URL** (`?groupement=nimportequoi`) : retomber sur le regroupement par défaut, sans casser le tableau. Code dans les tâches 5 et 6, à vérifier manuellement en tâche 8.

---

## Structure des fichiers

**Serveur (à créer)**
- `src/server/annuaire/module.ts` : déclaration du module, `Inject`.
- `src/server/annuaire/queries/personnesAnnuaire.ts` : types partagés, lecture des personnes actives, conversion d'un territoire.
- `src/server/annuaire/queries/ListerCoordinateursAnnuaireQuery.ts`
- `src/server/annuaire/queries/ListerResponsablesAnnuaireQuery.ts`
- `src/server/annuaire/__tests__/queries/ListerCoordinateursAnnuaireQuery.integration.test.ts`
- `src/server/annuaire/__tests__/queries/ListerResponsablesAnnuaireQuery.integration.test.ts`
- `src/server/infrastructure/api/trpc/routes/annuaire.ts`

**Serveur (à modifier)**
- `src/server/module-system/moduleNames.ts`, `src/server/dependances.ts`
- `src/server/infrastructure/api/trpc/routes/routes.ts`
- `src/server/infrastructure/api/trpc/categorieLogRouteurTRPC.ts` et son test
- `src/config.ts`, `src/server/gestion-contenu/domain/VariableContenuDisponible.ts`, `.env.example`, `.env.test`, `.env.e2e`

**Client (à modifier)**
- `src/client/components/shared/DataTable/urlState.ts` : option `grouping`.
- `src/client/components/shared/DataTable/Body.tsx` : pas de bouton de dépliage sans `rowExpandingFeature`.
- `src/client/components/shared/DataTable/types.ts`, `Filters.tsx` : groupes d'options.
- `src/client/components/_commons/TableauAdmin/TableauAdmin.tsx` : type de `table` élargi.
- `src/client/components/_commons/NavigationTertiaire/NavigationTertiaire.tsx` : prop `children`.
- `src/client/components/_commons/MiseEnPage/Navigation/NavigationPilote.tsx` : entrée « Annuaire ».

**Client (à créer)**
- `src/pages/annuaire.tsx`
- `src/client/components/PageAnnuaire/PageAnnuaire.tsx`
- `src/client/components/PageAnnuaire/lignesAnnuaire.ts`
- `src/client/components/PageAnnuaire/featuresAnnuaire.ts`
- `src/client/components/PageAnnuaire/SelecteurGroupement.tsx`
- `src/client/components/PageAnnuaire/tuileAnnuaire.tsx`
- `src/client/components/PageAnnuaire/cellules/BadgeNiveau.tsx`
- `src/client/components/PageAnnuaire/cellules/CelluleTerritoire.tsx`
- `src/client/components/PageAnnuaire/cellules/BoutonCopierEmail.tsx`
- `src/client/components/PageAnnuaire/cellules/BlocPersonne.tsx`
- `src/client/components/PageAnnuaire/cellules/Listes.tsx`
- `src/client/components/PageAnnuaire/TableauCoordinateurs.tsx`, `useTableauCoordinateurs.tsx`
- `src/client/components/PageAnnuaire/TableauResponsables.tsx`, `useTableauResponsables.tsx`

---

### Tâche 1 : module `annuaire` et `ListerCoordinateursAnnuaireQuery`

**Files :**
- Create : `src/server/annuaire/module.ts`
- Create : `src/server/annuaire/queries/personnesAnnuaire.ts`
- Create : `src/server/annuaire/queries/ListerCoordinateursAnnuaireQuery.ts`
- Modify : `src/server/module-system/moduleNames.ts` (ajouter `"annuaire"`)
- Modify : `src/server/dependances.ts` (import et `allModules`)
- Test : `src/server/annuaire/__tests__/queries/ListerCoordinateursAnnuaireQuery.integration.test.ts`

**Interfaces :**
- Produit (`personnesAnnuaire.ts`) :
  - `type PersonneAnnuaire = { id: string; prenom: string; nom: string; email: string; fonction: string | null; service: string | null }`
  - `type MailleAnnuaire = Exclude<$Enums.Maille, "NAT">`
  - `type TerritoireAnnuaire = { code: string; nom: string; maille: MailleAnnuaire; regionCode: string; regionNom: string }`
  - `MAILLES_ANNUAIRE: MailleAnnuaire[]`, `selectionTerritoire`, `versTerritoireAnnuaire(territoire)`, `lirePersonnes(prisma, ids): Promise<Map<string, PersonneAnnuaire>>`, `personnesRetenues(affectations, personnes): PersonneAnnuaire[]`
- Produit (`ListerCoordinateursAnnuaireQuery.ts`) :
  - `type AffectationCoordinateur = { personneId: string; territoire: TerritoireAnnuaire }`
  - `type AnnuaireCoordinateurs = { personnes: PersonneAnnuaire[]; affectations: AffectationCoordinateur[] }`
  - `class ListerCoordinateursAnnuaireQuery { run(): Promise<AnnuaireCoordinateurs> }`
- Produit (`module.ts`) : `annuaireModule`, `type Inject<K>`. Clé du cradle : `listerCoordinateursAnnuaireQuery`.

- [ ] **Étape 1 : écrire le test d'intégration (en échec)**

```ts
// src/server/annuaire/__tests__/queries/ListerCoordinateursAnnuaireQuery.integration.test.ts
import { randomUUID } from "node:crypto";
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerCoordinateursAnnuaireQuery } from "@/server/annuaire/queries/ListerCoordinateursAnnuaireQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

const AIN = {
  code: "DEPT-01",
  nom: "01 - Ain",
  maille: $Enums.Maille.DEPT,
  regionCode: "REG-84",
  regionNom: "Auvergne-Rhône-Alpes",
};
const RHONE = {
  code: "DEPT-69",
  nom: "69 - Rhône",
  maille: $Enums.Maille.DEPT,
  regionCode: "REG-84",
  regionNom: "Auvergne-Rhône-Alpes",
};
const AUVERGNE_RHONE_ALPES = {
  code: "REG-84",
  nom: "Auvergne-Rhône-Alpes",
  maille: $Enums.Maille.REG,
  regionCode: "REG-84",
  regionNom: "Auvergne-Rhône-Alpes",
};

describe("ListerCoordinateursAnnuaireQuery", () => {
  let query: ListerCoordinateursAnnuaireQuery;

  beforeEach(() => {
    query = new ListerCoordinateursAnnuaireQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "renvoie plusieurs coordinateurs par territoire et plusieurs territoires par coordinateur",
    createIntegrationTest(async () => {
      // Given
      const sophie = await fixtures.utilisateur({
        prenom: "Sophie",
        nom: "Bernard",
        email: "sophie.bernard@rhone.gouv.fr",
        fonction: "Coordinatrice PILOTE",
        service: "autre",
        service_autre: "Préfecture du Rhône",
      });
      const thomas = await fixtures.utilisateur({
        prenom: "Thomas",
        nom: "Nguyen",
        email: "thomas.nguyen@rhone.gouv.fr",
      });
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-01",
        maille: $Enums.Maille.DEPT,
        coordinateurs_territoriaux_ids: [thomas.id],
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-69",
        maille: $Enums.Maille.DEPT,
        coordinateurs_territoriaux_ids: [sophie.id, thomas.id],
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toEqual({
        personnes: [
          {
            id: thomas.id,
            prenom: "Thomas",
            nom: "Nguyen",
            email: "thomas.nguyen@rhone.gouv.fr",
            fonction: null,
            service: null,
          },
          {
            id: sophie.id,
            prenom: "Sophie",
            nom: "Bernard",
            email: "sophie.bernard@rhone.gouv.fr",
            fonction: "Coordinatrice PILOTE",
            service: "Préfecture du Rhône",
          },
        ],
        affectations: [
          { personneId: thomas.id, territoire: AIN },
          { personneId: sophie.id, territoire: RHONE },
          { personneId: thomas.id, territoire: RHONE },
        ],
      });
    }),
  );

  it(
    "ne renvoie qu'une fois un territoire présent sur plusieurs chantiers et exclut les territoires sans coordinateur et le national",
    createIntegrationTest(async () => {
      // Given
      const camille = await fixtures.utilisateur({ prenom: "Camille" });
      const premierChantier = await fixtures.chantierIdentite();
      const secondChantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: premierChantier.id,
        territoire_code: "REG-84",
        maille: $Enums.Maille.REG,
        coordinateurs_territoriaux_ids: [camille.id],
      });
      await fixtures.chantierTerritoire({
        id: secondChantier.id,
        territoire_code: "REG-84",
        maille: $Enums.Maille.REG,
        coordinateurs_territoriaux_ids: [camille.id],
      });
      await fixtures.chantierTerritoire({
        id: premierChantier.id,
        territoire_code: "DEPT-03",
        maille: $Enums.Maille.DEPT,
        coordinateurs_territoriaux_ids: [],
      });
      await fixtures.chantierTerritoire({
        id: premierChantier.id,
        territoire_code: "NAT-FR",
        maille: $Enums.Maille.NAT,
        coordinateurs_territoriaux_ids: [camille.id],
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat.affectations).toEqual([
        { personneId: camille.id, territoire: AUVERGNE_RHONE_ALPES },
      ]);
    }),
  );

  it(
    "ignore les identifiants inconnus ou malformés et garde les utilisateurs désactivés",
    createIntegrationTest(async () => {
      // Given
      const camille = await fixtures.utilisateur({ prenom: "Camille" });
      const desactive = await fixtures.utilisateur({
        date_desactivation: new Date("2026-01-01"),
      });
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-01",
        maille: $Enums.Maille.DEPT,
        coordinateurs_territoriaux_ids: [
          randomUUID(),
          "pas-un-uuid",
          desactive.id,
          camille.id,
        ],
      });
      // territoire dont le seul coordinateur n'existe plus : doit disparaître
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-03",
        maille: $Enums.Maille.DEPT,
        coordinateurs_territoriaux_ids: [randomUUID()],
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat.personnes.map((personne) => personne.id)).toEqual([
        desactive.id,
        camille.id,
      ]);
      expect(resultat.affectations).toEqual([
        { personneId: desactive.id, territoire: AIN },
        { personneId: camille.id, territoire: AIN },
      ]);
    }),
  );
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

Commande : `pnpm vitest run --project server-integration src/server/annuaire/__tests__/queries/ListerCoordinateursAnnuaireQuery.integration.test.ts`
Résultat attendu : ÉCHEC, le module `@/server/annuaire/queries/ListerCoordinateursAnnuaireQuery` est introuvable.

- [ ] **Étape 3 : écrire `personnesAnnuaire.ts`**

```ts
// src/server/annuaire/queries/personnesAnnuaire.ts
import { $Enums, type Prisma } from "@prisma/client";
import type { PrismaPilote } from "@/server/db/PrismaPilote";
import { getServiceLibelle } from "@/utils/referentiel-services";

export type PersonneAnnuaire = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  fonction: string | null;
  service: string | null;
};

export type MailleAnnuaire = Exclude<$Enums.Maille, "NAT">;

export type TerritoireAnnuaire = {
  code: string;
  nom: string;
  maille: MailleAnnuaire;
  regionCode: string;
  regionNom: string;
};

type ClientPrisma = ReturnType<PrismaPilote["getInstance"]>;

export const MAILLES_ANNUAIRE: MailleAnnuaire[] = [
  $Enums.Maille.REG,
  $Enums.Maille.DEPT,
];

export const selectionTerritoire = {
  code: true,
  nom_affiche: true,
  maille: true,
  territoire_parent: { select: { code: true, nom_affiche: true } },
} satisfies Prisma.territoireSelect;

type TerritoirePrisma = Prisma.territoireGetPayload<{
  select: typeof selectionTerritoire;
}>;

export function versTerritoireAnnuaire(
  territoire: TerritoirePrisma,
): TerritoireAnnuaire {
  const region =
    territoire.maille === $Enums.Maille.REG
      ? territoire
      : (territoire.territoire_parent ?? territoire);
  return {
    code: territoire.code,
    nom: territoire.nom_affiche,
    maille:
      territoire.maille === $Enums.Maille.REG
        ? $Enums.Maille.REG
        : $Enums.Maille.DEPT,
    regionCode: region.code,
    regionNom: region.nom_affiche,
  };
}

const FORMAT_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function lirePersonnes(
  prisma: ClientPrisma,
  ids: string[],
): Promise<Map<string, PersonneAnnuaire>> {
  const idsValides = [...new Set(ids)].filter((id) => FORMAT_UUID.test(id));
  if (idsValides.length === 0) return new Map();

  const utilisateurs = await prisma.utilisateur.findMany({
    where: { id: { in: idsValides } },
    select: {
      id: true,
      prenom: true,
      nom: true,
      email: true,
      fonction: true,
      service: true,
      service_autre: true,
      perimetre_ministeriel: true,
    },
  });

  return new Map(
    utilisateurs.map((utilisateur) => [
      utilisateur.id,
      {
        id: utilisateur.id,
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        email: utilisateur.email,
        fonction: utilisateur.fonction,
        service: getServiceLibelle(
          utilisateur.perimetre_ministeriel,
          utilisateur.service,
          utilisateur.service_autre,
        ),
      },
    ]),
  );
}

export function personnesRetenues(
  affectations: { personneId: string }[],
  personnes: Map<string, PersonneAnnuaire>,
): PersonneAnnuaire[] {
  const ids = [
    ...new Set(affectations.map((affectation) => affectation.personneId)),
  ];
  return ids.flatMap((id) => {
    const personne = personnes.get(id);
    return personne ? [personne] : [];
  });
}
```

- [ ] **Étape 4 : écrire `ListerCoordinateursAnnuaireQuery.ts`**

```ts
// src/server/annuaire/queries/ListerCoordinateursAnnuaireQuery.ts
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/annuaire/module";
import {
  lirePersonnes,
  MAILLES_ANNUAIRE,
  type PersonneAnnuaire,
  personnesRetenues,
  selectionTerritoire,
  type TerritoireAnnuaire,
  versTerritoireAnnuaire,
} from "./personnesAnnuaire";

export type AffectationCoordinateur = {
  personneId: string;
  territoire: TerritoireAnnuaire;
};

export type AnnuaireCoordinateurs = {
  personnes: PersonneAnnuaire[];
  affectations: AffectationCoordinateur[];
};

export class ListerCoordinateursAnnuaireQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<AnnuaireCoordinateurs> {
    const prisma = this.prisma.getInstance();

    const lignes = await prisma.chantier_territoire.findMany({
      where: {
        maille: { in: MAILLES_ANNUAIRE },
        coordinateurs_territoriaux_ids: { isEmpty: false },
      },
      distinct: ["territoire_code"],
      orderBy: { territoire_code: "asc" },
      select: {
        coordinateurs_territoriaux_ids: true,
        territoire: { select: selectionTerritoire },
      },
    });

    const personnes = await lirePersonnes(
      prisma,
      lignes.flatMap((ligne) => ligne.coordinateurs_territoriaux_ids),
    );

    const affectations = lignes.flatMap((ligne) => {
      const territoire = versTerritoireAnnuaire(ligne.territoire);
      return ligne.coordinateurs_territoriaux_ids
        .filter((id) => personnes.has(id))
        .map((personneId) => ({ personneId, territoire }));
    });

    return {
      personnes: personnesRetenues(affectations, personnes),
      affectations,
    };
  }
}
```

- [ ] **Étape 5 : écrire `module.ts` et l'enregistrer**

```ts
// src/server/annuaire/module.ts
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerCoordinateursAnnuaireQuery } from "./queries/ListerCoordinateursAnnuaireQuery";

type AnnuaireCradle = {
  listerCoordinateursAnnuaireQuery: ListerCoordinateursAnnuaireQuery;
};

export const annuaireModule = defineModule<NoExports, AnnuaireCradle>()({
  name: "annuaire",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerCoordinateursAnnuaireQuery: asModuleClass(
        ListerCoordinateursAnnuaireQuery,
      ),
    } satisfies VerifyCradle<AnnuaireCradle>);
  },
});

type Scope = ExtractScope<typeof annuaireModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
```

Dans `src/server/module-system/moduleNames.ts`, ajouter `"annuaire",` à la fin du tableau `moduleNames` (après `"metadataEngagement",`).

Dans `src/server/dependances.ts`, ajouter l'import après celui de `metadataEngagementModule` :

```ts
import { annuaireModule } from "./annuaire/module";
```

puis `annuaireModule,` à la fin du tableau `allModules` (après `metadataEngagementModule,`).

- [ ] **Étape 6 : lancer le test et vérifier qu'il passe**

Commande : `pnpm vitest run --project server-integration src/server/annuaire/__tests__/queries/ListerCoordinateursAnnuaireQuery.integration.test.ts`
Résultat attendu : 3 tests PASS.

- [ ] **Étape 7 : vérifier le typage**

Commande : `pnpm lint:tsc`
Résultat attendu : aucune erreur. `_AssertExhaustiveModules` échoue si `annuaire` manque dans `allModules`.

- [ ] **Étape 8 : point de contrôle.** Pas de commit sans demande de l'utilisateur.

---

### Tâche 2 : `ListerResponsablesAnnuaireQuery`

**Files :**
- Create : `src/server/annuaire/queries/ListerResponsablesAnnuaireQuery.ts`
- Modify : `src/server/annuaire/module.ts`
- Test : `src/server/annuaire/__tests__/queries/ListerResponsablesAnnuaireQuery.integration.test.ts`

**Interfaces :**
- Utilise (tâche 1) : `lirePersonnes`, `personnesRetenues`, `versTerritoireAnnuaire`, `selectionTerritoire`, `MAILLES_ANNUAIRE`, `PersonneAnnuaire`, `TerritoireAnnuaire`, `Inject`.
- Produit :
  - `type ChantierAnnuaire = { id: string; nom: string }`
  - `type AffectationResponsable = { personneId: string; chantier: ChantierAnnuaire; territoire: TerritoireAnnuaire }`
  - `type AnnuaireResponsables = { personnes: PersonneAnnuaire[]; affectations: AffectationResponsable[] }`
  - `class ListerResponsablesAnnuaireQuery { run(): Promise<AnnuaireResponsables> }`, clé du cradle `listerResponsablesAnnuaireQuery`.

- [ ] **Étape 1 : écrire le test d'intégration (en échec)**

```ts
// src/server/annuaire/__tests__/queries/ListerResponsablesAnnuaireQuery.integration.test.ts
import { randomUUID } from "node:crypto";
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerResponsablesAnnuaireQuery } from "@/server/annuaire/queries/ListerResponsablesAnnuaireQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

const RHONE = {
  code: "DEPT-69",
  nom: "69 - Rhône",
  maille: $Enums.Maille.DEPT,
  regionCode: "REG-84",
  regionNom: "Auvergne-Rhône-Alpes",
};
const AUVERGNE_RHONE_ALPES = {
  code: "REG-84",
  nom: "Auvergne-Rhône-Alpes",
  maille: $Enums.Maille.REG,
  regionCode: "REG-84",
  regionNom: "Auvergne-Rhône-Alpes",
};
const NORD = {
  code: "DEPT-59",
  nom: "59 - Nord",
  maille: $Enums.Maille.DEPT,
  regionCode: "REG-32",
  regionNom: "Hauts-de-France",
};

describe("ListerResponsablesAnnuaireQuery", () => {
  let query: ListerResponsablesAnnuaireQuery;

  beforeEach(() => {
    query = new ListerResponsablesAnnuaireQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "renvoie plusieurs responsables par couple, une personne sur plusieurs couples, y compris un couple non applicable",
    createIntegrationTest(async () => {
      // Given
      const lea = await fixtures.utilisateur({
        prenom: "Léa",
        nom: "Girard",
        email: "lea.girard@rhone.gouv.fr",
      });
      const hugo = await fixtures.utilisateur({
        prenom: "Hugo",
        nom: "Perrin",
        email: "hugo.perrin@developpement-durable.gouv.fr",
      });
      const chantier = await fixtures.chantierIdentite({
        nom: "Rénovation énergétique",
        statut: $Enums.type_statut.PUBLIE,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-69",
        maille: $Enums.Maille.DEPT,
        est_applicable: true,
        responsables_locaux_ids: [lea.id, hugo.id],
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "REG-84",
        maille: $Enums.Maille.REG,
        est_applicable: false,
        responsables_locaux_ids: [hugo.id],
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-03",
        maille: $Enums.Maille.DEPT,
        responsables_locaux_ids: [],
      });
      const chantierAnnuaire = { id: chantier.id, nom: "Rénovation énergétique" };

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toEqual({
        personnes: [
          {
            id: lea.id,
            prenom: "Léa",
            nom: "Girard",
            email: "lea.girard@rhone.gouv.fr",
            fonction: null,
            service: null,
          },
          {
            id: hugo.id,
            prenom: "Hugo",
            nom: "Perrin",
            email: "hugo.perrin@developpement-durable.gouv.fr",
            fonction: null,
            service: null,
          },
        ],
        affectations: [
          { personneId: lea.id, chantier: chantierAnnuaire, territoire: RHONE },
          { personneId: hugo.id, chantier: chantierAnnuaire, territoire: RHONE },
          {
            personneId: hugo.id,
            chantier: chantierAnnuaire,
            territoire: AUVERGNE_RHONE_ALPES,
          },
        ],
      });
    }),
  );

  it(
    "ne renvoie que les chantiers publiés et exclut une personne responsable uniquement sur des chantiers non publiés",
    createIntegrationTest(async () => {
      // Given
      const julie = await fixtures.utilisateur({ prenom: "Julie" });
      const karim = await fixtures.utilisateur({ prenom: "Karim" });
      const publie = await fixtures.chantierIdentite({
        nom: "Chantier publié",
        statut: $Enums.type_statut.PUBLIE,
      });
      const brouillon = await fixtures.chantierIdentite({
        nom: "Chantier brouillon",
        statut: $Enums.type_statut.BROUILLON,
      });
      await fixtures.chantierTerritoire({
        id: publie.id,
        territoire_code: "DEPT-59",
        maille: $Enums.Maille.DEPT,
        responsables_locaux_ids: [julie.id],
      });
      // julie a aussi un chantier en brouillon, karim n'a que celui-là
      await fixtures.chantierTerritoire({
        id: brouillon.id,
        territoire_code: "DEPT-59",
        maille: $Enums.Maille.DEPT,
        responsables_locaux_ids: [julie.id, karim.id],
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat.personnes.map((personne) => personne.id)).toEqual([
        julie.id,
      ]);
      expect(resultat.affectations).toEqual([
        {
          personneId: julie.id,
          chantier: { id: publie.id, nom: "Chantier publié" },
          territoire: NORD,
        },
      ]);
    }),
  );

  it(
    "ignore les identifiants inconnus ou malformés et garde les utilisateurs désactivés",
    createIntegrationTest(async () => {
      // Given
      const julie = await fixtures.utilisateur({ prenom: "Julie" });
      const desactive = await fixtures.utilisateur({
        date_desactivation: new Date("2026-01-01"),
      });
      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier publié",
        statut: $Enums.type_statut.PUBLIE,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-59",
        maille: $Enums.Maille.DEPT,
        responsables_locaux_ids: [
          randomUUID(),
          "pas-un-uuid",
          desactive.id,
          julie.id,
        ],
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat.affectations).toEqual([
        {
          personneId: desactive.id,
          chantier: { id: chantier.id, nom: "Chantier publié" },
          territoire: NORD,
        },
        {
          personneId: julie.id,
          chantier: { id: chantier.id, nom: "Chantier publié" },
          territoire: NORD,
        },
      ]);
    }),
  );
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

Commande : `pnpm vitest run --project server-integration src/server/annuaire/__tests__/queries/ListerResponsablesAnnuaireQuery.integration.test.ts`
Résultat attendu : ÉCHEC, module introuvable.

- [ ] **Étape 3 : écrire `ListerResponsablesAnnuaireQuery.ts`**

```ts
// src/server/annuaire/queries/ListerResponsablesAnnuaireQuery.ts
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/annuaire/module";
import {
  lirePersonnes,
  MAILLES_ANNUAIRE,
  type PersonneAnnuaire,
  personnesRetenues,
  selectionTerritoire,
  type TerritoireAnnuaire,
  versTerritoireAnnuaire,
} from "./personnesAnnuaire";

export type ChantierAnnuaire = { id: string; nom: string };

export type AffectationResponsable = {
  personneId: string;
  chantier: ChantierAnnuaire;
  territoire: TerritoireAnnuaire;
};

export type AnnuaireResponsables = {
  personnes: PersonneAnnuaire[];
  affectations: AffectationResponsable[];
};

export class ListerResponsablesAnnuaireQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<AnnuaireResponsables> {
    const prisma = this.prisma.getInstance();

    const lignes = await prisma.chantier_territoire.findMany({
      where: {
        maille: { in: MAILLES_ANNUAIRE },
        responsables_locaux_ids: { isEmpty: false },
        chantier_identite: { statut: $Enums.type_statut.PUBLIE },
      },
      orderBy: [
        { chantier_identite: { nom: "asc" } },
        { territoire_code: "asc" },
      ],
      select: {
        responsables_locaux_ids: true,
        chantier_identite: { select: { id: true, nom: true } },
        territoire: { select: selectionTerritoire },
      },
    });

    const personnes = await lirePersonnes(
      prisma,
      lignes.flatMap((ligne) => ligne.responsables_locaux_ids),
    );

    const affectations = lignes.flatMap((ligne) => {
      const chantier = {
        id: ligne.chantier_identite.id,
        nom: ligne.chantier_identite.nom,
      };
      const territoire = versTerritoireAnnuaire(ligne.territoire);
      return ligne.responsables_locaux_ids
        .filter((id) => personnes.has(id))
        .map((personneId) => ({ personneId, chantier, territoire }));
    });

    return {
      personnes: personnesRetenues(affectations, personnes),
      affectations,
    };
  }
}
```

- [ ] **Étape 4 : l'enregistrer dans `module.ts`**

Remplacer le contenu de `src/server/annuaire/module.ts` par :

```ts
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerCoordinateursAnnuaireQuery } from "./queries/ListerCoordinateursAnnuaireQuery";
import { ListerResponsablesAnnuaireQuery } from "./queries/ListerResponsablesAnnuaireQuery";

type AnnuaireCradle = {
  listerCoordinateursAnnuaireQuery: ListerCoordinateursAnnuaireQuery;
  listerResponsablesAnnuaireQuery: ListerResponsablesAnnuaireQuery;
};

export const annuaireModule = defineModule<NoExports, AnnuaireCradle>()({
  name: "annuaire",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerCoordinateursAnnuaireQuery: asModuleClass(
        ListerCoordinateursAnnuaireQuery,
      ),
      listerResponsablesAnnuaireQuery: asModuleClass(
        ListerResponsablesAnnuaireQuery,
      ),
    } satisfies VerifyCradle<AnnuaireCradle>);
  },
});

type Scope = ExtractScope<typeof annuaireModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
```

- [ ] **Étape 5 : lancer les deux tests et vérifier qu'ils passent**

Commande : `pnpm vitest run --project server-integration src/server/annuaire`
Résultat attendu : 6 tests PASS.

- [ ] **Étape 6 : point de contrôle.** Pas de commit sans demande de l'utilisateur.

---

### Tâche 3 : routeur tRPC `annuaire`

**Files :**
- Create : `src/server/infrastructure/api/trpc/routes/annuaire.ts`
- Modify : `src/server/infrastructure/api/trpc/routes/routes.ts`
- Modify : `src/server/infrastructure/api/trpc/categorieLogRouteurTRPC.ts`
- Test : `src/server/infrastructure/api/trpc/__tests__/categorieLogRouteurTRPC.unit.test.ts`

**Interfaces :**
- Utilise : les clés du cradle `listerCoordinateursAnnuaireQuery` et `listerResponsablesAnnuaireQuery` (tâches 1 et 2).
- Produit : `api.annuaire.coordinateurs.useQuery()` qui renvoie `AnnuaireCoordinateurs`, et `api.annuaire.responsables.useQuery()` qui renvoie `AnnuaireResponsables`.

- [ ] **Étape 1 : ajouter le cas au test (en échec)**

Dans `categorieLogRouteurTRPC.unit.test.ts`, ajouter à la fin du premier `it.each` :

```ts
    { path: "annuaire.coordinateurs", attendu: "utilisateur" },
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

Commande : `pnpm vitest run --project server-unit src/server/infrastructure/api/trpc/__tests__/categorieLogRouteurTRPC.unit.test.ts`
Résultat attendu : ÉCHEC sur `annuaire.coordinateurs` (on obtient `systeme`).

- [ ] **Étape 3 : écrire le routeur**

```ts
// src/server/infrastructure/api/trpc/routes/annuaire.ts
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";

export const annuaireRouter = créerRouteurTRPC({
  coordinateurs: procédureProtégée.query(() =>
    getContainer("annuaire").resolve("listerCoordinateursAnnuaireQuery").run(),
  ),
  responsables: procédureProtégée.query(() =>
    getContainer("annuaire").resolve("listerResponsablesAnnuaireQuery").run(),
  ),
});
```

Dans `routes.ts`, ajouter `import { annuaireRouter } from "./annuaire";` après l'import de `metadataEngagementRouter`, puis `annuaire: annuaireRouter,` à la fin de l'objet passé à `créerRouteurTRPC`.

Dans `categorieLogRouteurTRPC.ts`, ajouter en tête de `CATEGORIE_PAR_ROUTEUR_TRPC` (ordre alphabétique) :

```ts
  annuaire: "utilisateur",
```

- [ ] **Étape 4 : lancer le test et vérifier qu'il passe**

Commande : `pnpm vitest run --project server-unit src/server/infrastructure/api/trpc/__tests__/categorieLogRouteurTRPC.unit.test.ts`
Résultat attendu : PASS.

- [ ] **Étape 5 : vérifier le typage**

Commande : `pnpm lint:tsc`
Résultat attendu : aucune erreur. `Record<RouteurTRPC, CategorieLog>` impose la clé `annuaire`.

- [ ] **Étape 6 : point de contrôle.** Pas de commit sans demande de l'utilisateur.

---

### Tâche 4 : feature flag, page `/annuaire` et entrée de menu

**Files :**
- Modify : `src/config.ts` (bloc `featureFlip`)
- Modify : `src/server/gestion-contenu/domain/VariableContenuDisponible.ts`
- Modify : `.env.example`, `.env.test`, `.env.e2e`
- Create : `src/pages/annuaire.tsx`
- Create : `src/client/components/PageAnnuaire/PageAnnuaire.tsx` (version minimale, complétée en tâche 6)
- Modify : `src/client/components/_commons/MiseEnPage/Navigation/NavigationPilote.tsx`

**Interfaces :**
- Produit : la clé `NEXT_PUBLIC_FF_ANNUAIRE` de `VariableContenuDisponibleEnv` (pour `useEnv`) et de `recupererFeatureFlipsUseCase().run()`. Le composant par défaut `PageAnnuaire`.

- [ ] **Étape 1 : déclarer le flag**

Dans `src/config.ts`, bloc `featureFlip`, après `ficheTerritoriale` :

```ts
    annuaire: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_ANNUAIRE",
    },
```

Dans `VariableContenuDisponible.ts` :
- dans le type (après `NEXT_PUBLIC_FF_FICHE_TERRITORIALE: boolean;`) : `NEXT_PUBLIC_FF_ANNUAIRE: boolean;`
- dans `FEATURE_FLIP_DEFINITIONS`, après l'entrée `NEXT_PUBLIC_FF_FICHE_TERRITORIALE` :

```ts
  {
    envKey: "NEXT_PUBLIC_FF_ANNUAIRE",
    configKey: "annuaire",
    label: "Annuaire des coordinateurs et responsables",
  },
```

Ajouter `NEXT_PUBLIC_FF_ANNUAIRE=false` dans `.env.example`, et `NEXT_PUBLIC_FF_ANNUAIRE=true` dans `.env.test` et `.env.e2e`, à côté de `NEXT_PUBLIC_FF_FICHE_TERRITORIALE`. Ajouter aussi `NEXT_PUBLIC_FF_ANNUAIRE=true` dans le `.env` local du développeur (non versionné) pour pouvoir tester.

- [ ] **Étape 2 : créer la page**

```tsx
// src/pages/annuaire.tsx
import type { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { getContainer } from "@/server/dependances";
import PageAnnuaire from "@/client/components/PageAnnuaire/PageAnnuaire";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const featureFlips = await getContainer("legacy")
    .resolve("recupererFeatureFlipsUseCase")
    .run();

  if (!featureFlips["NEXT_PUBLIC_FF_ANNUAIRE"]) {
    return { redirect: { destination: "/404", permanent: false } };
  }

  const session = await auth(context);

  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  return { props: {} };
};

export default function AnnuairePage() {
  return <PageAnnuaire />;
}
```

```tsx
// src/client/components/PageAnnuaire/PageAnnuaire.tsx (version minimale, remplacée en tâche 6)
const PageAnnuaire = () => (
  <div className="min-h-screen bg-dsfr-alt-blue-france">
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-dsfr-grey-50">Annuaire</h1>
    </div>
  </div>
);

export default PageAnnuaire;
```

- [ ] **Étape 3 : ajouter l'entrée de menu**

Dans `NavigationPilote.tsx`, après `const ffRapportCoordinateurs = …` :

```ts
  const ffAnnuaire = useEnv("NEXT_PUBLIC_FF_ANNUAIRE");
```

et dans `pages`, juste après l'objet « Mes rapports » :

```ts
        {
          nom: "Annuaire",
          lien: "/annuaire",
          matcher: "/annuaire",
          accessible: ffAnnuaire,
          prefetch: false,
          target: "_self",
        },
```

- [ ] **Étape 4 : vérifier**

Commandes : `pnpm lint:tsc` puis `pnpm vitest run --project server-unit src/server/gestion-contenu`
Résultat attendu : aucune erreur de type, les tests de feature flips passent.

Vérification manuelle : `pnpm dev`, se connecter, puis :
- avec `NEXT_PUBLIC_FF_ANNUAIRE=true` : « Annuaire » apparaît dans le menu et `/annuaire` affiche le titre ;
- avec `false` : l'entrée disparaît et `/annuaire` redirige vers `/404`.

- [ ] **Étape 5 : point de contrôle.** Pas de commit sans demande de l'utilisateur.

---

### Tâche 5 : évolutions des composants partagés

**Files :**
- Modify : `src/client/components/shared/DataTable/urlState.ts`
- Modify : `src/client/components/shared/DataTable/Body.tsx`
- Modify : `src/client/components/shared/DataTable/types.ts`
- Modify : `src/client/components/shared/DataTable/Filters.tsx`
- Modify : `src/client/components/_commons/TableauAdmin/TableauAdmin.tsx`
- Modify : `src/client/components/_commons/NavigationTertiaire/NavigationTertiaire.tsx`

**Interfaces :**
- Produit :
  - `UrlStateConfig.grouping?: { param: string; default: string; values: string[] }`. Le tableau obtient `state.grouping` et `onGroupingChange`. Un changement de regroupement efface `sort` et `page` de l'URL.
  - `FilterDescriptor` (`multiselect`) avec `groups?: { label: string; values: string[] }[]`.
  - `TableauAdmin({ table, isLoading, caption, libelles })`, où `table` est n'importe quelle instance DataTable qui fournit `Filters`, `Root`, `Header`, `Body` et `Pagination`.
  - `NavigationTertiaire({ items, value, onValueChange, children? })`.
- Non-régression : les tests client existants de `shared/DataTable` restent verts (ce ne sont pas de nouveaux tests).

- [ ] **Étape 1 : `urlState.ts`, option `grouping`**

1. Ajouter `GroupingState` à l'import de type depuis `@tanstack/react-table`.
2. Dans `UrlStateConfig`, ajouter :

```ts
  grouping?: { param: string; default: string; values: string[] };
```

3. Dans `UrlTableState`, ajouter `grouping?: GroupingState;` dans `state`, et `onGroupingChange?: OnChangeFn<GroupingState>;` dans `handlers`.
4. Dans `useUrlTableState`, après `const [filterValues, setFilterValues] = useQueryStates(…)` :

```ts
  const groupingParsers = useMemo(
    () => ({
      grouping: parseAsString.withDefault(stableConfig?.grouping?.default ?? ""),
    }),
    [stableConfig],
  );
  const [groupingQuery, setGroupingQuery] = useQueryStates(groupingParsers, {
    ...options,
    urlKeys: { grouping: stableConfig?.grouping?.param ?? "groupement" },
  });
```

5. Après le `if (stableConfig == null) { … }`, ajouter :

```ts
  const groupingConfig = stableConfig.grouping;
  const groupingValue =
    groupingConfig && groupingConfig.values.includes(groupingQuery.grouping)
      ? groupingQuery.grouping
      : groupingConfig?.default;
```

6. Dans `state`, ajouter :

```ts
    ...(groupingConfig && groupingValue ? { grouping: [groupingValue] } : {}),
```

7. Après `onColumnFiltersChange`, ajouter :

```ts
  const onGroupingChange: OnChangeFn<GroupingState> = (updater) => {
    const next = resolve(updater, groupingValue ? [groupingValue] : []);
    void setGroupingQuery({ grouping: next[0] ?? null });
    void setQuery({
      ...(stableConfig.sorting ? { sort: null } : {}),
      ...(stableConfig.pagination ? { page: null } : {}),
    });
  };
```

8. Dans `handlers`, ajouter `...(groupingConfig ? { onGroupingChange } : {}),`.

`hasActiveFilters` et `resetFilters` ne changent pas : le regroupement n'est pas un filtre.

- [ ] **Étape 2 : `Body.tsx`, pas de bouton de dépliage sans `rowExpandingFeature`**

Ajouter un paramètre `canExpand` à `renderCellContent` :

```ts
function renderCellContent(
  cell: AnyCell,
  isGroupRow: boolean,
  canExpand: boolean,
  renderGroupCell: DataTableBodyProps["renderGroupCell"],
) {
  const row = cell.row;
  if (isGroupRow && canExpand && cell.getIsGrouped()) {
```

(le reste de la fonction ne change pas). Dans `DataTableRow`, après `const isGroupRow = …` :

```ts
  const canExpand = hasFeature(table, "rowExpandingFeature");
```

et remplacer l'appel par `renderCellContent(cell, isGroupRow, canExpand, renderGroupCell)`.

- [ ] **Étape 3 : `types.ts` et `Filters.tsx`, groupes d'options**

Dans `types.ts`, variante `multiselect` de `FilterDescriptor`, ajouter :

```ts
      groups?: { label: string; values: string[] }[];
```

Dans `Filters.tsx`, remplacer la prop `optionGroups` de `MultiSelectFiltre` par :

```tsx
      optionGroups={
        filter.groups?.map((group) => ({
          label: group.label,
          options: group.values,
        })) ?? [
          { label: "", options: filter.options.map((option) => option.value) },
        ]
      }
```

- [ ] **Étape 4 : `TableauAdmin.tsx`, type de `table` élargi**

Remplacer l'import de `TableAdmin` et `RowData`, puis la signature, par un contrat structurel :

```tsx
import type { ReactNode } from "react";
import Loader from "@/components/_commons/Loader/Loader";
import type { DataTableBodyProps } from "@/components/shared/DataTable/Body";
import type { DataTableFiltersProps } from "@/components/shared/DataTable/Filters";
import type { DataTableHeaderProps } from "@/components/shared/DataTable/Header";
import type { DataTablePaginationProps } from "@/components/shared/DataTable/Pagination";
import type { DataTableRootProps } from "@/components/shared/DataTable/Root";

type TableauAdminTable = {
  Filters: (props: DataTableFiltersProps) => ReactNode;
  Root: (props: DataTableRootProps) => ReactNode;
  Header: (props: DataTableHeaderProps) => ReactNode;
  Body: (props: DataTableBodyProps) => ReactNode;
  Pagination: (props: DataTablePaginationProps) => ReactNode;
  store: { state: { globalFilter?: string } };
};

export function TableauAdmin({
  table,
  isLoading,
  caption,
  libelles,
}: {
  table: TableauAdminTable;
  isLoading: boolean;
  caption: string;
  libelles: LibellesTableauAdmin;
}) {
```

Le corps de la fonction ne change pas.

- [ ] **Étape 5 : `NavigationTertiaire.tsx`, prop `children`**

```tsx
import type { ReactNode } from "react";
import { Tabs } from "radix-ui";

type NavigationTertiaireItem = {
  value: string;
  label: string;
};

type NavigationTertiaireProps = {
  items: NavigationTertiaireItem[];
  value: string;
  onValueChange: (value: string) => void;
  children?: ReactNode;
};

export const NavigationTertiaire = ({
  items,
  value,
  onValueChange,
  children,
}: NavigationTertiaireProps) => {
  return (
    <Tabs.Root onValueChange={onValueChange} value={value}>
      <Tabs.List className="flex gap-0 !border-b-1 !border-dsfr-mention-grey overflow-x-auto">
        {items.map((item) => (
          <Tabs.Trigger
            className="!px-6 !py-3 !text-sm !font-medium !transition-colors !border-b-2 data-[state=active]:!border-primary data-[state=active]:!text-primary !border-transparent !text-gray-700 hover:!text-gray-900 whitespace-nowrap flex-shrink-0"
            key={item.value}
            value={item.value}
          >
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {children !== undefined && (
        <Tabs.Content value={value}>{children}</Tabs.Content>
      )}
    </Tabs.Root>
  );
};
```

- [ ] **Étape 6 : vérifier la non-régression**

Commandes :
- `pnpm lint:tsc` : aucune erreur (les 7 pages de référentiels passent toujours leur `table` à `TableauAdmin`).
- `pnpm vitest run --project client src/client/components/shared/DataTable` : tous les tests existants passent, y compris `Body.unit.test.tsx`, qui active `rowExpandingFeature` et garde donc le bouton.

Si `pnpm lint:tsc` refuse `store` dans `TableauAdminTable` (type de `table.store.state` incompatible), remplacer `store: { state: { globalFilter?: string } }` par `store: { state: object }` et lire la recherche avec `String((table.store.state as { globalFilter?: unknown }).globalFilter ?? "")`.

Vérification manuelle : `/panel-administrateur/referentiels/porteurs` et la page d'édition d'un chantier (onglets Metadata / Pondérations) fonctionnent comme avant.

- [ ] **Étape 7 : point de contrôle.** Pas de commit sans demande de l'utilisateur.

---

### Tâche 6 : page Annuaire et onglet Coordinateurs

**Files :**
- Create : `src/client/components/PageAnnuaire/lignesAnnuaire.ts`
- Create : `src/client/components/PageAnnuaire/featuresAnnuaire.ts`
- Create : `src/client/components/PageAnnuaire/SelecteurGroupement.tsx`
- Create : `src/client/components/PageAnnuaire/tuileAnnuaire.tsx`
- Create : `src/client/components/PageAnnuaire/cellules/BadgeNiveau.tsx`
- Create : `src/client/components/PageAnnuaire/cellules/CelluleTerritoire.tsx`
- Create : `src/client/components/PageAnnuaire/cellules/BoutonCopierEmail.tsx`
- Create : `src/client/components/PageAnnuaire/cellules/BlocPersonne.tsx`
- Create : `src/client/components/PageAnnuaire/cellules/Listes.tsx`
- Create : `src/client/components/PageAnnuaire/useTableauCoordinateurs.tsx`
- Create : `src/client/components/PageAnnuaire/TableauCoordinateurs.tsx`
- Modify : `src/client/components/PageAnnuaire/PageAnnuaire.tsx` (remplace la version minimale)

**Interfaces :**
- Utilise : `api.annuaire.coordinateurs` (tâche 3), `AnnuaireCoordinateurs`, `PersonneAnnuaire`, `TerritoireAnnuaire`, `MailleAnnuaire` (tâche 1), `urlState.grouping`, les groupes de filtre, `TableauAdmin`, `NavigationTertiaire` avec `children` (tâche 5).
- Produit (utilisé en tâche 7) :
  - `lignesAnnuaire.ts` : `LigneCoordinateur`, `LigneResponsable`, `lignesCoordinateurs`, `lignesResponsables`, `cleTerritoire`, `clePersonne`, `cleCouple`, `filtreTerritoires`, `filtreChantiers`
  - `featuresAnnuaire.ts` : `tableauAnnuaire`
  - `SelecteurGroupement<T>({ options, valeur, onChange })`
  - `tuileAnnuaire(row)`
  - cellules : `BadgeNiveau`, `CelluleTerritoire`, `BlocPersonne`, `ListePersonnes`, `ListeTerritoires`, `ListeAffectations`
  - `PageAnnuaire` qui importe `TableauResponsables` depuis `./TableauResponsables`. Ce fichier est créé en tâche 7 : jusque-là, créer `TableauResponsables.tsx` avec `export function TableauResponsables() { return null; }`.

- [ ] **Étape 1 : `lignesAnnuaire.ts`**

```ts
// src/client/components/PageAnnuaire/lignesAnnuaire.ts
import type { AnnuaireCoordinateurs } from "@/server/annuaire/queries/ListerCoordinateursAnnuaireQuery";
import type {
  AnnuaireResponsables,
  ChantierAnnuaire,
} from "@/server/annuaire/queries/ListerResponsablesAnnuaireQuery";
import type {
  PersonneAnnuaire,
  TerritoireAnnuaire,
} from "@/server/annuaire/queries/personnesAnnuaire";
import type { FilterOption } from "@/components/shared/DataTable/types";

export type LigneCoordinateur = {
  personne: PersonneAnnuaire;
  territoire: TerritoireAnnuaire;
};

export type LigneResponsable = LigneCoordinateur & {
  chantier: ChantierAnnuaire;
};

const indexerParId = (personnes: PersonneAnnuaire[]) =>
  new Map(personnes.map((personne) => [personne.id, personne]));

export function lignesCoordinateurs({
  personnes,
  affectations,
}: AnnuaireCoordinateurs): LigneCoordinateur[] {
  const personneParId = indexerParId(personnes);
  return affectations.flatMap((affectation) => {
    const personne = personneParId.get(affectation.personneId);
    return personne ? [{ personne, territoire: affectation.territoire }] : [];
  });
}

export function lignesResponsables({
  personnes,
  affectations,
}: AnnuaireResponsables): LigneResponsable[] {
  const personneParId = indexerParId(personnes);
  return affectations.flatMap((affectation) => {
    const personne = personneParId.get(affectation.personneId);
    return personne
      ? [
          {
            personne,
            chantier: affectation.chantier,
            territoire: affectation.territoire,
          },
        ]
      : [];
  });
}

// Clés de regroupement ET de tri : une valeur unique par groupe, dans l'ordre d'affichage voulu.
export const cleTerritoire = (territoire: TerritoireAnnuaire) =>
  `${territoire.maille === "REG" ? 0 : 1}|${territoire.nom}|${territoire.code}`;

export const clePersonne = (personne: PersonneAnnuaire) =>
  `${personne.nom} ${personne.prenom}|${personne.id}`;

export const cleCouple = (ligne: LigneResponsable) =>
  `${ligne.chantier.nom}|${ligne.chantier.id}|${cleTerritoire(ligne.territoire)}`;

export type FiltreAvecGroupes = {
  options: FilterOption[];
  groups: { label: string; values: string[] }[];
};

export function filtreTerritoires(
  territoires: TerritoireAnnuaire[],
): FiltreAvecGroupes {
  const uniques = [
    ...new Map(
      territoires.map((territoire) => [territoire.code, territoire]),
    ).values(),
  ].sort((gauche, droite) =>
    cleTerritoire(gauche).localeCompare(cleTerritoire(droite), "fr"),
  );
  return {
    options: uniques.map((territoire) => ({
      value: territoire.code,
      label: territoire.nom,
    })),
    groups: [
      {
        label: "Régions",
        values: uniques
          .filter((territoire) => territoire.maille === "REG")
          .map((territoire) => territoire.code),
      },
      {
        label: "Départements",
        values: uniques
          .filter((territoire) => territoire.maille === "DEPT")
          .map((territoire) => territoire.code),
      },
    ],
  };
}

export function filtreChantiers(chantiers: ChantierAnnuaire[]): FilterOption[] {
  return [
    ...new Map(chantiers.map((chantier) => [chantier.id, chantier])).values(),
  ]
    .sort((gauche, droite) => gauche.nom.localeCompare(droite.nom, "fr"))
    .map((chantier) => ({ value: chantier.id, label: chantier.nom }));
}
```

- [ ] **Étape 2 : `featuresAnnuaire.ts`**

```ts
// src/client/components/PageAnnuaire/featuresAnnuaire.ts
import {
  columnFilteringFeature,
  columnGroupingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";

/**
 * Regroupement sans dépliage : `getRowModel().rows` ne contient que les lignes de groupe,
 * et chaque colonne de liste parcourt `row.subRows`. Pas de `rowExpandingFeature`, donc
 * pas de bouton de dépliage dans `DataTable/Body` (pas d'accordéon).
 */
export const featuresAnnuaire = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  columnGroupingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  filteredRowModel: createFilteredRowModel(),
  groupedRowModel: createGroupedRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

export const tableauAnnuaire = createDataTableHook(featuresAnnuaire);
```

- [ ] **Étape 3 : les cellules**

```tsx
// src/client/components/PageAnnuaire/cellules/BadgeNiveau.tsx
import type { MailleAnnuaire } from "@/server/annuaire/queries/personnesAnnuaire";
import { clsxm } from "@/utils/clsxm";

const NIVEAUX: Record<MailleAnnuaire, { libelle: string; classes: string }> = {
  REG: {
    libelle: "Régional",
    classes: "bg-dsfr-blue-france-950 text-primary ring-dsfr-blue-france-850",
  },
  DEPT: {
    libelle: "Départemental",
    classes: "bg-white text-dsfr-grey-200 ring-dsfr-grey-925",
  },
};

export function BadgeNiveau({ maille }: { maille: MailleAnnuaire }) {
  const niveau = NIVEAUX[maille];
  return (
    <span
      className={clsxm(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset whitespace-nowrap",
        niveau.classes,
      )}
    >
      {niveau.libelle}
    </span>
  );
}
```

```tsx
// src/client/components/PageAnnuaire/cellules/CelluleTerritoire.tsx
import type { TerritoireAnnuaire } from "@/server/annuaire/queries/personnesAnnuaire";

export function CelluleTerritoire({
  territoire,
}: {
  territoire: TerritoireAnnuaire;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium">{territoire.nom}</span>
      {territoire.maille === "DEPT" && (
        <span className="text-xs text-dsfr-mention-grey">
          {territoire.regionNom}
        </span>
      )}
    </div>
  );
}
```

```tsx
// src/client/components/PageAnnuaire/cellules/BoutonCopierEmail.tsx
import { toast } from "sonner";
import { Icone } from "@/components/_commons/Icone";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";

export function BoutonCopierEmail({
  email,
  nomComplet,
}: {
  email: string;
  nomComplet: string;
}) {
  const libelle = `Copier l'adresse e-mail de ${nomComplet}`;

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Adresse e-mail copiée");
    } catch {
      toast.error("L'adresse e-mail n'a pas pu être copiée");
    }
  };

  return (
    <button
      aria-label={libelle}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded hover:bg-dsfr-blue-france-950 focus-visible:outline-2 focus-visible:outline-dsfr-focus"
      onClick={() => void copier()}
      title={libelle}
      type="button"
    >
      <Icone className="h-4 w-4" icone={ClipboardIcon} />
    </button>
  );
}
```

```tsx
// src/client/components/PageAnnuaire/cellules/BlocPersonne.tsx
import type { PersonneAnnuaire } from "@/server/annuaire/queries/personnesAnnuaire";
import { BoutonCopierEmail } from "./BoutonCopierEmail";

export function BlocPersonne({ personne }: { personne: PersonneAnnuaire }) {
  const nomComplet = `${personne.prenom} ${personne.nom}`;
  const detail = [personne.fonction, personne.service]
    .filter((valeur): valeur is string => Boolean(valeur))
    .join(", ");

  return (
    <div className="flex flex-col gap-0.5">
      <p className="!m-0 text-sm">
        <span className="font-medium">{nomComplet}</span>
        {detail && <span className="text-dsfr-mention-grey"> · {detail}</span>}
      </p>
      <div className="flex items-center gap-1">
        <a
          className="text-sm text-primary underline underline-offset-2 break-all"
          href={`mailto:${personne.email}`}
        >
          {personne.email}
        </a>
        <BoutonCopierEmail email={personne.email} nomComplet={nomComplet} />
      </div>
    </div>
  );
}
```

```tsx
// src/client/components/PageAnnuaire/cellules/Listes.tsx
import type {
  PersonneAnnuaire,
  TerritoireAnnuaire,
} from "@/server/annuaire/queries/personnesAnnuaire";
import type { ChantierAnnuaire } from "@/server/annuaire/queries/ListerResponsablesAnnuaireQuery";
import { BadgeNiveau } from "./BadgeNiveau";
import { BlocPersonne } from "./BlocPersonne";
import { CelluleTerritoire } from "./CelluleTerritoire";

export function ListePersonnes({ personnes }: { personnes: PersonneAnnuaire[] }) {
  return (
    <ul className="!m-0 !p-0 list-none flex flex-col gap-3">
      {personnes.map((personne) => (
        <li className="!p-0" key={personne.id}>
          <BlocPersonne personne={personne} />
        </li>
      ))}
    </ul>
  );
}

export function ListeTerritoires({
  territoires,
}: {
  territoires: TerritoireAnnuaire[];
}) {
  return (
    <ul className="!m-0 !p-0 list-none flex flex-col gap-2">
      {territoires.map((territoire) => (
        <li className="!p-0 flex items-start gap-2" key={territoire.code}>
          <CelluleTerritoire territoire={territoire} />
          <BadgeNiveau maille={territoire.maille} />
        </li>
      ))}
    </ul>
  );
}

export function ListeAffectations({
  affectations,
}: {
  affectations: { chantier: ChantierAnnuaire; territoire: TerritoireAnnuaire }[];
}) {
  return (
    <ul className="!m-0 !p-0 list-none flex flex-col gap-2">
      {affectations.map(({ chantier, territoire }) => (
        <li
          className="!p-0 flex flex-wrap items-center gap-2 text-sm"
          key={`${chantier.id}|${territoire.code}`}
        >
          <span className="font-medium">{chantier.nom}</span>
          <span className="text-dsfr-mention-grey">· {territoire.nom}</span>
          <BadgeNiveau maille={territoire.maille} />
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Étape 4 : `SelecteurGroupement.tsx` et `tuileAnnuaire.tsx`**

```tsx
// src/client/components/PageAnnuaire/SelecteurGroupement.tsx
import { useId } from "react";
import { ButtonTag } from "@/components/_commons/ButtonTag";

export function SelecteurGroupement<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  valeur: T;
  onChange: (valeur: T) => void;
}) {
  const libelleId = useId();
  return (
    <div
      aria-labelledby={libelleId}
      className="flex items-center gap-2 text-sm"
      role="group"
    >
      <span className="font-semibold" id={libelleId}>
        Grouper par :
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => (
          <ButtonTag
            aria-pressed={option.value === valeur}
            isActive={option.value === valeur}
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </ButtonTag>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// src/client/components/PageAnnuaire/tuileAnnuaire.tsx
import { flexRender } from "@tanstack/react-table";
import type { AnyRow } from "@/components/shared/DataTable/config";

// Vue mobile : les cellules visibles de la ligne de groupe, empilées.
export const tuileAnnuaire = (row: AnyRow) => (
  <div className="flex flex-col gap-2 p-4">
    {row.getVisibleCells().map((cell) => (
      <div key={cell.id}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </div>
    ))}
  </div>
);
```

- [ ] **Étape 5 : `useTableauCoordinateurs.tsx`**

```tsx
// src/client/components/PageAnnuaire/useTableauCoordinateurs.tsx
import { useMemo } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type { AnnuaireCoordinateurs } from "@/server/annuaire/queries/ListerCoordinateursAnnuaireQuery";
import { BadgeNiveau } from "./cellules/BadgeNiveau";
import { BlocPersonne } from "./cellules/BlocPersonne";
import { CelluleTerritoire } from "./cellules/CelluleTerritoire";
import { ListePersonnes, ListeTerritoires } from "./cellules/Listes";
import { tableauAnnuaire } from "./featuresAnnuaire";
import {
  clePersonne,
  cleTerritoire,
  type FiltreAvecGroupes,
  type LigneCoordinateur,
  filtreTerritoires,
  lignesCoordinateurs,
} from "./lignesAnnuaire";
import { tuileAnnuaire } from "./tuileAnnuaire";

export const REGROUPEMENTS_COORDINATEURS = [
  { value: "territoire", label: "Territoire" },
  { value: "coordinateur", label: "Coordinateur" },
] as const;

export type RegroupementCoordinateurs =
  (typeof REGROUPEMENTS_COORDINATEURS)[number]["value"];

const VALEURS_REGROUPEMENT = REGROUPEMENTS_COORDINATEURS.map(
  (regroupement) => regroupement.value,
);
const REGROUPEMENT_PAR_DEFAUT: RegroupementCoordinateurs = "territoire";

const COLONNES_VISIBLES: Record<RegroupementCoordinateurs, string[]> = {
  territoire: ["territoire", "niveau", "coordinateurs"],
  coordinateur: ["coordinateur", "territoires"],
};
const COLONNES = [
  "territoire",
  "niveau",
  "coordinateurs",
  "coordinateur",
  "territoires",
  "filtreTerritoire",
];

const visibilite = (regroupement: RegroupementCoordinateurs) =>
  Object.fromEntries(
    COLONNES.map((colonne) => [
      colonne,
      COLONNES_VISIBLES[regroupement].includes(colonne),
    ]),
  );

const champsRecherche = (ligne: LigneCoordinateur) => [
  ligne.territoire.nom,
  ligne.territoire.regionNom,
  ligne.personne.prenom,
  ligne.personne.nom,
  ligne.personne.email,
  ligne.personne.fonction ?? "",
];

const columnHelper = tableauAnnuaire.createColumnHelper<LigneCoordinateur>();

// Seules les lignes de groupe sont affichées : chaque `cell` lit `row.original`
// (première affectation du groupe) ou `row.subRows` (toutes ses affectations).
const useColonnes = (filtre: FiltreAvecGroupes) =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor((ligne) => cleTerritoire(ligne.territoire), {
          id: "territoire",
          header: "Territoire",
          enableSorting: true,
          cell: ({ row }) => (
            <CelluleTerritoire territoire={row.original.territoire} />
          ),
        }),
        columnHelper.display({
          id: "niveau",
          header: "Niveau",
          cell: ({ row }) => (
            <BadgeNiveau maille={row.original.territoire.maille} />
          ),
        }),
        columnHelper.display({
          id: "coordinateurs",
          header: "Coordinateurs et adresses e-mail",
          cell: ({ row }) => (
            <ListePersonnes
              personnes={row.subRows.map((sousLigne) => sousLigne.original.personne)}
            />
          ),
        }),
        columnHelper.accessor((ligne) => clePersonne(ligne.personne), {
          id: "coordinateur",
          header: "Coordinateur et adresse e-mail",
          enableSorting: true,
          cell: ({ row }) => <BlocPersonne personne={row.original.personne} />,
        }),
        columnHelper.display({
          id: "territoires",
          header: "Territoires",
          cell: ({ row }) => (
            <ListeTerritoires
              territoires={row.subRows.map(
                (sousLigne) => sousLigne.original.territoire,
              )}
            />
          ),
        }),
        columnHelper.accessor((ligne) => ligne.territoire.code, {
          id: "filtreTerritoire",
          header: "Territoire",
          filterFn: filterFnOneOf,
          meta: {
            filter: {
              type: "multiselect",
              label: "Territoire",
              options: filtre.options,
              groups: filtre.groups,
            },
          },
        }),
      ]),
    [filtre],
  );

export const useTableauCoordinateurs = (
  donnees: AnnuaireCoordinateurs | undefined,
) => {
  const lignes = useMemo(
    () => (donnees ? lignesCoordinateurs(donnees) : []),
    [donnees],
  );
  const filtre = useMemo(
    () => filtreTerritoires(lignes.map((ligne) => ligne.territoire)),
    [lignes],
  );
  const [regroupement] = useQueryState(
    "groupement",
    parseAsStringLiteral(VALEURS_REGROUPEMENT).withDefault(
      REGROUPEMENT_PAR_DEFAUT,
    ),
  );

  const table = tableauAnnuaire.useDataTable({
    data: lignes,
    columns: useColonnes(filtre),
    rowHeader: regroupement,
    search: champsRecherche,
    tile: tuileAnnuaire,
    tileBreakpoint: "lg",
    tileLabel: (row) =>
      regroupement === "territoire"
        ? row.original.territoire.nom
        : `${row.original.personne.prenom} ${row.original.personne.nom}`,
    state: { columnVisibility: visibilite(regroupement) },
    urlState: {
      grouping: {
        param: "groupement",
        default: REGROUPEMENT_PAR_DEFAUT,
        values: VALEURS_REGROUPEMENT,
      },
      sorting: { default: [{ id: regroupement, desc: false }] },
      pagination: { pageSize: 20 },
      globalFilter: true,
      columnFilters: [{ param: "territoire", columnId: "filtreTerritoire" }],
      shallow: true,
      history: "replace",
    },
  });

  return { table, regroupement };
};
```

- [ ] **Étape 6 : `TableauCoordinateurs.tsx`**

```tsx
// src/client/components/PageAnnuaire/TableauCoordinateurs.tsx
import api from "@/server/infrastructure/api/trpc/api";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { SelecteurGroupement } from "./SelecteurGroupement";
import {
  REGROUPEMENTS_COORDINATEURS,
  useTableauCoordinateurs,
} from "./useTableauCoordinateurs";

export function TableauCoordinateurs() {
  const { data, isLoading } = api.annuaire.coordinateurs.useQuery();
  const { table, regroupement } = useTableauCoordinateurs(data);

  return (
    <div className="flex flex-col gap-4">
      <SelecteurGroupement
        onChange={(valeur) => table.setGrouping([valeur])}
        options={REGROUPEMENTS_COORDINATEURS}
        valeur={regroupement}
      />
      <TableauAdmin
        caption="Coordinateurs PILOTE"
        isLoading={isLoading}
        libelles={{
          aucun: "Aucun coordinateur",
          aucunResultat: "Aucun coordinateur ne correspond à",
        }}
        table={table}
      />
    </div>
  );
}
```

- [ ] **Étape 7 : `PageAnnuaire.tsx` (version complète) et `TableauResponsables.tsx` provisoire**

```tsx
// src/client/components/PageAnnuaire/PageAnnuaire.tsx
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { NavigationTertiaire } from "@/components/_commons/NavigationTertiaire/NavigationTertiaire";
import { TableauCoordinateurs } from "./TableauCoordinateurs";
import { TableauResponsables } from "./TableauResponsables";

const ONGLETS = [
  { value: "coordinateurs", label: "Coordinateurs PILOTE" },
  { value: "responsables", label: "Responsables locaux" },
] as const;

type Onglet = (typeof ONGLETS)[number]["value"];

const VALEURS_ONGLETS = ONGLETS.map((onglet) => onglet.value);

const estOnglet = (valeur: string): valeur is Onglet =>
  VALEURS_ONGLETS.some((onglet) => onglet === valeur);

// Changer d'onglet remet à zéro tous les paramètres des tableaux.
const PARAMETRES_TABLEAU_VIDES = {
  q: null,
  page: null,
  pageSize: null,
  sort: null,
  groupement: null,
  territoire: null,
  chantier: null,
};

const PARSEURS = {
  onglet: parseAsStringLiteral(VALEURS_ONGLETS).withDefault("coordinateurs"),
  q: parseAsString,
  page: parseAsString,
  pageSize: parseAsString,
  sort: parseAsString,
  groupement: parseAsString,
  territoire: parseAsString,
  chantier: parseAsString,
};

const PageAnnuaire = () => {
  const [{ onglet }, setParametres] = useQueryStates(PARSEURS, {
    history: "replace",
    shallow: true,
  });

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-dsfr-grey-50">Annuaire</h1>
          <p className="!mb-0 mt-1 text-dsfr-grey-200">
            Retrouvez les coordinateurs PILOTE de chaque territoire et les
            responsables locaux de chaque chantier.
          </p>
        </div>
        <NavigationTertiaire
          items={[...ONGLETS]}
          onValueChange={(valeur) => {
            if (estOnglet(valeur)) {
              void setParametres({ ...PARAMETRES_TABLEAU_VIDES, onglet: valeur });
            }
          }}
          value={onglet}
        >
          <div className="mt-6">
            {onglet === "coordinateurs" ? (
              <TableauCoordinateurs />
            ) : (
              <TableauResponsables />
            )}
          </div>
        </NavigationTertiaire>
      </div>
    </div>
  );
};

export default PageAnnuaire;
```

```tsx
// src/client/components/PageAnnuaire/TableauResponsables.tsx (provisoire, remplacé en tâche 7)
export function TableauResponsables() {
  return null;
}
```

- [ ] **Étape 8 : vérifier**

Commandes : `pnpm lint:tsc` puis `pnpm lint:oxlint`
Résultat attendu : aucune erreur.

Vérification manuelle (`pnpm dev`, flag activé, données dbt présentes en local) :
- `/annuaire` affiche l'onglet Coordinateurs, regroupé par territoire : une ligne par territoire, régions d'abord, avec tous ses coordinateurs ; pas de bouton de dépliage.
- « Grouper par : Coordinateur » : une ligne par personne, avec ses territoires. L'URL contient `groupement=coordinateur` et n'a plus ni `sort` ni `page`.
- `?groupement=nimportequoi` : regroupement par territoire, sans erreur.
- Filtre Territoire : les groupes Régions et Départements apparaissent. Choisir une région et un département affiche les deux (OU). Le filtre est dans l'URL (`territoire=…`).
- Le bouton de copie affiche « Adresse e-mail copiée ». Dans l'outil d'accessibilité du navigateur, son nom est « Copier l'adresse e-mail de Prénom Nom ».
- Sous le point de rupture `lg`, les tuiles s'affichent.

- [ ] **Étape 9 : point de contrôle.** Pas de commit sans demande de l'utilisateur.

---

### Tâche 7 : onglet Responsables

**Files :**
- Create : `src/client/components/PageAnnuaire/useTableauResponsables.tsx`
- Modify : `src/client/components/PageAnnuaire/TableauResponsables.tsx` (remplace la version provisoire)

**Interfaces :**
- Utilise : `api.annuaire.responsables` (tâche 3) ; `tableauAnnuaire`, `LigneResponsable`, `lignesResponsables`, `cleCouple`, `clePersonne`, `filtreTerritoires`, `filtreChantiers`, `FiltreAvecGroupes`, `SelecteurGroupement`, `tuileAnnuaire`, `CelluleTerritoire`, `BadgeNiveau`, `BlocPersonne`, `ListePersonnes`, `ListeAffectations` (tâche 6) ; `TableauAdmin` (tâche 5).
- Produit : `useTableauResponsables(donnees)` qui renvoie `{ table, regroupement }`, `REGROUPEMENTS_RESPONSABLES`, `TableauResponsables`.

- [ ] **Étape 1 : `useTableauResponsables.tsx`**

```tsx
// src/client/components/PageAnnuaire/useTableauResponsables.tsx
import { useMemo } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type { FilterOption } from "@/components/shared/DataTable/types";
import type { AnnuaireResponsables } from "@/server/annuaire/queries/ListerResponsablesAnnuaireQuery";
import { BadgeNiveau } from "./cellules/BadgeNiveau";
import { BlocPersonne } from "./cellules/BlocPersonne";
import { CelluleTerritoire } from "./cellules/CelluleTerritoire";
import { ListeAffectations, ListePersonnes } from "./cellules/Listes";
import { tableauAnnuaire } from "./featuresAnnuaire";
import {
  cleCouple,
  clePersonne,
  type FiltreAvecGroupes,
  filtreChantiers,
  filtreTerritoires,
  type LigneResponsable,
  lignesResponsables,
} from "./lignesAnnuaire";
import { tuileAnnuaire } from "./tuileAnnuaire";

export const REGROUPEMENTS_RESPONSABLES = [
  { value: "couple", label: "Chantier et territoire" },
  { value: "responsable", label: "Responsable" },
] as const;

export type RegroupementResponsables =
  (typeof REGROUPEMENTS_RESPONSABLES)[number]["value"];

const VALEURS_REGROUPEMENT = REGROUPEMENTS_RESPONSABLES.map(
  (regroupement) => regroupement.value,
);
const REGROUPEMENT_PAR_DEFAUT: RegroupementResponsables = "couple";

const COLONNES_VISIBLES: Record<RegroupementResponsables, string[]> = {
  couple: ["couple", "territoire", "niveau", "responsables"],
  responsable: ["responsable", "chantiersTerritoires"],
};
const COLONNES = [
  "couple",
  "territoire",
  "niveau",
  "responsables",
  "responsable",
  "chantiersTerritoires",
  "filtreTerritoire",
  "filtreChantier",
];

const visibilite = (regroupement: RegroupementResponsables) =>
  Object.fromEntries(
    COLONNES.map((colonne) => [
      colonne,
      COLONNES_VISIBLES[regroupement].includes(colonne),
    ]),
  );

const champsRecherche = (ligne: LigneResponsable) => [
  ligne.chantier.nom,
  ligne.territoire.nom,
  ligne.territoire.regionNom,
  ligne.personne.prenom,
  ligne.personne.nom,
  ligne.personne.email,
  ligne.personne.fonction ?? "",
];

const columnHelper = tableauAnnuaire.createColumnHelper<LigneResponsable>();

// Seules les lignes de groupe sont affichées : chaque `cell` lit `row.original`
// (première affectation du groupe) ou `row.subRows` (toutes ses affectations).
const useColonnes = (
  filtreTerritoire: FiltreAvecGroupes,
  optionsChantiers: FilterOption[],
) =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor((ligne) => cleCouple(ligne), {
          id: "couple",
          header: "Chantier",
          enableSorting: true,
          cell: ({ row }) => (
            <span className="text-sm font-medium">
              {row.original.chantier.nom}
            </span>
          ),
        }),
        columnHelper.display({
          id: "territoire",
          header: "Territoire",
          cell: ({ row }) => (
            <CelluleTerritoire territoire={row.original.territoire} />
          ),
        }),
        columnHelper.display({
          id: "niveau",
          header: "Niveau",
          cell: ({ row }) => (
            <BadgeNiveau maille={row.original.territoire.maille} />
          ),
        }),
        columnHelper.display({
          id: "responsables",
          header: "Responsables et adresses e-mail",
          cell: ({ row }) => (
            <ListePersonnes
              personnes={row.subRows.map((sousLigne) => sousLigne.original.personne)}
            />
          ),
        }),
        columnHelper.accessor((ligne) => clePersonne(ligne.personne), {
          id: "responsable",
          header: "Responsable et adresse e-mail",
          enableSorting: true,
          cell: ({ row }) => <BlocPersonne personne={row.original.personne} />,
        }),
        columnHelper.display({
          id: "chantiersTerritoires",
          header: "Chantiers et territoires",
          cell: ({ row }) => (
            <ListeAffectations
              affectations={row.subRows.map((sousLigne) => sousLigne.original)}
            />
          ),
        }),
        columnHelper.accessor((ligne) => ligne.territoire.code, {
          id: "filtreTerritoire",
          header: "Territoire",
          filterFn: filterFnOneOf,
          meta: {
            filter: {
              type: "multiselect",
              label: "Territoire",
              options: filtreTerritoire.options,
              groups: filtreTerritoire.groups,
            },
          },
        }),
        columnHelper.accessor((ligne) => ligne.chantier.id, {
          id: "filtreChantier",
          header: "Chantier",
          filterFn: filterFnOneOf,
          meta: {
            filter: {
              type: "multiselect",
              label: "Chantier",
              options: optionsChantiers,
            },
          },
        }),
      ]),
    [filtreTerritoire, optionsChantiers],
  );

export const useTableauResponsables = (
  donnees: AnnuaireResponsables | undefined,
) => {
  const lignes = useMemo(
    () => (donnees ? lignesResponsables(donnees) : []),
    [donnees],
  );
  const filtreTerritoire = useMemo(
    () => filtreTerritoires(lignes.map((ligne) => ligne.territoire)),
    [lignes],
  );
  const optionsChantiers = useMemo(
    () => filtreChantiers(lignes.map((ligne) => ligne.chantier)),
    [lignes],
  );
  const [regroupement] = useQueryState(
    "groupement",
    parseAsStringLiteral(VALEURS_REGROUPEMENT).withDefault(
      REGROUPEMENT_PAR_DEFAUT,
    ),
  );

  const table = tableauAnnuaire.useDataTable({
    data: lignes,
    columns: useColonnes(filtreTerritoire, optionsChantiers),
    rowHeader: regroupement,
    search: champsRecherche,
    tile: tuileAnnuaire,
    tileBreakpoint: "lg",
    tileLabel: (row) =>
      regroupement === "couple"
        ? `${row.original.chantier.nom} · ${row.original.territoire.nom}`
        : `${row.original.personne.prenom} ${row.original.personne.nom}`,
    state: { columnVisibility: visibilite(regroupement) },
    urlState: {
      grouping: {
        param: "groupement",
        default: REGROUPEMENT_PAR_DEFAUT,
        values: VALEURS_REGROUPEMENT,
      },
      sorting: { default: [{ id: regroupement, desc: false }] },
      pagination: { pageSize: 20 },
      globalFilter: true,
      columnFilters: [
        { param: "territoire", columnId: "filtreTerritoire" },
        { param: "chantier", columnId: "filtreChantier" },
      ],
      shallow: true,
      history: "replace",
    },
  });

  return { table, regroupement };
};
```

- [ ] **Étape 2 : `TableauResponsables.tsx`**

```tsx
// src/client/components/PageAnnuaire/TableauResponsables.tsx
import api from "@/server/infrastructure/api/trpc/api";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { SelecteurGroupement } from "./SelecteurGroupement";
import {
  REGROUPEMENTS_RESPONSABLES,
  useTableauResponsables,
} from "./useTableauResponsables";

export function TableauResponsables() {
  const { data, isLoading } = api.annuaire.responsables.useQuery();
  const { table, regroupement } = useTableauResponsables(data);

  return (
    <div className="flex flex-col gap-4">
      <SelecteurGroupement
        onChange={(valeur) => table.setGrouping([valeur])}
        options={REGROUPEMENTS_RESPONSABLES}
        valeur={regroupement}
      />
      <TableauAdmin
        caption="Responsables locaux"
        isLoading={isLoading}
        libelles={{
          aucun: "Aucun responsable",
          aucunResultat: "Aucun responsable ne correspond à",
        }}
        table={table}
      />
    </div>
  );
}
```

- [ ] **Étape 3 : vérifier**

Commandes : `pnpm lint:tsc` puis `pnpm lint:oxlint`
Résultat attendu : aucune erreur.

Vérification manuelle (`pnpm dev`) :
- Onglet « Responsables locaux » : une ligne par couple chantier × territoire, triée par chantier, avec tous ses responsables.
- Passer d'un onglet à l'autre efface `groupement`, `territoire`, `chantier`, `q`, `sort` et `page` de l'URL.
- Chantier + territoire : un chantier et une région donnent seulement les couples de ce chantier dans cette région (ET) ; ajouter un département ajoute ses couples (OU sur les territoires).
- « Grouper par : Responsable » : une ligne par personne, avec « chantier · territoire · niveau » pour chacune de ses affectations. Avec un filtre sur un territoire, seules les affectations de ce territoire sont listées.
- Aucun chantier en brouillon n'apparaît.

- [ ] **Étape 4 : point de contrôle.** Pas de commit sans demande de l'utilisateur.

---

### Tâche 8 : vérification finale

**Files :** aucun.

- [ ] **Étape 1 : qualité**

Commande : `pnpm lint`
Résultat attendu : oxlint, tsc et prettier sans erreur. Si prettier signale des fichiers, lancer `pnpm format` puis relancer `pnpm lint`.

- [ ] **Étape 2 : tests serveur**

Commandes :
- `pnpm vitest run --project server-integration src/server/annuaire`
- `pnpm test:server:unit`

Résultat attendu : tout est vert.

- [ ] **Étape 3 : non-régression des tableaux existants**

Commande : `pnpm vitest run --project client src/client/components/shared`
Résultat attendu : tout est vert.

- [ ] **Étape 4 : cas limites à vérifier à la main** (`pnpm dev`)
- Presse-papiers refusé : dans Chrome, bloquer l'autorisation presse-papiers du site, cliquer sur copier → message d'erreur « L'adresse e-mail n'a pas pu être copiée », pas « Adresse e-mail copiée ».
- `?groupement=nimportequoi` dans les deux onglets : regroupement par défaut, pas d'erreur.
- `?onglet=nimportequoi` : onglet Coordinateurs.
- Navigation au clavier : Tab jusqu'aux onglets, flèches gauche/droite pour changer d'onglet, Tab jusqu'aux liens `mailto:` et aux boutons de copie, focus visible.
- Pages de référentiels admin et édition de chantier : inchangées.

- [ ] **Étape 5 : point de contrôle final.** Demander à l'utilisateur s'il veut un commit et une PR.
