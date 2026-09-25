# Page « Mes indicateurs à mettre à jour » — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer une page PILOTE, réservée à `EQUIPE_DIR_PROJET`, `SECRETARIAT_GENERAL` et `DITP_ADMIN` derrière un feature flag, listant par chantier les indicateurs non à jour (avec détail par territoire chargé à la demande) et les indicateurs à paramétrer.

**Architecture:** Nouveau module serveur `suivi-indicateurs` en CQRS léger (deux classes `…Query` avec `run()` sur Prisma, enregistrées dans `module.ts`), exposé par un router tRPC `indicateursNonAJour`. Côté client, une page Next (`getServerSideProps` pour l'accès) et des composants Tailwind/DSFR ; la liste « Non à jour » est pilotée par une instance react-table headless (groupement par chantier, tri, recherche, filtres, dépliage), rendue avec un balisage custom.

**Tech Stack:** Next.js 16 (pages router), React 19, tRPC 11 + superjson, @tanstack/react-query 5, Prisma 7, Awilix (module-system), @tanstack/react-table 9.2, nuqs 2.10, zod 4, Tailwind 4 + DSFR 1.15, Vitest 5.

**Spec:** `apps/pilote-ppg/docs/superpowers/specs/2026-09-24-indicateurs-a-mettre-a-jour-design.md`
**Maquette:** https://claude.ai/artifact/16Ft2eyBCiRSerL5XerqWk

## Global Constraints

- Profils autorisés : `EQUIPE_DIR_PROJET`, `SECRETARIAT_GENERAL`, `DITP_ADMIN`.
- Feature flag : `NEXT_PUBLIC_FF_PAGE_INDICATEURS_NON_A_JOUR`, défaut `false`.
- Chantiers visibles : `session.habilitations.lecture.chantiers`, restreints aux chantiers `PUBLIE` et indicateurs `PUBLIE`.
- Non à jour : `est_applicable = true` et `est_a_jour` `false` ou `null`.
- Retard (jours) = `-prochaine_date_maj_jours` ; `null` → affiché « — », trié en dernier.
- Seuils de retard : < 21 j jaune, 21–59 j orange, ≥ 60 j rouge.
- À paramétrer : `est_applicable = true` et (`valeur_initiale` null ou jalon de l'année avec `valeur_cible` null), jalon = `getAnneeDateDeBascule(new Date(), configuration().dateBasculeAffichageValeursAnneePrecedente)`.
- Lien import : `/chantier/{chantierId}/indicateurs`. Lien chantier : `/chantier/{chantierId}/NAT-FR`.
- Lecture seule : pas d'export, pas de relance mail, pas de propositions de valeur.
- Tests : `expect(result).toEqual([{...}])` plutôt que `toHaveLength` + index ; commentaires limités à `// Given`, `// When`, `// Then` (et commentaire de données de test si indispensable). Pas de variables de 1–2 caractères. Utiliser `$Enums` de `@prisma/client` pour les énumérations.
- Commits : ne commiter **que** sur demande explicite de l'utilisateur. Les étapes « Commit » ci-dessous consistent à proposer le commit et attendre l'accord.
- Tests lancés par l'agent, ciblés sur les fichiers concernés : depuis `apps/pilote-ppg`, `pnpm vitest run <chemin>` (le projet vitest est déduit du suffixe `.unit.test.` / `.integration.test.`) ; en fin de fonctionnalité, `pnpm test:unit` et `pnpm test:server:integration`. Les E2E (`pnpm test:e2e`) sont proposés à l'utilisateur, pas lancés d'office.
- Pas de tests front (composants, hooks) pour cette fonctionnalité : seuls le domaine, les queries et l'habilitation sont testés.
- react-table **v9** : `useTable` + `tableFeatures`, fonctions de filtre/tri/agrégation importées ; références migrées : `useTableauChantiers.tsx`, `_commons/TableauAdmin/useEtatTableauAdmin.ts`.
- Next 16 : avant d'écrire la page, lire le guide pages router de `node_modules/next/dist/docs/` (règle du CLAUDE.md) et s'aligner sur `pages/rapports-hebdomadaires.tsx`.

## Review Focus

1. Utilisateur DITP_ADMIN avec des centaines d'indicateurs non à jour : la première requête ne doit renvoyer qu'une ligne par indicateur (jamais une ligne par territoire) → test d'agrégation multi-territoires dans la Task 3 et la Task 4.
2. `listerTerritoires` appelé avec un indicateur d'un chantier non lu par l'utilisateur : réponse `[]`, sans fuite → test dans la Task 5.
3. Indicateur non à jour dont tous les territoires ont `prochaine_date_maj_jours = null` : retard `null`, affiché « — », trié après les retards connus → test Task 3 (agrégation) et Task 5 (tri des territoires) ; côté tableau, `sortUndefined: "last"` (Task 8) à vérifier manuellement en Task 10.
4. Indicateur présent à la fois en « à paramétrer » sur plusieurs territoires avec des manques différents : une seule ligne avec l'union des manques → test Task 3.
5. Filtre maille + recherche combinés qui vident un chantier : la carte du chantier disparaît et l'état « aucun résultat » s'affiche → pas de test front : vérification manuelle en Task 10 (le filtrage précède le groupement dans le pipeline react-table).

---

## File Structure

Serveur (`apps/pilote-ppg/src/server/`) :
- Modify `gestion-utilisateur/domain/habilitation/Habilitation.ts` — profils autorisés + méthodes.
- Create `gestion-utilisateur/domain/habilitation/Habilitation.unit.test.ts`.
- Modify `../config.ts` et `gestion-contenu/domain/VariableContenuDisponible.ts` — feature flag.
- Create `suivi-indicateurs/domain/IndicateursAMettreAJour.ts` — types de sortie partagés client/serveur.
- Create `suivi-indicateurs/domain/assemblerIndicateursAMettreAJour.ts` — fonction pure d'agrégation.
- Create `suivi-indicateurs/__tests__/domain/assemblerIndicateursAMettreAJour.unit.test.ts`.
- Create `suivi-indicateurs/queries/ListerIndicateursNonAJourQuery.ts`.
- Create `suivi-indicateurs/queries/ListerTerritoiresNonAJourQuery.ts`.
- Create `suivi-indicateurs/module.ts`.
- Create `suivi-indicateurs/__tests__/queries/ListerIndicateursNonAJourQuery.integration.test.ts`.
- Create `suivi-indicateurs/__tests__/queries/ListerTerritoiresNonAJourQuery.integration.test.ts`.
- Modify `module-system/moduleNames.ts`, `dependances.ts` — enregistrement du module.
- Create `infrastructure/api/trpc/routes/indicateursNonAJour.ts`.
- Modify `infrastructure/api/trpc/routes/routes.ts`, `infrastructure/api/trpc/categorieLogRouteurTRPC.ts`.

Client (`apps/pilote-ppg/src/client/components/PageIndicateursAMettreAJour/`) :
- `retard.ts` — seuils et tonalité.
- `BadgeRetard.tsx` — pastille de retard.
- `useTableauIndicateursNonAJour.ts` — instance react-table v9.
- `FiltresIndicateurs.tsx` — recherche, chantier, maille.
- `CarteChantier.tsx` — groupe chantier.
- `LigneIndicateur.tsx` — ligne indicateur + dépliage.
- `DetailTerritoires.tsx` — détail chargé à la demande.
- `TableauIndicateursNonAJour.tsx` — assemble filtres + cartes.
- `TableauAParametrer.tsx` — onglet à paramétrer.
- `EtatVide.tsx` — tout est à jour.
- `PageIndicateursAMettreAJour.tsx` — bandeau, onglets, Suspense.

Pages / navigation :
- Create `apps/pilote-ppg/src/pages/indicateurs-a-mettre-a-jour.tsx`.
- Modify `apps/pilote-ppg/src/client/components/_commons/MiseEnPage/Navigation/NavigationPilote.tsx`.

---

### Task 0: Branche de travail

- [ ] **Step 1: Demander à l'utilisateur** s'il faut créer la branche `feature/indicateurs-a-mettre-a-jour` depuis `dev` (branche courante, à jour). Sur accord :

```bash
git switch -c feature/indicateurs-a-mettre-a-jour
```

---

### Task 1: Habilitation

**Files:**
- Modify: `apps/pilote-ppg/src/server/gestion-utilisateur/domain/habilitation/Habilitation.ts`
- Test: `apps/pilote-ppg/src/server/gestion-utilisateur/domain/habilitation/Habilitation.unit.test.ts`

**Interfaces:**
- Produces: `Habilitation#estAutoriseAAccederAuxIndicateursNonAJour(): boolean`, `Habilitation#verifierAutorisationLectureIndicateursNonAJour(): void` (lève `UnauthorizedError`).

- [ ] **Step 1: Write the failing test**

```ts
import { HabilitationBuilder } from "@/server/gestion-utilisateur/domain/habilitation/HabilitationBuilder";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";

describe("Habilitation - indicateurs non à jour", () => {
  it.each([
    [ProfilEnum.EQUIPE_DIR_PROJET, true],
    [ProfilEnum.SECRETARIAT_GENERAL, true],
    [ProfilEnum.DITP_ADMIN, true],
    [ProfilEnum.DITP_PILOTAGE, false],
    [ProfilEnum.COORDINATEUR_REGION, false],
  ])("le profil %s a accès : %s", (profil, attendu) => {
    // Given
    const habilitation = new HabilitationBuilder()
      .avecProfilCode(profil)
      .build();

    // When
    const resultat = habilitation.estAutoriseAAccederAuxIndicateursNonAJour();

    // Then
    expect(resultat).toEqual(attendu);
  });

  it("lève une erreur pour un profil non autorisé", () => {
    // Given
    const habilitation = new HabilitationBuilder()
      .avecProfilCode(ProfilEnum.DITP_PILOTAGE)
      .build();

    // When / Then
    expect(() =>
      habilitation.verifierAutorisationLectureIndicateursNonAJour(),
    ).toThrow(UnauthorizedError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/server/gestion-utilisateur/domain/habilitation/Habilitation.unit.test.ts`
Expected: FAIL — `estAutoriseAAccederAuxIndicateursNonAJour is not a function`.

- [ ] **Step 3: Implement**

Après `PROFIL_AUTORISE_A_LIRE_RAPPORTS_HEBDOMADAIRES` :

```ts
const PROFIL_AUTORISE_A_LIRE_INDICATEURS_NON_A_JOUR = new Set([
  ProfilEnum.EQUIPE_DIR_PROJET,
  ProfilEnum.SECRETARIAT_GENERAL,
  ProfilEnum.DITP_ADMIN,
]);
```

Dans la classe, après `estAutoriseAAccederAuxRapportsHebdomadaires` :

```ts
  verifierAutorisationLectureIndicateursNonAJour() {
    if (!this.estAutoriseAAccederAuxIndicateursNonAJour()) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }

  estAutoriseAAccederAuxIndicateursNonAJour() {
    return PROFIL_AUTORISE_A_LIRE_INDICATEURS_NON_A_JOUR.has(
      this.dependencies.profil,
    );
  }
```

- [ ] **Step 4: Run test to verify it passes** — même commande, Expected: PASS.

- [ ] **Step 5: Commit (sur accord)** — `feat(ppg): habilitation lecture des indicateurs non à jour`

---

### Task 2: Feature flag

**Files:**
- Modify: `apps/pilote-ppg/src/config.ts` (bloc des feature flags, après `rapportResponsablesDonnees`)
- Modify: `apps/pilote-ppg/src/server/gestion-contenu/domain/VariableContenuDisponible.ts` (type `VariableContenuDisponibleEnv` + tableau des variables)

**Interfaces:**
- Produces: clé `NEXT_PUBLIC_FF_PAGE_INDICATEURS_NON_A_JOUR` dans `VariableContenuDisponibleEnv` (lisible via `useEnv` et `recupererFeatureFlipsUseCase`).

- [ ] **Step 1: config.ts** — après `rapportResponsablesDonnees` :

```ts
    pageIndicateursNonAJour: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_PAGE_INDICATEURS_NON_A_JOUR",
    },
```

- [ ] **Step 2: VariableContenuDisponible.ts** — dans le type, après `NEXT_PUBLIC_FF_RAPPORT_RESPONSABLES_DONNEES: boolean;` :

```ts
  NEXT_PUBLIC_FF_PAGE_INDICATEURS_NON_A_JOUR: boolean;
```

et dans le tableau, après l'entrée `NEXT_PUBLIC_FF_RAPPORT_RESPONSABLES_DONNEES` :

```ts
  {
    envKey: "NEXT_PUBLIC_FF_PAGE_INDICATEURS_NON_A_JOUR",
    configKey: "pageIndicateursNonAJour",
    label: "Page indicateurs à mettre à jour",
  },
```

- [ ] **Step 3: Vérifier le typage**

Run: `pnpm tsc --noEmit -p .`
Expected: aucune erreur liée à ces fichiers. Si un test existant liste exhaustivement les variables (`grep -rn "NEXT_PUBLIC_FF_RAPPORT_RESPONSABLES_DONNEES" src --include=*.test.ts`), y ajouter la nouvelle clé et le relancer.

- [ ] **Step 4: Commit (sur accord)** — `feat(ppg): feature flag page indicateurs à mettre à jour`

---

### Task 3: Types et fonction d'agrégation

**Files:**
- Create: `apps/pilote-ppg/src/server/suivi-indicateurs/domain/IndicateursAMettreAJour.ts`
- Create: `apps/pilote-ppg/src/server/suivi-indicateurs/domain/assemblerIndicateursAMettreAJour.ts`
- Test: `apps/pilote-ppg/src/server/suivi-indicateurs/__tests__/domain/assemblerIndicateursAMettreAJour.unit.test.ts`

**Interfaces:**
- Produces (types, `IndicateursAMettreAJour.ts`) :

```ts
import { type $Enums } from "@prisma/client";

export type ManqueParametrage = "VALEUR_INITIALE" | "VALEUR_CIBLE";

export interface IndicateurNonAJour {
  chantierId: string;
  chantierNom: string;
  indicateurId: string;
  nom: string;
  periodicite: string | null;
  delaiDisponibilite: number | null;
  mailles: $Enums.Maille[];
  nbTerritoiresEnRetard: number;
  nbTerritoiresApplicables: number;
  retardMaxJours: number | null;
  dateDerniereValeurPlusAncienne: string | null;
  dateMajAttenduePlusAncienne: string | null;
  responsablesDonneesMails: string[];
}

export interface IndicateurAParametrer {
  chantierId: string;
  chantierNom: string;
  indicateurId: string;
  nom: string;
  manques: ManqueParametrage[];
  nbTerritoires: number;
}

export interface IndicateursAMettreAJour {
  nonAJour: IndicateurNonAJour[];
  aParametrer: IndicateurAParametrer[];
}

export interface TerritoireNonAJour {
  code: string;
  nom: string;
  maille: $Enums.Maille;
  dateDerniereValeur: string | null;
  dateMajAttendue: string | null;
  retardJours: number | null;
}
```

- Produces (fonction) :

```ts
export interface IdentiteIndicateur {
  indicateurId: string;
  nom: string;
  chantierId: string;
  chantierNom: string;
  periodicite: string | null;
  delaiDisponibilite: number | null;
  responsablesDonneesMails: string[];
}
export interface CompteApplicable { indicateurId: string; nbTerritoires: number }
export interface GroupeEnRetard {
  indicateurId: string;
  maille: $Enums.Maille;
  nbTerritoires: number;
  minProchaineDateMajJours: number | null;
  minDateDerniereValeur: Date | null;
  minDateMajAttendue: Date | null;
}
export interface LigneAParametrer {
  indicateurId: string;
  valeurInitialeManquante: boolean;
  valeurCibleManquante: boolean;
}
export function assemblerIndicateursAMettreAJour(entree: {
  identites: IdentiteIndicateur[];
  applicables: CompteApplicable[];
  enRetard: GroupeEnRetard[];
  aParametrer: LigneAParametrer[];
}): IndicateursAMettreAJour;
```

Règles : fusion des groupes `enRetard` par indicateur (somme des `nbTerritoires`, minimum des dates et de `minProchaineDateMajJours`, mailles dédoublonnées ordonnées `NAT`, `REG`, `DEPT`) ; `retardMaxJours = -min(prochaine_date_maj_jours)` ou `null` ; dates en `toISOString()` ; `aParametrer` fusionné par indicateur (union des manques ordonnée `VALEUR_INITIALE`, `VALEUR_CIBLE`, nombre de lignes) ; indicateur sans identité ignoré ; sorties triées par `chantierId` puis `nom`.

- [ ] **Step 1: Write the failing test**

```ts
import { $Enums } from "@prisma/client";
import { assemblerIndicateursAMettreAJour } from "@/server/suivi-indicateurs/domain/assemblerIndicateursAMettreAJour";

const identite = (indicateurId: string, chantierId = "CH-001") => ({
  indicateurId,
  nom: `Indicateur ${indicateurId}`,
  chantierId,
  chantierNom: `Chantier ${chantierId}`,
  periodicite: "Trimestrielle",
  delaiDisponibilite: 2,
  responsablesDonneesMails: ["donnees@exemple.gouv.fr"],
});

describe("assemblerIndicateursAMettreAJour", () => {
  it("agrège les groupes en retard d'un indicateur sur plusieurs mailles", () => {
    // Given
    const entree = {
      identites: [identite("IND-001")],
      applicables: [{ indicateurId: "IND-001", nbTerritoires: 120 }],
      enRetard: [
        {
          indicateurId: "IND-001",
          maille: $Enums.Maille.DEPT,
          nbTerritoires: 40,
          minProchaineDateMajJours: -86,
          minDateDerniereValeur: new Date("2026-03-31"),
          minDateMajAttendue: new Date("2026-06-30"),
        },
        {
          indicateurId: "IND-001",
          maille: $Enums.Maille.NAT,
          nbTerritoires: 1,
          minProchaineDateMajJours: -10,
          minDateDerniereValeur: new Date("2025-12-31"),
          minDateMajAttendue: new Date("2026-09-14"),
        },
      ],
      aParametrer: [],
    };

    // When
    const resultat = assemblerIndicateursAMettreAJour(entree);

    // Then
    expect(resultat).toEqual({
      nonAJour: [
        {
          chantierId: "CH-001",
          chantierNom: "Chantier CH-001",
          indicateurId: "IND-001",
          nom: "Indicateur IND-001",
          periodicite: "Trimestrielle",
          delaiDisponibilite: 2,
          mailles: [$Enums.Maille.NAT, $Enums.Maille.DEPT],
          nbTerritoiresEnRetard: 41,
          nbTerritoiresApplicables: 120,
          retardMaxJours: 86,
          dateDerniereValeurPlusAncienne: "2025-12-31T00:00:00.000Z",
          dateMajAttenduePlusAncienne: "2026-06-30T00:00:00.000Z",
          responsablesDonneesMails: ["donnees@exemple.gouv.fr"],
        },
      ],
      aParametrer: [],
    });
  });

  it("renvoie un retard null quand aucune date de mise à jour n'est connue", () => {
    // Given
    const entree = {
      identites: [identite("IND-002")],
      applicables: [{ indicateurId: "IND-002", nbTerritoires: 1 }],
      enRetard: [
        {
          indicateurId: "IND-002",
          maille: $Enums.Maille.NAT,
          nbTerritoires: 1,
          minProchaineDateMajJours: null,
          minDateDerniereValeur: null,
          minDateMajAttendue: null,
        },
      ],
      aParametrer: [],
    };

    // When
    const resultat = assemblerIndicateursAMettreAJour(entree);

    // Then
    expect(resultat.nonAJour).toEqual([
      expect.objectContaining({
        indicateurId: "IND-002",
        retardMaxJours: null,
        dateDerniereValeurPlusAncienne: null,
        dateMajAttenduePlusAncienne: null,
      }),
    ]);
  });

  it("fusionne les manques de paramétrage d'un indicateur sur plusieurs territoires", () => {
    // Given
    const entree = {
      identites: [identite("IND-003", "CH-002")],
      applicables: [],
      enRetard: [],
      aParametrer: [
        { indicateurId: "IND-003", valeurInitialeManquante: false, valeurCibleManquante: true },
        { indicateurId: "IND-003", valeurInitialeManquante: true, valeurCibleManquante: false },
        { indicateurId: "IND-003", valeurInitialeManquante: false, valeurCibleManquante: true },
      ],
    };

    // When
    const resultat = assemblerIndicateursAMettreAJour(entree);

    // Then
    expect(resultat.aParametrer).toEqual([
      {
        chantierId: "CH-002",
        chantierNom: "Chantier CH-002",
        indicateurId: "IND-003",
        nom: "Indicateur IND-003",
        manques: ["VALEUR_INITIALE", "VALEUR_CIBLE"],
        nbTerritoires: 3,
      },
    ]);
  });

  it("ignore un indicateur sans identité et trie par chantier puis nom", () => {
    // Given
    const groupe = (indicateurId: string) => ({
      indicateurId,
      maille: $Enums.Maille.NAT,
      nbTerritoires: 1,
      minProchaineDateMajJours: -1,
      minDateDerniereValeur: null,
      minDateMajAttendue: null,
    });
    const entree = {
      identites: [identite("IND-B", "CH-002"), identite("IND-A", "CH-001")],
      applicables: [],
      enRetard: [groupe("IND-B"), groupe("IND-A"), groupe("IND-INCONNU")],
      aParametrer: [],
    };

    // When
    const resultat = assemblerIndicateursAMettreAJour(entree);

    // Then
    expect(resultat.nonAJour.map((indicateur) => indicateur.indicateurId)).toEqual([
      "IND-A",
      "IND-B",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/server/suivi-indicateurs/__tests__/domain/assemblerIndicateursAMettreAJour.unit.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implement** — créer `IndicateursAMettreAJour.ts` (types ci-dessus) puis :

```ts
import { $Enums } from "@prisma/client";
import type {
  IndicateurAParametrer,
  IndicateurNonAJour,
  IndicateursAMettreAJour,
  ManqueParametrage,
} from "./IndicateursAMettreAJour";

export interface IdentiteIndicateur {
  indicateurId: string;
  nom: string;
  chantierId: string;
  chantierNom: string;
  periodicite: string | null;
  delaiDisponibilite: number | null;
  responsablesDonneesMails: string[];
}

export interface CompteApplicable {
  indicateurId: string;
  nbTerritoires: number;
}

export interface GroupeEnRetard {
  indicateurId: string;
  maille: $Enums.Maille;
  nbTerritoires: number;
  minProchaineDateMajJours: number | null;
  minDateDerniereValeur: Date | null;
  minDateMajAttendue: Date | null;
}

export interface LigneAParametrer {
  indicateurId: string;
  valeurInitialeManquante: boolean;
  valeurCibleManquante: boolean;
}

const ORDRE_MAILLES: $Enums.Maille[] = [
  $Enums.Maille.NAT,
  $Enums.Maille.REG,
  $Enums.Maille.DEPT,
];

const minimum = <T extends number | Date>(
  gauche: T | null,
  droite: T | null,
): T | null => {
  if (gauche === null) return droite;
  if (droite === null) return gauche;
  return gauche <= droite ? gauche : droite;
};

const comparerParChantierPuisNom = (
  gauche: { chantierId: string; nom: string },
  droite: { chantierId: string; nom: string },
) =>
  gauche.chantierId.localeCompare(droite.chantierId) ||
  gauche.nom.localeCompare(droite.nom);

export function assemblerIndicateursAMettreAJour(entree: {
  identites: IdentiteIndicateur[];
  applicables: CompteApplicable[];
  enRetard: GroupeEnRetard[];
  aParametrer: LigneAParametrer[];
}): IndicateursAMettreAJour {
  const identiteParId = new Map(
    entree.identites.map((identite) => [identite.indicateurId, identite]),
  );
  const applicablesParId = new Map(
    entree.applicables.map((compte) => [compte.indicateurId, compte.nbTerritoires]),
  );

  const fusionEnRetard = new Map<
    string,
    Omit<GroupeEnRetard, "maille" | "indicateurId"> & { mailles: Set<$Enums.Maille> }
  >();
  for (const groupe of entree.enRetard) {
    const existant = fusionEnRetard.get(groupe.indicateurId);
    if (!existant) {
      fusionEnRetard.set(groupe.indicateurId, {
        nbTerritoires: groupe.nbTerritoires,
        minProchaineDateMajJours: groupe.minProchaineDateMajJours,
        minDateDerniereValeur: groupe.minDateDerniereValeur,
        minDateMajAttendue: groupe.minDateMajAttendue,
        mailles: new Set([groupe.maille]),
      });
      continue;
    }
    existant.nbTerritoires += groupe.nbTerritoires;
    existant.minProchaineDateMajJours = minimum(
      existant.minProchaineDateMajJours,
      groupe.minProchaineDateMajJours,
    );
    existant.minDateDerniereValeur = minimum(
      existant.minDateDerniereValeur,
      groupe.minDateDerniereValeur,
    );
    existant.minDateMajAttendue = minimum(
      existant.minDateMajAttendue,
      groupe.minDateMajAttendue,
    );
    existant.mailles.add(groupe.maille);
  }

  const nonAJour: IndicateurNonAJour[] = [];
  for (const [indicateurId, fusion] of fusionEnRetard) {
    const identite = identiteParId.get(indicateurId);
    if (!identite) continue;
    nonAJour.push({
      chantierId: identite.chantierId,
      chantierNom: identite.chantierNom,
      indicateurId,
      nom: identite.nom,
      periodicite: identite.periodicite,
      delaiDisponibilite: identite.delaiDisponibilite,
      mailles: ORDRE_MAILLES.filter((maille) => fusion.mailles.has(maille)),
      nbTerritoiresEnRetard: fusion.nbTerritoires,
      nbTerritoiresApplicables:
        applicablesParId.get(indicateurId) ?? fusion.nbTerritoires,
      retardMaxJours:
        fusion.minProchaineDateMajJours === null
          ? null
          : -fusion.minProchaineDateMajJours,
      dateDerniereValeurPlusAncienne:
        fusion.minDateDerniereValeur?.toISOString() ?? null,
      dateMajAttenduePlusAncienne:
        fusion.minDateMajAttendue?.toISOString() ?? null,
      responsablesDonneesMails: identite.responsablesDonneesMails,
    });
  }

  const fusionAParametrer = new Map<
    string,
    { manques: Set<ManqueParametrage>; nbTerritoires: number }
  >();
  for (const ligne of entree.aParametrer) {
    const existant = fusionAParametrer.get(ligne.indicateurId) ?? {
      manques: new Set<ManqueParametrage>(),
      nbTerritoires: 0,
    };
    if (ligne.valeurInitialeManquante) existant.manques.add("VALEUR_INITIALE");
    if (ligne.valeurCibleManquante) existant.manques.add("VALEUR_CIBLE");
    existant.nbTerritoires += 1;
    fusionAParametrer.set(ligne.indicateurId, existant);
  }

  const ordreManques: ManqueParametrage[] = ["VALEUR_INITIALE", "VALEUR_CIBLE"];
  const aParametrer: IndicateurAParametrer[] = [];
  for (const [indicateurId, fusion] of fusionAParametrer) {
    const identite = identiteParId.get(indicateurId);
    if (!identite) continue;
    aParametrer.push({
      chantierId: identite.chantierId,
      chantierNom: identite.chantierNom,
      indicateurId,
      nom: identite.nom,
      manques: ordreManques.filter((manque) => fusion.manques.has(manque)),
      nbTerritoires: fusion.nbTerritoires,
    });
  }

  return {
    nonAJour: nonAJour.sort(comparerParChantierPuisNom),
    aParametrer: aParametrer.sort(comparerParChantierPuisNom),
  };
}
```

- [ ] **Step 4: Run test to verify it passes** — Expected: PASS (4 tests).

- [ ] **Step 5: Commit (sur accord)** — `feat(ppg): agrégation des indicateurs à mettre à jour`

---

### Task 4: `ListerIndicateursNonAJourQuery` + module

**Files:**
- Create: `apps/pilote-ppg/src/server/suivi-indicateurs/queries/ListerIndicateursNonAJourQuery.ts`
- Create: `apps/pilote-ppg/src/server/suivi-indicateurs/module.ts`
- Modify: `apps/pilote-ppg/src/server/module-system/moduleNames.ts` (ajouter `"suiviIndicateurs"`)
- Modify: `apps/pilote-ppg/src/server/dependances.ts` (import, `allModules`, `registerContainer`)
- Test: `apps/pilote-ppg/src/server/suivi-indicateurs/__tests__/queries/ListerIndicateursNonAJourQuery.integration.test.ts`

**Interfaces:**
- Consumes: `assemblerIndicateursAMettreAJour` et types de la Task 3.
- Produces: `ListerIndicateursNonAJourQuery#run(chantierIds: string[], jalon: number): Promise<IndicateursAMettreAJour>` ; conteneur `getContainer("suiviIndicateurs")` avec `listerIndicateursNonAJourQuery` et (Task 5) `listerTerritoiresNonAJourQuery`.

Le `jalon` est un paramètre (calculé par le router) pour garder la query déterministe en test.

- [ ] **Step 1: Write the failing test**

```ts
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerIndicateursNonAJourQuery } from "@/server/suivi-indicateurs/queries/ListerIndicateursNonAJourQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

const JALON = 2026;

const creerChantierAvecTerritoires = async (
  overrides: { id: string; statut?: $Enums.type_statut },
) => {
  const chantier = await fixtures.chantierIdentite({
    id: overrides.id,
    nom: `Chantier ${overrides.id}`,
    statut: overrides.statut ?? $Enums.type_statut.PUBLIE,
  });
  await fixtures.chantierTerritoire({
    id: chantier.id,
    territoire_code: "NAT-FR",
    zone_id: "FRANCE",
    code_insee: "FR",
    maille: $Enums.Maille.NAT,
  });
  await fixtures.chantierTerritoire({
    id: chantier.id,
    territoire_code: "DEPT-01",
    zone_id: "D01",
    code_insee: "01",
    maille: $Enums.Maille.DEPT,
  });
  return chantier;
};

const territoireDept01 = {
  territoire_code: "DEPT-01",
  zone_id: "D01",
  code_insee: "01",
  maille: $Enums.Maille.DEPT,
};

describe("ListerIndicateursNonAJourQuery", () => {
  let query: ListerIndicateursNonAJourQuery;

  beforeEach(() => {
    query = new ListerIndicateursNonAJourQuery({ prisma: new PrismaPilote() });
  });

  it(
    "agrège par indicateur les territoires non à jour des chantiers demandés",
    createIntegrationTest(async () => {
      // Given
      const chantier = await creerChantierAvecTerritoires({ id: "CH-901" });
      const indicateur = await fixtures.indicateurIdentite({
        id: "IND-901",
        chantier_id: chantier.id,
        nom: "Rénovations",
        periodicite: "Trimestrielle",
        delai_disponibilite: 2,
        responsables_donnees_mails: ["donnees@exemple.gouv.fr"],
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: "NAT-FR",
        est_applicable: true,
        est_a_jour: false,
        valeur_initiale: 1,
        prochaine_date_maj_jours: -10,
        date_valeur_actuelle_mandat: new Date("2026-06-30"),
        prochaine_date_maj: new Date("2026-09-14"),
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        ...territoireDept01,
        est_applicable: true,
        est_a_jour: null,
        valeur_initiale: 1,
        prochaine_date_maj_jours: -86,
        date_valeur_actuelle_mandat: new Date("2026-03-31"),
        prochaine_date_maj: new Date("2026-06-30"),
      });

      // When
      const resultat = await query.run([chantier.id], JALON);

      // Then
      expect(resultat).toEqual({
        nonAJour: [
          {
            chantierId: "CH-901",
            chantierNom: "Chantier CH-901",
            indicateurId: "IND-901",
            nom: "Rénovations",
            periodicite: "Trimestrielle",
            delaiDisponibilite: 2,
            mailles: [$Enums.Maille.NAT, $Enums.Maille.DEPT],
            nbTerritoiresEnRetard: 2,
            nbTerritoiresApplicables: 2,
            retardMaxJours: 86,
            dateDerniereValeurPlusAncienne: "2026-03-31T00:00:00.000Z",
            dateMajAttenduePlusAncienne: "2026-06-30T00:00:00.000Z",
            responsablesDonneesMails: ["donnees@exemple.gouv.fr"],
          },
        ],
        aParametrer: [],
      });
    }),
  );

  it(
    "exclut les territoires à jour, non applicables, les indicateurs supprimés, les chantiers non publiés et hors périmètre",
    createIntegrationTest(async () => {
      // Given
      const chantier = await creerChantierAvecTerritoires({ id: "CH-902" });
      const chantierBrouillon = await creerChantierAvecTerritoires({
        id: "CH-903",
        statut: $Enums.type_statut.BROUILLON,
      });
      const chantierHorsPerimetre = await creerChantierAvecTerritoires({ id: "CH-904" });
      const indicateurAJour = await fixtures.indicateurIdentite({ id: "IND-902", chantier_id: chantier.id });
      const indicateurNonApplicable = await fixtures.indicateurIdentite({ id: "IND-903", chantier_id: chantier.id });
      const indicateurSupprime = await fixtures.indicateurIdentite({
        id: "IND-904",
        chantier_id: chantier.id,
        statut: $Enums.type_statut_indicateur.SUPPRIME,
      });
      const indicateurBrouillon = await fixtures.indicateurIdentite({ id: "IND-905", chantier_id: chantierBrouillon.id });
      const indicateurHorsPerimetre = await fixtures.indicateurIdentite({ id: "IND-906", chantier_id: chantierHorsPerimetre.id });
      const ligne = (id: string, chantierId: string, surcharge: object) =>
        fixtures.indicateurTerritoire({
          id,
          chantier_id: chantierId,
          territoire_code: "NAT-FR",
          est_applicable: true,
          est_a_jour: false,
          valeur_initiale: 1,
          ...surcharge,
        });
      await ligne(indicateurAJour.id, chantier.id, { est_a_jour: true });
      await ligne(indicateurNonApplicable.id, chantier.id, { est_applicable: false });
      await ligne(indicateurSupprime.id, chantier.id, {});
      await ligne(indicateurBrouillon.id, chantierBrouillon.id, {});
      await ligne(indicateurHorsPerimetre.id, chantierHorsPerimetre.id, {});

      // When
      const resultat = await query.run([chantier.id, chantierBrouillon.id], JALON);

      // Then
      expect(resultat).toEqual({ nonAJour: [], aParametrer: [] });
    }),
  );

  it(
    "liste les indicateurs sans valeur initiale ou sans cible pour le jalon",
    createIntegrationTest(async () => {
      // Given
      const chantier = await creerChantierAvecTerritoires({ id: "CH-905" });
      const indicateur = await fixtures.indicateurIdentite({
        id: "IND-907",
        chantier_id: chantier.id,
        nom: "Taux de recours",
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: "NAT-FR",
        est_applicable: true,
        est_a_jour: true,
        valeur_initiale: null,
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        ...territoireDept01,
        est_applicable: true,
        est_a_jour: true,
        valeur_initiale: 5,
      });
      await fixtures.indicateurTerritoireJalon({
        id: indicateur.id,
        ...territoireDept01,
        jalon: JALON,
        valeur_cible: null,
      });

      // When
      const resultat = await query.run([chantier.id], JALON);

      // Then
      expect(resultat).toEqual({
        nonAJour: [],
        aParametrer: [
          {
            chantierId: "CH-905",
            chantierNom: "Chantier CH-905",
            indicateurId: "IND-907",
            nom: "Taux de recours",
            manques: ["VALEUR_INITIALE", "VALEUR_CIBLE"],
            nbTerritoires: 2,
          },
        ],
      });
    }),
  );
});
```

> Si `fixtures.indicateurTerritoireJalon` exige des champs supplémentaires (FK `chantier_territoire_jalon`…), lire `fiche-conducteur/__tests__/infrastructure/adapters/PrismaIndicateurRepository.integration.test.ts` qui l'utilise et reproduire sa mise en place.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/server/suivi-indicateurs/__tests__/queries/ListerIndicateursNonAJourQuery.integration.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implement the query**

```ts
import { $Enums, type Prisma } from "@prisma/client";
import type { Inject } from "@/server/suivi-indicateurs/module";
import { assemblerIndicateursAMettreAJour } from "@/server/suivi-indicateurs/domain/assemblerIndicateursAMettreAJour";
import type { IndicateursAMettreAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";

export const filtreIndicateurTerritoirePublie = (
  chantierIds: string[],
): Prisma.indicateur_territoireWhereInput => ({
  chantier_id: { in: chantierIds },
  est_applicable: true,
  indicateur_identite: {
    statut: $Enums.type_statut_indicateur.PUBLIE,
    chantier_identite: { statut: $Enums.type_statut.PUBLIE },
  },
});

export const filtreNonAJour: Prisma.indicateur_territoireWhereInput = {
  OR: [{ est_a_jour: false }, { est_a_jour: null }],
};

export class ListerIndicateursNonAJourQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async run(
    chantierIds: string[],
    jalon: number,
  ): Promise<IndicateursAMettreAJour> {
    const prisma = this.deps.prisma.getInstance();
    const filtrePublie = filtreIndicateurTerritoirePublie(chantierIds);

    const [applicables, enRetard, aParametrer] = await Promise.all([
      prisma.indicateur_territoire.groupBy({
        by: ["id"],
        where: filtrePublie,
        _count: { _all: true },
      }),
      prisma.indicateur_territoire.groupBy({
        by: ["id", "maille"],
        where: { AND: [filtrePublie, filtreNonAJour] },
        _count: { _all: true },
        _min: {
          prochaine_date_maj_jours: true,
          date_valeur_actuelle_mandat: true,
          prochaine_date_maj: true,
        },
      }),
      prisma.indicateur_territoire.findMany({
        where: {
          AND: [
            filtrePublie,
            {
              OR: [
                { valeur_initiale: null },
                {
                  indicateur_territoire_jalon: {
                    some: { jalon, valeur_cible: null },
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          valeur_initiale: true,
          indicateur_territoire_jalon: {
            where: { jalon, valeur_cible: null },
            select: { jalon: true },
          },
        },
      }),
    ]);

    const indicateurIds = [
      ...new Set([
        ...enRetard.map((groupe) => groupe.id),
        ...aParametrer.map((ligne) => ligne.id),
      ]),
    ];
    const identites = await prisma.indicateur_identite.findMany({
      where: { id: { in: indicateurIds } },
      select: {
        id: true,
        nom: true,
        chantier_id: true,
        periodicite: true,
        delai_disponibilite: true,
        responsables_donnees_mails: true,
        chantier_identite: { select: { nom: true } },
      },
    });

    return assemblerIndicateursAMettreAJour({
      identites: identites.map((identite) => ({
        indicateurId: identite.id,
        nom: identite.nom,
        chantierId: identite.chantier_id,
        chantierNom: identite.chantier_identite.nom,
        periodicite: identite.periodicite,
        delaiDisponibilite: identite.delai_disponibilite,
        responsablesDonneesMails: identite.responsables_donnees_mails,
      })),
      applicables: applicables.map((groupe) => ({
        indicateurId: groupe.id,
        nbTerritoires: groupe._count._all,
      })),
      enRetard: enRetard.map((groupe) => ({
        indicateurId: groupe.id,
        maille: groupe.maille,
        nbTerritoires: groupe._count._all,
        minProchaineDateMajJours: groupe._min.prochaine_date_maj_jours,
        minDateDerniereValeur: groupe._min.date_valeur_actuelle_mandat,
        minDateMajAttendue: groupe._min.prochaine_date_maj,
      })),
      aParametrer: aParametrer.map((ligne) => ({
        indicateurId: ligne.id,
        valeurInitialeManquante: ligne.valeur_initiale === null,
        valeurCibleManquante: ligne.indicateur_territoire_jalon.length > 0,
      })),
    });
  }
}
```

> Vérifier le nom de la relation `indicateur_identite → chantier_identite` dans `schema.prisma` (utilisée telle quelle dans `PrismaIndicateurRepository.recupererIndicateursNonAJourParChantierId`). Si `groupBy` refuse le filtre relationnel, le signaler plutôt que contourner silencieusement.

- [ ] **Step 4: Module**

`suivi-indicateurs/module.ts` :

```ts
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerIndicateursNonAJourQuery } from "./queries/ListerIndicateursNonAJourQuery";

type SuiviIndicateursCradle = {
  listerIndicateursNonAJourQuery: ListerIndicateursNonAJourQuery;
};

export const suiviIndicateursModule = defineModule<
  NoExports,
  SuiviIndicateursCradle
>()({
  name: "suiviIndicateurs",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerIndicateursNonAJourQuery: asModuleClass(
        ListerIndicateursNonAJourQuery,
      ),
    } satisfies VerifyCradle<SuiviIndicateursCradle>);
  },
});

type Scope = ExtractScope<typeof suiviIndicateursModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
```

`module-system/moduleNames.ts` : ajouter `"suiviIndicateurs",` après `"metadataEngagement"` (ou à la fin de la liste).

`dependances.ts` : `import { suiviIndicateursModule } from "./suivi-indicateurs/module";`, ajouter `suiviIndicateursModule,` en fin de `allModules`, et `suiviIndicateurs: getContainer("suiviIndicateurs"),` en fin de `registerContainer`.

- [ ] **Step 5: Run test to verify it passes** — même commande que Step 2, Expected: PASS (3 tests).

- [ ] **Step 6: Commit (sur accord)** — `feat(ppg): query des indicateurs non à jour`

---

### Task 5: `ListerTerritoiresNonAJourQuery`

**Files:**
- Create: `apps/pilote-ppg/src/server/suivi-indicateurs/queries/ListerTerritoiresNonAJourQuery.ts`
- Modify: `apps/pilote-ppg/src/server/suivi-indicateurs/module.ts`
- Test: `apps/pilote-ppg/src/server/suivi-indicateurs/__tests__/queries/ListerTerritoiresNonAJourQuery.integration.test.ts`

**Interfaces:**
- Consumes: `filtreIndicateurTerritoirePublie`, `filtreNonAJour` (Task 4), `TerritoireNonAJour` (Task 3).
- Produces: `ListerTerritoiresNonAJourQuery#run(indicateurId: string, chantierIds: string[]): Promise<TerritoireNonAJour[]>`, trié par `retardJours` décroissant, `null` en dernier, puis par `nom`.

- [ ] **Step 1: Write the failing test**

```ts
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerTerritoiresNonAJourQuery } from "@/server/suivi-indicateurs/queries/ListerTerritoiresNonAJourQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

const TERRITOIRES = [
  { territoire_code: "NAT-FR", zone_id: "FRANCE", code_insee: "FR", maille: $Enums.Maille.NAT },
  { territoire_code: "DEPT-01", zone_id: "D01", code_insee: "01", maille: $Enums.Maille.DEPT },
  { territoire_code: "DEPT-02", zone_id: "D02", code_insee: "02", maille: $Enums.Maille.DEPT },
];

const creerIndicateur = async (chantierId: string, indicateurId: string) => {
  const chantier = await fixtures.chantierIdentite({ id: chantierId });
  for (const territoire of TERRITOIRES) {
    await fixtures.chantierTerritoire({ id: chantier.id, ...territoire });
  }
  return fixtures.indicateurIdentite({ id: indicateurId, chantier_id: chantier.id });
};

describe("ListerTerritoiresNonAJourQuery", () => {
  let query: ListerTerritoiresNonAJourQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerTerritoiresNonAJourQuery({ prisma: prismaPilote });
  });

  it(
    "liste les territoires non à jour triés par retard décroissant, retard inconnu en dernier",
    createIntegrationTest(async () => {
      // Given
      const indicateur = await creerIndicateur("CH-911", "IND-911");
      const [nat, dept01, dept02] = TERRITOIRES;
      await fixtures.indicateurTerritoire({
        id: indicateur.id, chantier_id: "CH-911", ...nat,
        est_applicable: true, est_a_jour: false,
        prochaine_date_maj_jours: -10,
        date_valeur_actuelle_mandat: new Date("2026-06-30"),
        prochaine_date_maj: new Date("2026-09-14"),
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id, chantier_id: "CH-911", ...dept01,
        est_applicable: true, est_a_jour: null,
        prochaine_date_maj_jours: null,
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id, chantier_id: "CH-911", ...dept02,
        est_applicable: true, est_a_jour: false,
        prochaine_date_maj_jours: -86,
        date_valeur_actuelle_mandat: new Date("2026-03-31"),
        prochaine_date_maj: new Date("2026-06-30"),
      });
      const nomsTerritoires = new Map(
        (
          await prismaPilote.getInstance().territoire.findMany({
            where: { code: { in: TERRITOIRES.map((territoire) => territoire.territoire_code) } },
          })
        ).map((territoire) => [territoire.code, territoire.nom]),
      );

      // When
      const resultat = await query.run(indicateur.id, ["CH-911"]);

      // Then
      expect(resultat).toEqual([
        {
          code: "DEPT-02",
          nom: nomsTerritoires.get("DEPT-02"),
          maille: $Enums.Maille.DEPT,
          dateDerniereValeur: "2026-03-31T00:00:00.000Z",
          dateMajAttendue: "2026-06-30T00:00:00.000Z",
          retardJours: 86,
        },
        {
          code: "NAT-FR",
          nom: nomsTerritoires.get("NAT-FR"),
          maille: $Enums.Maille.NAT,
          dateDerniereValeur: "2026-06-30T00:00:00.000Z",
          dateMajAttendue: "2026-09-14T00:00:00.000Z",
          retardJours: 10,
        },
        {
          code: "DEPT-01",
          nom: nomsTerritoires.get("DEPT-01"),
          maille: $Enums.Maille.DEPT,
          dateDerniereValeur: null,
          dateMajAttendue: null,
          retardJours: null,
        },
      ]);
    }),
  );

  it(
    "renvoie une liste vide pour un indicateur hors du périmètre de l'utilisateur",
    createIntegrationTest(async () => {
      // Given
      const indicateur = await creerIndicateur("CH-912", "IND-912");
      await fixtures.indicateurTerritoire({
        id: indicateur.id, chantier_id: "CH-912", ...TERRITOIRES[0],
        est_applicable: true, est_a_jour: false,
      });

      // When
      const resultat = await query.run(indicateur.id, ["CH-AUTRE"]);

      // Then
      expect(resultat).toEqual([]);
    }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/server/suivi-indicateurs/__tests__/queries/ListerTerritoiresNonAJourQuery.integration.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implement**

```ts
import type { Inject } from "@/server/suivi-indicateurs/module";
import type { TerritoireNonAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";
import {
  filtreIndicateurTerritoirePublie,
  filtreNonAJour,
} from "./ListerIndicateursNonAJourQuery";

const comparerParRetard = (
  gauche: TerritoireNonAJour,
  droite: TerritoireNonAJour,
) => {
  if (gauche.retardJours === droite.retardJours) {
    return gauche.nom.localeCompare(droite.nom);
  }
  if (gauche.retardJours === null) return 1;
  if (droite.retardJours === null) return -1;
  return droite.retardJours - gauche.retardJours;
};

export class ListerTerritoiresNonAJourQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async run(
    indicateurId: string,
    chantierIds: string[],
  ): Promise<TerritoireNonAJour[]> {
    const lignes = await this.deps.prisma
      .getInstance()
      .indicateur_territoire.findMany({
        where: {
          AND: [
            { id: indicateurId },
            filtreIndicateurTerritoirePublie(chantierIds),
            filtreNonAJour,
          ],
        },
        select: {
          territoire_code: true,
          maille: true,
          date_valeur_actuelle_mandat: true,
          prochaine_date_maj: true,
          prochaine_date_maj_jours: true,
          territoire: { select: { nom: true } },
        },
      });

    return lignes
      .map((ligne) => ({
        code: ligne.territoire_code,
        nom: ligne.territoire.nom,
        maille: ligne.maille,
        dateDerniereValeur:
          ligne.date_valeur_actuelle_mandat?.toISOString() ?? null,
        dateMajAttendue: ligne.prochaine_date_maj?.toISOString() ?? null,
        retardJours:
          ligne.prochaine_date_maj_jours === null
            ? null
            : -ligne.prochaine_date_maj_jours,
      }))
      .sort(comparerParRetard);
  }
}
```

Dans `module.ts` : importer la classe, ajouter `listerTerritoiresNonAJourQuery: ListerTerritoiresNonAJourQuery;` au cradle et `listerTerritoiresNonAJourQuery: asModuleClass(ListerTerritoiresNonAJourQuery),` au `register`.

- [ ] **Step 4: Run test to verify it passes** — Expected: PASS (2 tests).

- [ ] **Step 5: Commit (sur accord)** — `feat(ppg): query du détail territorial des indicateurs non à jour`

---

### Task 6: Router tRPC

**Files:**
- Create: `apps/pilote-ppg/src/server/infrastructure/api/trpc/routes/indicateursNonAJour.ts`
- Modify: `apps/pilote-ppg/src/server/infrastructure/api/trpc/routes/routes.ts`
- Modify: `apps/pilote-ppg/src/server/infrastructure/api/trpc/categorieLogRouteurTRPC.ts`

**Interfaces:**
- Consumes: queries Tasks 4–5, habilitation Task 1, flag Task 2.
- Produces: `api.indicateursNonAJour.lister` → `IndicateursAMettreAJour` ; `api.indicateursNonAJour.listerTerritoires({ indicateurId })` → `TerritoireNonAJour[]`.

- [ ] **Step 1: Implement the router**

```ts
import { z } from "zod";
import type { Session } from "next-auth";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";

const verifierAcces = async (session: Session) => {
  const featureFlips = await getContainer("legacy")
    .resolve("recupererFeatureFlipsUseCase")
    .run();
  if (!featureFlips["NEXT_PUBLIC_FF_PAGE_INDICATEURS_NON_A_JOUR"]) {
    throw new UnauthorizedError("Fonctionnalité non disponible");
  }
  const habilitations = await getContainer("gestionUtilisateur")
    .resolve("habilitationService")
    .recupererHabilitations(session);
  habilitations.verifierAutorisationLectureIndicateursNonAJour();
};

export const indicateursNonAJourRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    await verifierAcces(ctx.session);
    const jalon = getAnneeDateDeBascule(
      new Date(),
      configuration().dateBasculeAffichageValeursAnneePrecedente,
    );
    return getContainer("suiviIndicateurs")
      .resolve("listerIndicateursNonAJourQuery")
      .run(ctx.session.habilitations.lecture.chantiers, jalon);
  }),

  listerTerritoires: procédureProtégée
    .input(z.object({ indicateurId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await verifierAcces(ctx.session);
      return getContainer("suiviIndicateurs")
        .resolve("listerTerritoiresNonAJourQuery")
        .run(input.indicateurId, ctx.session.habilitations.lecture.chantiers);
    }),
});
```

> Vérifier le type de `ctx.session` dans `rapportHebdomadaire.ts` / `trpc.ts` et l'utiliser à la place de `Session` de next-auth s'il diffère.

- [ ] **Step 2: Enregistrer** — dans `routes.ts` : `import { indicateursNonAJourRouter } from "@/server/infrastructure/api/trpc/routes/indicateursNonAJour";` et `indicateursNonAJour: indicateursNonAJourRouter,` (ordre alphabétique, après `indicateur`). Dans `categorieLogRouteurTRPC.ts` : `indicateursNonAJour: "indicateur",` après `indicateur: "indicateur",`.

- [ ] **Step 3: Vérifier le typage et les tests du routeur**

Run: `pnpm tsc --noEmit -p . && pnpm vitest run src/server/infrastructure/api/trpc`
Expected: aucune erreur de type ; tests existants du dossier trpc PASS (le `Record<RouteurTRPC, …>` garantit que la catégorie est déclarée).

- [ ] **Step 4: Commit (sur accord)** — `feat(ppg): router tRPC des indicateurs non à jour`

---

### Task 7: Retard — seuils et badge

**Files:**
- Create: `apps/pilote-ppg/src/client/components/PageIndicateursAMettreAJour/retard.ts`
- Create: `apps/pilote-ppg/src/client/components/PageIndicateursAMettreAJour/BadgeRetard.tsx`

**Interfaces:**
- Produces: `type TonaliteRetard = "critique" | "alerte" | "faible" | "inconnu"` ; `tonaliteRetard(retardJours: number | null): TonaliteRetard` ; `libelleRetard(retardJours: number | null): string` ; `CLASSES_TONALITE_RETARD: Record<TonaliteRetard, { pastille: string; barre: string }>` ; composant `<BadgeRetard retardJours={number | null} />`.

- [ ] **Step 1: Implement `retard.ts`**

```ts
export const SEUIL_RETARD_ALERTE_JOURS = 21;
export const SEUIL_RETARD_CRITIQUE_JOURS = 60;

export type TonaliteRetard = "critique" | "alerte" | "faible" | "inconnu";

export const tonaliteRetard = (retardJours: number | null): TonaliteRetard => {
  if (retardJours === null) return "inconnu";
  if (retardJours >= SEUIL_RETARD_CRITIQUE_JOURS) return "critique";
  if (retardJours >= SEUIL_RETARD_ALERTE_JOURS) return "alerte";
  return "faible";
};

export const libelleRetard = (retardJours: number | null): string =>
  retardJours === null ? "—" : `${retardJours} j`;

export const CLASSES_TONALITE_RETARD: Record<
  TonaliteRetard,
  { pastille: string; barre: string }
> = {
  critique: { pastille: "bg-[#fff4f3] text-[#ce0500]", barre: "bg-[#ce0500]" },
  alerte: { pastille: "bg-[#fff4e6] text-[#b34000]", barre: "bg-[#fc5d00]" },
  faible: { pastille: "bg-[#fdf9ea] text-[#7a5500]", barre: "bg-[#c8aa39]" },
  inconnu: {
    pastille: "bg-dsfr-grey-925 text-dsfr-mention-grey",
    barre: "bg-dsfr-grey-625",
  },
};
```

> Tailwind 4 : si des tokens DSFR équivalents existent dans le thème (`grep -rn "error-950\|warning-950\|yellow-tournesol" src/**/*.css`), les préférer aux valeurs arbitraires, en gardant ces teintes (celles de la maquette).

- [ ] **Step 2: Implement `BadgeRetard.tsx`**

```tsx
import { clsxm } from "@/utils/clsxm";
import { CLASSES_TONALITE_RETARD, libelleRetard, tonaliteRetard } from "./retard";

export const BadgeRetard = ({ retardJours }: { retardJours: number | null }) => (
  <span
    className={clsxm(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
      CLASSES_TONALITE_RETARD[tonaliteRetard(retardJours)].pastille,
    )}
  >
    {libelleRetard(retardJours)}
  </span>
);
```

- [ ] **Step 3: Vérifier** — `pnpm eslint src/client/components/PageIndicateursAMettreAJour` — Expected: OK.

- [ ] **Step 4: Commit (sur accord)** — `feat(ppg): badge de retard des indicateurs`

---

### Task 8: Tableau « Non à jour » (react-table v9) et détail par territoire

**Files:**
- Create: `…/PageIndicateursAMettreAJour/useTableauIndicateursNonAJour.ts`
- Create: `…/PageIndicateursAMettreAJour/FiltresIndicateurs.tsx`
- Create: `…/PageIndicateursAMettreAJour/CarteChantier.tsx`
- Create: `…/PageIndicateursAMettreAJour/LigneIndicateur.tsx`
- Create: `…/PageIndicateursAMettreAJour/DetailTerritoires.tsx`
- Create: `…/PageIndicateursAMettreAJour/TableauIndicateursNonAJour.tsx`

(`…` = `apps/pilote-ppg/src/client/components`)

**Interfaces:**
- Consumes: `IndicateurNonAJour`, `TerritoireNonAJour` (Task 3), `api.indicateursNonAJour.listerTerritoires` (Task 6), `BadgeRetard`, `CLASSES_TONALITE_RETARD`, `tonaliteRetard` (Task 7).
- Produces:
  - `featuresIndicateursNonAJour` et `type LigneIndicateurNonAJour = Row<typeof featuresIndicateursNonAJour, IndicateurNonAJour>`.
  - `useTableauIndicateursNonAJour(indicateurs: IndicateurNonAJour[])` → `{ tableau; recherche: string; setRecherche(valeur: string): void; chantierFiltre: string | null; setChantierFiltre(chantierId: string | null): void; mailleFiltre: $Enums.Maille | null; setMailleFiltre(maille: $Enums.Maille | null): void; optionsChantiers: { id: string; nom: string }[] }`.
  - `<TableauIndicateursNonAJour indicateurs={IndicateurNonAJour[]} />`.

Contraintes react-table v9 (référence : `PageAccueil/PageChantiers/TableauChantiers/useTableauChantiers.tsx`, migré en #2432) :
- `useTable({ features, … })` remplace `useReactTable` ; les row models sont des slots de `tableFeatures(...)` (`createFilteredRowModel()`…), déclarés **après** les features dont ils dépendent ; `globalFilteringFeature` exige `columnFilteringFeature`.
- `createColumnHelper<typeof features, TData>()` ; filtres, agrégations et tris passés en fonctions importées (`filterFn_equalsString`, `filterFn_arrIncludes`, `aggregationFn_max`, `sortFn_basic`).
- Aucun slot `expandedRowModel` : `table_getExpandedRowModel` renvoie alors le modèle pré-déplié, donc `tableau.getRowModel().rows` = lignes de groupe triées (une par chantier), indicateurs dans `groupe.subRows`. `rowExpandingFeature` reste nécessaire pour `row.getIsExpanded()` / `row.getToggleExpandedHandler()`.

- [ ] **Step 1: Implement `useTableauIndicateursNonAJour.ts`**

```ts
import { useMemo, useState } from "react";
import {
  aggregationFn_max,
  columnFilteringFeature,
  columnGroupingFeature,
  createColumnHelper,
  createFilteredRowModel,
  createGroupedRowModel,
  createSortedRowModel,
  filterFn_arrIncludes,
  filterFn_equalsString,
  globalFilteringFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ExpandedState,
  type Row,
} from "@tanstack/react-table";
import { type $Enums } from "@prisma/client";
import type { IndicateurNonAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";

export const featuresIndicateursNonAJour = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  columnGroupingFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  filteredRowModel: createFilteredRowModel(),
  groupedRowModel: createGroupedRowModel(),
  sortedRowModel: createSortedRowModel(),
});

export type LigneIndicateurNonAJour = Row<
  typeof featuresIndicateursNonAJour,
  IndicateurNonAJour
>;

const normaliser = (texte: string) =>
  texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const columnHelper = createColumnHelper<
  typeof featuresIndicateursNonAJour,
  IndicateurNonAJour
>();

const colonnes = columnHelper.columns([
  columnHelper.accessor("chantierId", {
    id: "chantier",
    filterFn: filterFn_equalsString,
  }),
  columnHelper.accessor("nom", { id: "nom" }),
  columnHelper.accessor("mailles", {
    id: "mailles",
    filterFn: filterFn_arrIncludes,
    enableGlobalFilter: false,
  }),
  columnHelper.accessor((indicateur) => indicateur.retardMaxJours ?? undefined, {
    id: "retard",
    aggregationFn: aggregationFn_max,
    sortFn: sortFn_basic,
    sortUndefined: "last",
    enableGlobalFilter: false,
  }),
]);

export const useTableauIndicateursNonAJour = (
  indicateurs: IndicateurNonAJour[],
) => {
  const [recherche, setRecherche] = useState("");
  const [chantierFiltre, setChantierFiltre] = useState<string | null>(null);
  const [mailleFiltre, setMailleFiltre] = useState<$Enums.Maille | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const columnFilters = useMemo(
    () => [
      ...(chantierFiltre ? [{ id: "chantier", value: chantierFiltre }] : []),
      ...(mailleFiltre ? [{ id: "mailles", value: mailleFiltre }] : []),
    ],
    [chantierFiltre, mailleFiltre],
  );

  const optionsChantiers = useMemo(
    () =>
      [
        ...new Map(
          indicateurs.map((indicateur) => [indicateur.chantierId, indicateur.chantierNom]),
        ),
      ]
        .map(([id, nom]) => ({ id, nom }))
        .sort((gauche, droite) => gauche.nom.localeCompare(droite.nom)),
    [indicateurs],
  );

  const tableau = useTable({
    features: featuresIndicateursNonAJour,
    data: indicateurs,
    columns: colonnes,
    getRowId: (indicateur) => indicateur.indicateurId,
    state: {
      globalFilter: recherche,
      columnFilters,
      grouping: ["chantier"],
      sorting: [{ id: "retard", desc: true }],
      expanded,
    },
    globalFilterFn: (
      row: LigneIndicateurNonAJour,
      _columnId: string,
      texteRecherche: string,
    ) =>
      normaliser(`${row.original.indicateurId} ${row.original.nom}`).includes(
        normaliser(texteRecherche),
      ),
    onExpandedChange: setExpanded,
    getRowCanExpand: (row) => !row.getIsGrouped(),
    autoResetExpanded: false,
  });

  return {
    tableau,
    recherche,
    setRecherche,
    chantierFiltre,
    setChantierFiltre,
    mailleFiltre,
    setMailleFiltre,
    optionsChantiers,
  };
};
```

> Si le typage de `state` ou de `globalFilterFn` diffère en v9.2 (ex. `columnFilters` attendu en `ColumnFiltersState`), s'aligner sur `useEtatTableauAdmin.ts` et `useTableauChantiers.tsx`, qui sont la référence migrée.

- [ ] **Step 2: Implement `FiltresIndicateurs.tsx`**

```tsx
import { $Enums } from "@prisma/client";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import { SegmentedControl } from "@/components/shared/SegmentedControl";

const OPTIONS_MAILLE = [
  { valeur: "TOUTES", libelle: "Toutes" },
  { valeur: $Enums.Maille.NAT, libelle: "Nationale" },
  { valeur: $Enums.Maille.REG, libelle: "Régionale" },
  { valeur: $Enums.Maille.DEPT, libelle: "Départementale" },
] as const;

interface FiltresIndicateursProps {
  recherche: string;
  setRecherche(valeur: string): void;
  chantierFiltre: string | null;
  setChantierFiltre(chantierId: string | null): void;
  mailleFiltre: $Enums.Maille | null;
  setMailleFiltre(maille: $Enums.Maille | null): void;
  optionsChantiers: { id: string; nom: string }[];
}

export const FiltresIndicateurs = ({
  recherche,
  setRecherche,
  chantierFiltre,
  setChantierFiltre,
  mailleFiltre,
  setMailleFiltre,
  optionsChantiers,
}: FiltresIndicateursProps) => (
  <div className="flex flex-col gap-3 md:flex-row md:items-center">
    <div className="md:w-96">
      <BarreDeRecherche
        changementDeLaRechercheCallback={(event) => setRecherche(event.target.value)}
        valeur={recherche}
      />
    </div>
    <div className="fr-select-group fr-mb-0 md:w-72">
      <label className="fr-sr-only" htmlFor="filtre-chantier">
        Chantier
      </label>
      <select
        className="fr-select"
        id="filtre-chantier"
        onChange={(event) => setChantierFiltre(event.target.value || null)}
        value={chantierFiltre ?? ""}
      >
        <option value="">Tous mes chantiers</option>
        {optionsChantiers.map((chantier) => (
          <option key={chantier.id} value={chantier.id}>
            {chantier.nom}
          </option>
        ))}
      </select>
    </div>
    <SegmentedControl.Root
      aria-label="Filtrer par maille"
      className="overflow-x-auto md:ml-auto"
      onValueChange={(valeur) => {
        if (!valeur) return;
        setMailleFiltre(valeur === "TOUTES" ? null : (valeur as $Enums.Maille));
      }}
      type="single"
      value={mailleFiltre ?? "TOUTES"}
    >
      {OPTIONS_MAILLE.map((option) => (
        <SegmentedControl.Item key={option.valeur} value={option.valeur}>
          {option.libelle}
        </SegmentedControl.Item>
      ))}
    </SegmentedControl.Root>
  </div>
);
```

- [ ] **Step 3: Implement `DetailTerritoires.tsx`**

```tsx
import api from "@/server/infrastructure/api/trpc/api";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import type { IndicateurNonAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";
import { BadgeRetard } from "./BadgeRetard";

const LIBELLES_MAILLE = { NAT: "National", REG: "Régional", DEPT: "Départemental" } as const;

const formaterDate = (dateISO: string | null) =>
  dateISO ? PiloteDateFormatter.isoDateFranceMetropolitaine(dateISO) : "—";

const GRILLE = "md:grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] md:gap-3 md:items-center";

const ListeTerritoires = ({ indicateurId }: { indicateurId: string }) => {
  const { data: territoires, isPending, isError } =
    api.indicateursNonAJour.listerTerritoires.useQuery({ indicateurId });

  if (isPending) {
    return <p className="fr-text--sm fr-mb-0">Chargement des territoires…</p>;
  }
  if (isError) {
    return (
      <p className="fr-text--sm fr-mb-0 text-dsfr-error-425">
        Le détail par territoire n'a pas pu être chargé.
      </p>
    );
  }

  return (
    <>
      <div aria-hidden className={`hidden px-3 text-xs font-bold text-dsfr-mention-grey ${GRILLE}`}>
        <span>Territoire</span>
        <span>Maille</span>
        <span>Dernière valeur</span>
        <span>MAJ attendue</span>
        <span>Retard</span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {territoires.map((territoire) => (
          <li
            className={`flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm ${GRILLE}`}
            key={territoire.code}
          >
            <span className="flex-1 font-medium">{territoire.nom}</span>
            <span className="text-dsfr-mention-grey max-md:hidden">{LIBELLES_MAILLE[territoire.maille]}</span>
            <span className="max-md:hidden">{formaterDate(territoire.dateDerniereValeur)}</span>
            <span className="max-md:hidden">{formaterDate(territoire.dateMajAttendue)}</span>
            <BadgeRetard retardJours={territoire.retardJours} />
          </li>
        ))}
      </ul>
    </>
  );
};

export const DetailTerritoires = ({ indicateur }: { indicateur: IndicateurNonAJour }) => (
  <div className="mx-4 mb-5 flex flex-col gap-6 rounded-lg bg-gray-100 p-4 md:mx-6 md:flex-row md:p-5">
    <div className="flex flex-1 flex-col gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-dsfr-mention-grey">
        Territoires non à jour · triés par retard
      </span>
      <ListeTerritoires indicateurId={indicateur.indicateurId} />
    </div>
    <aside className="flex flex-col gap-4 md:w-72 md:border-l md:border-gray-300 md:pl-6">
      {indicateur.responsablesDonneesMails.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-dsfr-mention-grey">
            Responsable des données
          </span>
          {indicateur.responsablesDonneesMails.map((email) => (
            <a className="fr-link fr-text--sm break-all" href={`mailto:${email}`} key={email}>
              {email}
            </a>
          ))}
        </div>
      ) : null}
      {indicateur.delaiDisponibilite !== null ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-dsfr-mention-grey">
            Délai de disponibilité
          </span>
          <span className="fr-text--sm fr-mb-0">
            {indicateur.delaiDisponibilite} mois après la fin de période
          </span>
        </div>
      ) : null}
      <a className="fr-btn fr-btn--sm justify-center" href={`/chantier/${indicateur.chantierId}/indicateurs`}>
        Importer des valeurs
      </a>
    </aside>
  </div>
);
```

> Unité de `delai_disponibilite` : le dbt (`get_date_pro_maj_indic.sql`) fait `delai_disponibilite * INTERVAL '1 month'` → mois.

- [ ] **Step 4: Implement `LigneIndicateur.tsx`**

```tsx
import { Progress } from "@/components/shared/Progress";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { clsxm } from "@/utils/clsxm";
import { BadgeRetard } from "./BadgeRetard";
import { CLASSES_TONALITE_RETARD, tonaliteRetard } from "./retard";
import { DetailTerritoires } from "./DetailTerritoires";
import type { LigneIndicateurNonAJour } from "./useTableauIndicateursNonAJour";

const formaterDate = (dateISO: string | null) =>
  dateISO ? PiloteDateFormatter.isoDateFranceMetropolitaine(dateISO) : "—";

export const GRILLE_INDICATEUR =
  "md:grid md:grid-cols-[2.6fr_1.2fr_1.3fr_1fr_1fr_1fr_44px] md:gap-4 md:items-center";

export const LigneIndicateur = ({ ligne }: { ligne: LigneIndicateurNonAJour }) => {
  const indicateur = ligne.original;
  const estDeplie = ligne.getIsExpanded();

  return (
    <li className="border-t border-gray-200">
      <div className={clsxm("flex flex-col gap-3 px-4 py-4 md:px-6", GRILLE_INDICATEUR)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <a className="fr-link font-medium" href={`/chantier/${indicateur.chantierId}/indicateurs`}>
              {indicateur.nom}
            </a>
            <span className="text-xs text-dsfr-mention-grey">
              {indicateur.indicateurId}
              {indicateur.periodicite ? ` · ${indicateur.periodicite}` : ""}
            </span>
          </div>
          <span className="md:hidden">
            <BadgeRetard retardJours={indicateur.retardMaxJours} />
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {indicateur.mailles.map((maille) => (
            <span className="rounded bg-dsfr-blue-france-925 px-2 py-0.5 text-xs font-medium text-primary" key={maille}>
              {maille}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm">
            <strong>{indicateur.nbTerritoiresEnRetard}</strong>
            <span className="text-dsfr-mention-grey"> / {indicateur.nbTerritoiresApplicables} territoires</span>
          </span>
          <Progress
            aria-label="Part des territoires en retard"
            className="h-1.5 bg-gray-200"
            indicatorClassName={CLASSES_TONALITE_RETARD[tonaliteRetard(indicateur.retardMaxJours)].barre}
            max={indicateur.nbTerritoiresApplicables}
            value={indicateur.nbTerritoiresEnRetard}
          />
        </div>
        <span className="text-sm max-md:hidden">{formaterDate(indicateur.dateDerniereValeurPlusAncienne)}</span>
        <span className="text-sm max-md:hidden">{formaterDate(indicateur.dateMajAttenduePlusAncienne)}</span>
        <span className="max-md:hidden">
          <BadgeRetard retardJours={indicateur.retardMaxJours} />
        </span>
        <button
          aria-expanded={estDeplie}
          aria-label={`Afficher le détail par territoire de ${indicateur.nom}`}
          className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm justify-center max-md:w-full"
          onClick={() => ligne.getToggleExpandedHandler()()}
          type="button"
        >
          <span aria-hidden className={clsxm("fr-icon-arrow-down-s-line transition-transform", estDeplie && "rotate-180")} />
          <span className="fr-ml-1w md:hidden">{estDeplie ? "Masquer le détail" : "Voir le détail"}</span>
        </button>
      </div>
      {estDeplie ? <DetailTerritoires indicateur={indicateur} /> : null}
    </li>
  );
};
```

- [ ] **Step 5: Implement `CarteChantier.tsx`**

```tsx
import { useId } from "react";
import { Badge } from "@/components/_commons/Badge";
import { clsxm } from "@/utils/clsxm";
import { GRILLE_INDICATEUR, LigneIndicateur } from "./LigneIndicateur";
import type { LigneIndicateurNonAJour } from "./useTableauIndicateursNonAJour";

export const CarteChantier = ({ groupe }: { groupe: LigneIndicateurNonAJour }) => {
  const idTitre = useId();
  const { chantierId, chantierNom } = groupe.subRows[0].original;
  const nombre = groupe.subRows.length;

  return (
    <section aria-labelledby={idTitre} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 bg-gray-50 px-4 py-4 md:flex-row md:items-center md:px-6">
        <div className="flex flex-col gap-1 md:flex-1">
          <span className="text-xs text-dsfr-mention-grey">{chantierId}</span>
          <h2 className="fr-h6 fr-mb-0" id={idTitre}>
            {chantierNom}
          </h2>
        </div>
        <Badge type="rouge">
          {nombre} indicateur{nombre > 1 ? "s" : ""} non à jour
        </Badge>
        <a className="fr-link fr-text--sm" href={`/chantier/${chantierId}/NAT-FR`}>
          Voir le chantier
        </a>
      </div>
      <div aria-hidden className={clsxm("hidden px-6 py-2 text-xs font-bold text-dsfr-mention-grey", GRILLE_INDICATEUR)}>
        <span>Indicateur</span>
        <span>Mailles</span>
        <span>Territoires en retard</span>
        <span>Dernière valeur</span>
        <span>MAJ attendue</span>
        <span>Retard</span>
        <span />
      </div>
      <ul className="m-0 list-none p-0">
        {groupe.subRows.map((ligne) => (
          <LigneIndicateur key={ligne.id} ligne={ligne} />
        ))}
      </ul>
    </section>
  );
};
```

- [ ] **Step 6: Implement `TableauIndicateursNonAJour.tsx`**

```tsx
import type { IndicateurNonAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";
import { useTableauIndicateursNonAJour } from "./useTableauIndicateursNonAJour";
import { FiltresIndicateurs } from "./FiltresIndicateurs";
import { CarteChantier } from "./CarteChantier";

const TableauIndicateursNonAJour = ({ indicateurs }: { indicateurs: IndicateurNonAJour[] }) => {
  const { tableau, ...filtres } = useTableauIndicateursNonAJour(indicateurs);
  const groupes = tableau.getRowModel().rows;

  return (
    <div className="flex flex-col gap-5">
      <FiltresIndicateurs {...filtres} />
      {groupes.length === 0 ? (
        <p className="fr-text--sm text-dsfr-mention-grey">Aucun indicateur ne correspond à vos filtres.</p>
      ) : (
        groupes.map((groupe) => <CarteChantier groupe={groupe} key={groupe.id} />)
      )}
    </div>
  );
};

export default TableauIndicateursNonAJour;
```

- [ ] **Step 7: Vérifier** — `pnpm eslint src/client/components/PageIndicateursAMettreAJour && pnpm tsc --noEmit -p .` — Expected: OK.

- [ ] **Step 8: Commit (sur accord)** — `feat(ppg): tableau des indicateurs non à jour et détail territorial`

---

### Task 9: Onglet « À paramétrer » et état vide

**Files:**
- Create: `apps/pilote-ppg/src/client/components/PageIndicateursAMettreAJour/TableauAParametrer.tsx`
- Create: `apps/pilote-ppg/src/client/components/PageIndicateursAMettreAJour/EtatVide.tsx`

**Interfaces:**
- Consumes: `IndicateurAParametrer`.
- Produces: `<TableauAParametrer indicateurs={IndicateurAParametrer[]} jalon={number} />`, `<EtatVide titre={string} description={string} />`.

- [ ] **Step 1: Implement `TableauAParametrer.tsx`**

```tsx
import type { IndicateurAParametrer, ManqueParametrage } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";

const libelleManque = (manque: ManqueParametrage, jalon: number) =>
  manque === "VALEUR_INITIALE" ? "Valeur initiale" : `Cible ${jalon}`;

export const TableauAParametrer = ({
  indicateurs,
  jalon,
}: {
  indicateurs: IndicateurAParametrer[];
  jalon: number;
}) => (
  <div className="flex flex-col gap-5">
    <div className="fr-callout fr-mb-0">
      <p className="fr-callout__text fr-text--sm">
        Le taux d'avancement de ces indicateurs ne peut pas être calculé : il manque la valeur
        initiale ou la valeur cible {jalon} sur au moins un territoire applicable.
      </p>
    </div>
    <ul className="m-0 list-none overflow-hidden rounded-xl border border-gray-200 bg-white p-0">
      {indicateurs.map((indicateur) => (
        <li
          className="flex flex-col gap-2 border-t border-gray-200 px-4 py-4 first:border-t-0 md:grid md:grid-cols-[2.4fr_1.6fr_1.4fr_1fr_180px] md:items-center md:gap-4 md:px-6"
          key={indicateur.indicateurId}
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium">{indicateur.nom}</span>
            <span className="text-xs text-dsfr-mention-grey">{indicateur.indicateurId}</span>
          </div>
          <span className="text-sm">{indicateur.chantierNom}</span>
          <div className="flex flex-wrap gap-1">
            {indicateur.manques.map((manque) => (
              <span className="rounded-full bg-[#fdf9ea] px-2.5 py-0.5 text-xs font-bold text-[#7a5500]" key={manque}>
                {libelleManque(manque, jalon)}
              </span>
            ))}
          </div>
          <span className="text-sm">
            {indicateur.nbTerritoires} territoire{indicateur.nbTerritoires > 1 ? "s" : ""}
          </span>
          <a className="fr-link fr-text--sm md:justify-self-end" href={`/chantier/${indicateur.chantierId}/indicateurs`}>
            Compléter les valeurs
          </a>
        </li>
      ))}
    </ul>
  </div>
);
```

- [ ] **Step 2: Implement `EtatVide.tsx`**

```tsx
export const EtatVide = ({ titre, description }: { titre: string; description: string }) => (
  <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
    <span aria-hidden className="fr-icon-check-line flex h-16 w-16 items-center justify-center rounded-full bg-dsfr-green-emeraude-975 text-success" />
    <h2 className="fr-h5 fr-mb-0">{titre}</h2>
    <p className="fr-mb-0 max-w-xl text-dsfr-mention-grey">{description}</p>
    <a className="fr-btn fr-btn--secondary" href="/">
      Voir mes chantiers
    </a>
  </div>
);
```

- [ ] **Step 3: Vérifier** — `pnpm eslint src/client/components/PageIndicateursAMettreAJour && pnpm tsc --noEmit -p .` — Expected: OK.

- [ ] **Step 4: Commit (sur accord)** — `feat(ppg): onglet à paramétrer et état vide`

---

### Task 10: Page, accès et navigation

**Files:**
- Create: `apps/pilote-ppg/src/client/components/PageIndicateursAMettreAJour/PageIndicateursAMettreAJour.tsx`
- Create: `apps/pilote-ppg/src/pages/indicateurs-a-mettre-a-jour.tsx`
- Modify: `apps/pilote-ppg/src/client/components/_commons/MiseEnPage/Navigation/NavigationPilote.tsx`

**Interfaces:**
- Consumes: `api.indicateursNonAJour.lister`, composants Tasks 8–9, `Habilitation#estAutoriseAAccederAuxIndicateursNonAJour`.

- [ ] **Step 1: Implement `PageIndicateursAMettreAJour.tsx`**

```tsx
import { Suspense } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import { clsxm } from "@/utils/clsxm";
import TableauIndicateursNonAJour from "./TableauIndicateursNonAJour";
import { TableauAParametrer } from "./TableauAParametrer";
import { EtatVide } from "./EtatVide";

const ONGLETS = ["non-a-jour", "a-parametrer"] as const;

const Contenu = ({ jalon }: { jalon: number }) => {
  const [onglet, setOnglet] = useQueryState(
    "onglet",
    parseAsStringLiteral(ONGLETS).withDefault("non-a-jour"),
  );
  const [{ nonAJour, aParametrer }] = api.indicateursNonAJour.lister.useSuspenseQuery();

  const onglets = [
    { id: "non-a-jour", libelle: "Non à jour", nombre: nonAJour.length },
    { id: "a-parametrer", libelle: "À paramétrer", nombre: aParametrer.length },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 border-b border-gray-200" role="tablist">
        {onglets.map((item) => {
          const actif = onglet === item.id;
          return (
            <button
              aria-selected={actif}
              className={clsxm(
                "-mb-px flex h-12 items-center gap-2 border-b-[3px] px-1 text-base",
                actif ? "border-primary font-bold text-primary" : "border-transparent font-medium",
              )}
              key={item.id}
              onClick={() => setOnglet(item.id)}
              role="tab"
              type="button"
            >
              {item.libelle}
              <span className={clsxm("rounded-full px-2 text-xs font-bold", actif ? "bg-primary text-white" : "bg-gray-200")}>
                {item.nombre}
              </span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel">
        {onglet === "non-a-jour" ? (
          nonAJour.length === 0 ? (
            <EtatVide
              description="Aucun indicateur de vos chantiers n'attend de nouvelle valeur pour le moment."
              titre="Tous vos indicateurs sont à jour"
            />
          ) : (
            <TableauIndicateursNonAJour indicateurs={nonAJour} />
          )
        ) : aParametrer.length === 0 ? (
          <EtatVide
            description="Tous les indicateurs de vos chantiers ont une valeur initiale et une cible pour l'année."
            titre="Aucun indicateur à paramétrer"
          />
        ) : (
          <TableauAParametrer indicateurs={aParametrer} jalon={jalon} />
        )}
      </div>
    </div>
  );
};

const PageIndicateursAMettreAJour = ({ jalon }: { jalon: number }) => (
  <main>
    <div className="bg-dsfr-blue-france-975">
      <div className="fr-container flex flex-col gap-3 py-8">
        <FilAriane libelléPageCourante="Mes indicateurs à mettre à jour" />
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Suivi hebdomadaire</span>
        <h1 className="fr-h2 fr-mb-0">Mes indicateurs à mettre à jour</h1>
        <p className="fr-mb-0 max-w-3xl">
          Retrouvez le détail, territoire par territoire, des indicateurs de vos chantiers dont la
          dernière valeur n'est plus à jour, et de ceux dont le taux d'avancement ne peut pas être calculé.
        </p>
        <span className="fr-text--xs fr-mb-0 text-dsfr-mention-grey">
          Retard = jours écoulés depuis la date de mise à jour attendue
        </span>
      </div>
    </div>
    <div className="fr-container py-8">
      <Suspense fallback={<p className="fr-text--sm">Chargement des indicateurs…</p>}>
        <Contenu jalon={jalon} />
      </Suspense>
    </div>
  </main>
);

export default PageIndicateursAMettreAJour;
```

- [ ] **Step 2: Implement `pages/indicateurs-a-mettre-a-jour.tsx`**

```tsx
import { type GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { getContainer } from "@/server/dependances";
import { configuration } from "@/config";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import PageIndicateursAMettreAJour from "@/client/components/PageIndicateursAMettreAJour/PageIndicateursAMettreAJour";

interface Props {
  jalon: number;
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const session = await auth(context);
  const redirectionAccueil = { redirect: { destination: "/", permanent: false } };

  if (!session) {
    return redirectionAccueil;
  }

  const featureFlips = await getContainer("legacy")
    .resolve("recupererFeatureFlipsUseCase")
    .run();
  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });

  if (
    !featureFlips["NEXT_PUBLIC_FF_PAGE_INDICATEURS_NON_A_JOUR"] ||
    !habilitation.estAutoriseAAccederAuxIndicateursNonAJour()
  ) {
    return redirectionAccueil;
  }

  return {
    props: {
      jalon: getAnneeDateDeBascule(
        new Date(),
        configuration().dateBasculeAffichageValeursAnneePrecedente,
      ),
    },
  };
};

export default function IndicateursAMettreAJourPage({ jalon }: Props) {
  return <PageIndicateursAMettreAJour jalon={jalon} />;
}
```

- [ ] **Step 3: Navigation** — dans `NavigationPilote.tsx`, ajouter à côté de `estAutoriseAAccederAuxRapportsHebdomadaires` :

```ts
const estAutoriseAAccederAuxIndicateursNonAJour = (session: Session | null) => {
  if (!session) {
    return false;
  }
  return new HabilitationGestionUtilisateur({
    habilitations: session.habilitations,
    profil: session.profil,
  }).estAutoriseAAccederAuxIndicateursNonAJour();
};
```

dans le composant, près de `ffRapportCoordinateurs` :

```ts
  const ffPageIndicateursNonAJour = useEnv("NEXT_PUBLIC_FF_PAGE_INDICATEURS_NON_A_JOUR");
```

et après l'entrée « Mes rapports » :

```ts
        {
          nom: "Mes indicateurs à mettre à jour",
          lien: "/indicateurs-a-mettre-a-jour",
          matcher: "/indicateurs-a-mettre-a-jour",
          accessible:
            estAutoriseAAccederAuxIndicateursNonAJour(session) &&
            ffPageIndicateursNonAJour,
          prefetch: false,
          target: "_self",
        },
```

- [ ] **Step 4: Vérifier**

Run: `pnpm lint && pnpm test:unit && pnpm test:server:integration`
Expected: lint (ESLint, TypeScript, Stylelint) OK, tous les tests PASS. Si un test existant de `NavigationPilote` casse à cause de la nouvelle variable `useEnv`, mocker la variable dans ce test (pas de nouveau test front).

- [ ] **Step 5: Vérification manuelle (proposer à l'utilisateur)** — activer `NEXT_PUBLIC_FF_PAGE_INDICATEURS_NON_A_JOUR=true`, `pnpm dev`, se connecter avec un profil `EQUIPE_DIR_PROJET` puis `DITP_PILOTAGE` : la page est accessible pour le premier, redirige pour le second. Vérifier aussi : groupes de chantiers triés par retard max, indicateur au retard inconnu (« — ») en fin de carte, filtre maille + recherche qui vident un chantier (la carte disparaît, message « Aucun indicateur ne correspond à vos filtres. »), dépliage qui charge le détail.

- [ ] **Step 6: Proposer les E2E** — demander à l'utilisateur s'il faut lancer `pnpm test:e2e`.

- [ ] **Step 7: Commit (sur accord)** — `feat(ppg): page mes indicateurs à mettre à jour`
