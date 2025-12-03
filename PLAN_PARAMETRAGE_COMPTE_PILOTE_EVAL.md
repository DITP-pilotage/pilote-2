# Plan - Paramétrage de compte Pilote Eval

## Vue d'ensemble

Créer une interface de gestion des utilisateurs Pilote Eval permettant aux DITP-ADMIN d'attribuer et configurer les droits d'accès granulaires pour :
- Auto-évaluation (par territoire)
- Consolidation (par territoire)
- Instruction - Objectifs (par territoire)
- Instruction - Manière de servir (par axe)

## Étape 1 : Page de recensement des comptes Pilote Eval

### 1.1 Créer la page `/evaluation/utilisateurs`

**Fichier à créer** : `src/pages/evaluation/utilisateurs/index.tsx`

**Contenu** :
- Page protégée nécessitant l'accès à PILOTE_EVAL_PILOTAGE
- Layout utilisant le composant MiseEnPagePiloteEval
- Titre de la page : "Gestion des utilisateurs Pilote Eval"
- Tableau affichant la liste des utilisateurs
- Navigation vers la page de détail au clic sur une ligne

**Structure de la page** :
```typescript
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { configurationFeatureFlip } from "@/config";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  assert(session);

  const featureFlipping = configurationFeatureFlip();
  const container = getContainer("piloteEval");

  // Vérifier que l'utilisateur a accès au pilotage
  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL_PILOTAGE,
    )
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  const utilisateurs = await container
    .resolve("listerUtilisateursPiloteEval")
    .run();

  return {
    props: {
      utilisateurs,
    },
  };
};

export default function UtilisateursPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  // Implémenter l'affichage du tableau
}
```

**Colonnes du tableau** :
- Email
- Nom
- Prénom
- Profil (code du profil)

**Gestion des clics** :
- Ligne cliquable redirigeant vers `/evaluation/utilisateur/${utilisateur.id}`
- Utiliser `useRouter` de Next.js pour la navigation

### 1.2 Ajouter la navigation vers cette page

**Fichier à modifier** : `src/client/components/_commons/MiseEnPage/Navigation/NavigationPiloteEval.tsx`

**Modifications** :
- Ajouter un nouvel item dans l'array `pages` :
  ```typescript
  {
    nom: "Utilisateurs",
    lien: "/evaluation/utilisateurs",
    matcher: "/evaluation/utilisateurs",
    accessible: droitsPiloteEval?.peutAccederPilotage ?? false,
    prefetch: true,
    target: "_self",
  }
  ```

**Note** : L'accès sera réservé aux utilisateurs ayant le droit `peutAccederPilotage`

### 1.3 Créer la Query class pour récupérer les utilisateurs Pilote Eval

#### 1.3.1 Tests d'intégration (à créer en premier - RED)

**Fichier à créer** : `src/server/evaluation/queries/ListerUtilisateursPiloteEval.integration.test.ts`

**Scénarios de test** (en français) :

```typescript
import { ListerUtilisateursPiloteEval } from './ListerUtilisateursPiloteEval';
import { PrismaPilote } from '@/server/db/PrismaPilote';
import { $Enums } from '@prisma/client';

describe('ListerUtilisateursPiloteEval', () => {
  let prisma: PrismaPilote;
  let query: ListerUtilisateursPiloteEval;

  beforeEach(() => {
    prisma = new PrismaPilote();
    query = new ListerUtilisateursPiloteEval({ prisma });
  });

  describe('QUAND on récupère la liste des utilisateurs Pilote Eval', () => {
    it('ALORS retourne uniquement les utilisateurs ayant PILOTE_EVAL dans applications_accessibles', async () => {
      // GIVEN: 4 utilisateurs
      // - utilisateur1: PILOTE_EVAL
      // - utilisateur2: PILOTE_EVAL_PILOTAGE
      // - utilisateur3: PILOTE uniquement
      // - utilisateur4: PILOTE_EVAL

      // WHEN
      const resultat = await query.run();

      // THEN
      expect(resultat).toHaveLength(3);
      expect(resultat).toEqual([
        expect.objectContaining({ email: 'utilisateur1@example.com' }),
        expect.objectContaining({ email: 'utilisateur2@example.com' }),
        expect.objectContaining({ email: 'utilisateur4@example.com' }),
      ]);
    });

    it('ALORS retourne les champs id, email, nom, prenom, profilCode', async () => {
      // GIVEN: un utilisateur avec PILOTE_EVAL

      // WHEN
      const resultat = await query.run();

      // THEN
      expect(resultat[0]).toEqual({
        id: expect.any(String),
        email: expect.any(String),
        nom: expect.any(String),
        prenom: expect.any(String),
        profilCode: expect.any(String),
      });
    });

    it('ALORS exclut les utilisateurs désactivés', async () => {
      // GIVEN: 2 utilisateurs avec PILOTE_EVAL
      // - utilisateur1: actif
      // - utilisateur2: date_desactivation renseignée

      // WHEN
      const resultat = await query.run();

      // THEN
      expect(resultat).toHaveLength(1);
      expect(resultat[0].email).toBe('utilisateur1@example.com');
    });

    it('ALORS trie les résultats par nom puis prénom (ordre alphabétique)', async () => {
      // GIVEN: 3 utilisateurs avec PILOTE_EVAL
      // - Dupont Alice
      // - Dupont Bernard
      // - Alain Zoé

      // WHEN
      const resultat = await query.run();

      // THEN
      expect(resultat[0]).toEqual(expect.objectContaining({ nom: 'Alain', prenom: 'Zoé' }));
      expect(resultat[1]).toEqual(expect.objectContaining({ nom: 'Dupont', prenom: 'Alice' }));
      expect(resultat[2]).toEqual(expect.objectContaining({ nom: 'Dupont', prenom: 'Bernard' }));
    });

    it('ALORS retourne un tableau vide si aucun utilisateur n\'a accès à PILOTE_EVAL', async () => {
      // GIVEN: uniquement des utilisateurs avec PILOTE

      // WHEN
      const resultat = await query.run();

      // THEN
      expect(resultat).toEqual([]);
    });
  });
});
```

**Setup des tests** :
- Créer des utilisateurs de test dans la base avec différents `applications_accessibles`
- Nettoyer la base après chaque test
- S'assurer que les tests soient **ROUGES** avant de commencer l'implémentation

#### 1.3.2 Implémentation de la Query class

**Fichier à créer** : `src/server/evaluation/queries/ListerUtilisateursPiloteEval.ts`

**Code** :
```typescript
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type UtilisateurPiloteEval = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profilCode: string;
};

export class ListerUtilisateursPiloteEval {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run(): Promise<UtilisateurPiloteEval[]> {
    return await this.dependencies.prisma
      .getInstance()
      .utilisateur.findMany({
        where: {
          date_desactivation: null,
          applications_accessibles: {
            hasSome: [
              $Enums.application_accessible.PILOTE_EVAL,
              $Enums.application_accessible.PILOTE_EVAL_PILOTAGE,
            ],
          },
        },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          profilCode: true,
        },
        orderBy: [
          { nom: 'asc' },
          { prenom: 'asc' },
        ],
      });
  }
}
```

**Logique de la query** :
1. Récupérer tous les utilisateurs où :
   - `date_desactivation IS NULL`
   - `applications_accessibles` contient `PILOTE_EVAL` ou `PILOTE_EVAL_PILOTAGE`
2. Trier par nom, prénom (ordre alphabétique)
3. Retourner uniquement les champs nécessaires

#### 1.3.3 Enregistrer la Query dans le conteneur Awilix

**Fichier à modifier** : `src/server/evaluation/container.ts`

**Modifications** :

1. Ajouter l'import :
```typescript
import { ListerUtilisateursPiloteEval } from "@/server/evaluation/queries/ListerUtilisateursPiloteEval";
```

2. Ajouter dans le type `PiloteEvalDependencies` (ligne 27) :
```typescript
export type PiloteEvalDependencies = {
  // ... autres dépendances
  listerUtilisateursPiloteEval: ListerUtilisateursPiloteEval;
};
```

3. Enregistrer dans le conteneur (dans la fonction `getPiloteEvalContainer`, ligne 56) :
```typescript
export const getPiloteEvalContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<PiloteEvalDependencies> => {
  return initialContainer.createScope<PiloteEvalDependencies>().register({
    // ... autres enregistrements
    listerUtilisateursPiloteEval: asClass(ListerUtilisateursPiloteEval),
  });
};
```

### 1.4 Implémenter l'affichage du tableau dans la page

**Fichier** : `src/pages/evaluation/utilisateurs/index.tsx`

**Implémentation complète** :

```typescript
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import Head from "next/head";
import { useRouter } from "next/router";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { configurationFeatureFlip } from "@/config";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  assert(session);

  const featureFlipping = configurationFeatureFlip();
  const container = getContainer("piloteEval");

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL_PILOTAGE,
    )
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  const utilisateurs = await container
    .resolve("listerUtilisateursPiloteEval")
    .run();

  return {
    props: {
      utilisateurs,
    },
  };
};

export default function UtilisateursPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const router = useRouter();

  return (
    <main className="py-6 pt-0">
      <Head>
        <title>PILOTE - Gestion des utilisateurs Pilote Eval</title>
      </Head>

      <div className="min-h-[60vh] py-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-6">
            <h1 className="!text-3xl font-bold mb-4">
              Gestion des utilisateurs Pilote Eval
            </h1>
          </header>

          {props.utilisateurs.length === 0 ? (
            <p className="text-gray-600">
              Aucun utilisateur n'a accès à Pilote Eval pour le moment.
            </p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2 text-left">Nom</th>
                  <th className="border p-2 text-left">Prénom</th>
                  <th className="border p-2 text-left">Profil</th>
                </tr>
              </thead>
              <tbody>
                {props.utilisateurs.map((utilisateur) => (
                  <tr
                    key={utilisateur.id}
                    onClick={() => router.push(`/evaluation/utilisateur/${utilisateur.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="border p-2">{utilisateur.email}</td>
                    <td className="border p-2">{utilisateur.nom}</td>
                    <td className="border p-2">{utilisateur.prenom}</td>
                    <td className="border p-2">{utilisateur.profilCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
```

**Points clés** :
- Récupération des utilisateurs via `getServerSideProps`
- Vérification des droits d'accès (PILOTE_EVAL_PILOTAGE requis)
- Affichage conditionnel si aucun utilisateur
- Tableau cliquable avec navigation au clic
- Styles basiques (à adapter selon le design system DSFR)

## Étape 2 : Page de détail utilisateur `/evaluation/utilisateur/[id]`

### 2.1 Créer la page vide

**Fichier à créer** : `src/pages/evaluation/utilisateur/[id].tsx`

**Contenu de base** :
- Page protégée nécessitant l'accès à PILOTE_EVAL_PILOTAGE
- Layout utilisant le même style que la page liste des utilisateurs
- Titre de la page : "Configuration des droits - [Nom de l'utilisateur]"
- `getServerSideProps` avec récupération de l'ID depuis les params
- Structure de base sans données pour l'instant

**Structure initiale** :
```typescript
export const getServerSideProps = async ({
  req,
  res,
  params,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  assert(session);

  const featureFlipping = configurationFeatureFlip();

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL_PILOTAGE,
    )
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  const utilisateurId = params?.id as string;

  // TODO: récupérer les données

  return {
    props: {
      utilisateurId,
    },
  };
};
```

### 2.2 Créer la query pour récupérer tous les critères

#### 2.2.1 Tests d'intégration (TDD - RED d'abord)

**Fichier à créer** : `src/server/evaluation/__tests__/queries/ListerCriteresPiloteEval.integration.test.ts`

**Scénarios de test** :
```typescript
describe("ListerCriteresPiloteEval", () => {
  describe("run", () => {
    it("retourne tous les critères actifs", async () => {
      // Given: 3 critères dans la base

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toHaveLength(3);
    });

    it("retourne les champs id, libelle, descriptif", async () => {
      // Given: un critère

      // When
      const resultat = await query.run();

      // Then
      expect(resultat[0]).toEqual({
        id: expect.any(String),
        libelle: expect.any(String),
        descriptif: expect.any(String),
      });
    });

    it("retourne les sous-critères associés à chaque critère", async () => {
      // Given: un critère avec 2 sous-critères

      // When
      const resultat = await query.run();

      // Then
      expect(resultat[0].sousCriteres).toHaveLength(2);
      expect(resultat[0].sousCriteres[0]).toEqual({
        id: expect.any(String),
        libelle: expect.any(String),
        descriptif: expect.any(String),
      });
    });

    it("retourne un tableau vide pour un critère sans sous-critères", async () => {
      // Given: un critère sans sous-critères

      // When
      const resultat = await query.run();

      // Then
      expect(resultat[0].sousCriteres).toEqual([]);
    });

    it("trie les critères par ordre de création", async () => {
      // Given: 3 critères créés à des dates différentes

      // When
      const resultat = await query.run();

      // Then: vérifier l'ordre
    });
  });
});
```

**Données du schéma Prisma** :
- Table : `referentiel_critere`
- Relation : `referentiel_sous_critere` (via `sous_criteres`)

#### 2.2.2 Implémentation de la query

**Fichier à créer** : `src/server/evaluation/queries/ListerCriteresPiloteEval.ts`

**Structure** :
```typescript
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type SousCritere = {
  id: string;
  libelle: string;
  descriptif: string;
};

export type CriterePiloteEval = {
  id: string;
  libelle: string;
  descriptif: string;
  sousCriteres: SousCritere[];
};

export class ListerCriteresPiloteEval {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run(): Promise<CriterePiloteEval[]> {
    const criteres = await this.dependencies.prisma
      .getInstance()
      .referentiel_critere.findMany({
        select: {
          id: true,
          libelle: true,
          descriptif: true,
          sous_criteres: {
            select: {
              id: true,
              libelle: true,
              descriptif: true,
            },
            orderBy: {
              created_at: "asc",
            },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      });

    return criteres.map((critere) => ({
      id: critere.id,
      libelle: critere.libelle,
      descriptif: critere.descriptif,
      sousCriteres: critere.sous_criteres,
    }));
  }
}
```

### 2.3 Créer la query pour récupérer tous les rattachements

#### 2.3.1 Tests d'intégration (TDD - RED d'abord)

**Fichier à créer** : `src/server/evaluation/__tests__/queries/ListerRattachementsPiloteEval.integration.test.ts`

**Scénarios de test** :
```typescript
describe("ListerRattachementsPiloteEval", () => {
  describe("run", () => {
    it("retourne tous les rattachements", async () => {
      // Given: 5 rattachements dans la base

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toHaveLength(5);
    });

    it("retourne les champs code, libelle, groupe, ordre", async () => {
      // Given: un rattachement

      // When
      const resultat = await query.run();

      // Then
      expect(resultat[0]).toEqual({
        code: expect.any(String),
        libelle: expect.any(String),
        groupe: expect.any(String),
        ordre: expect.any(Number),
      });
    });

    it("trie les rattachements par ordre croissant", async () => {
      // Given: 3 rattachements avec ordre 2, 1, 3

      // When
      const resultat = await query.run();

      // Then
      expect(resultat[0].ordre).toBe(1);
      expect(resultat[1].ordre).toBe(2);
      expect(resultat[2].ordre).toBe(3);
    });

    it("groupe les rattachements par groupe", async () => {
      // Given: rattachements avec différents groupes

      // When
      const resultat = await query.run();

      // Then: vérifier le regroupement
    });
  });
});
```

**Données du schéma Prisma** :
- Table : `referentiel_rattachement`

#### 2.3.2 Implémentation de la query

**Fichier à créer** : `src/server/evaluation/queries/ListerRattachementsPiloteEval.ts`

**Structure** :
```typescript
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type RattachementPiloteEval = {
  code: string;
  libelle: string;
  groupe: string;
  ordre: number;
};

export class ListerRattachementsPiloteEval {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run(): Promise<RattachementPiloteEval[]> {
    return await this.dependencies.prisma
      .getInstance()
      .referentiel_rattachement.findMany({
        select: {
          code: true,
          libelle: true,
          groupe: true,
          ordre: true,
        },
        orderBy: {
          ordre: "asc",
        },
      });
  }
}
```

### 2.4 Créer la query pour récupérer les objectifs groupés par rattachement

#### 2.4.1 Tests d'intégration (TDD - RED d'abord)

**Fichier à créer** : `src/server/evaluation/__tests__/queries/ListerObjectifsParRattachementPiloteEval.integration.test.ts`

**Scénarios de test** :
```typescript
describe("ListerObjectifsParRattachementPiloteEval", () => {
  describe("run", () => {
    it("retourne les objectifs groupés par rattachement", async () => {
      // Given: 2 rattachements avec objectifs

      // When
      const resultat = await query.run();

      // Then
      expect(Object.keys(resultat)).toHaveLength(2);
    });

    it("retourne les champs id, libelle, descriptif, indicateur_cible, jalon, tutelle pour chaque objectif", async () => {
      // Given: un objectif avec tutelle

      // When
      const resultat = await query.run();

      // Then
      const rattachementCode = Object.keys(resultat)[0];
      expect(resultat[rattachementCode][0]).toEqual({
        id: expect.any(String),
        libelle: expect.any(String),
        descriptif: expect.any(String),
        indicateur_cible: expect.any(String),
        jalon: expect.any(Number),
        tutelle: {
          id: expect.any(String),
          nom: expect.any(String),
        },
      });
    });

    it("retourne null pour la tutelle si l'objectif n'en a pas", async () => {
      // Given: un objectif sans tutelle

      // When
      const resultat = await query.run();

      // Then
      const rattachementCode = Object.keys(resultat)[0];
      expect(resultat[rattachementCode][0].tutelle).toBeNull();
    });

    it("trie les objectifs par jalon puis par ordre de création", async () => {
      // Given: objectifs avec différents jalons

      // When
      const resultat = await query.run();

      // Then: vérifier l'ordre
    });

    it("retourne un objet vide si aucun objectif", async () => {
      // Given: aucun objectif dans la base

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toEqual({});
    });
  });
});
```

**Données du schéma Prisma** :
- Table : `referentiel_objectif`
- Relation : `referentiel_rattachement` (via `rattachement_code`)
- Relation : `referentiel_tutelle` (via `tutelle_id`)

#### 2.4.2 Implémentation de la query

**Fichier à créer** : `src/server/evaluation/queries/ListerObjectifsParRattachementPiloteEval.ts`

**Structure** :
```typescript
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type Tutelle = {
  id: string;
  nom: string;
};

export type ObjectifPiloteEval = {
  id: string;
  libelle: string;
  descriptif: string;
  indicateur_cible: string;
  jalon: number;
  tutelle: Tutelle | null;
};

export type ObjectifsParRattachement = Record<string, ObjectifPiloteEval[]>;

export class ListerObjectifsParRattachementPiloteEval {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run(): Promise<ObjectifsParRattachement> {
    const objectifs = await this.dependencies.prisma
      .getInstance()
      .referentiel_objectif.findMany({
        select: {
          id: true,
          libelle: true,
          descriptif: true,
          indicateur_cible: true,
          jalon: true,
          rattachement_code: true,
          tutelle: {
            select: {
              id: true,
              nom: true,
            },
          },
        },
        orderBy: [
          { jalon: "asc" },
          { created_at: "asc" },
        ],
      });

    const objectifsParRattachement: ObjectifsParRattachement = {};

    for (const objectif of objectifs) {
      const rattachementCode = objectif.rattachement_code;

      if (!objectifsParRattachement[rattachementCode]) {
        objectifsParRattachement[rattachementCode] = [];
      }

      objectifsParRattachement[rattachementCode].push({
        id: objectif.id,
        libelle: objectif.libelle,
        descriptif: objectif.descriptif,
        indicateur_cible: objectif.indicateur_cible,
        jalon: objectif.jalon,
        tutelle: objectif.tutelle,
      });
    }

    return objectifsParRattachement;
  }
}
```

### 2.5 Enregistrer les queries dans le conteneur Awilix

**Fichier à modifier** : `src/server/evaluation/container.ts`

**Modifications** :

1. Ajouter les imports :
```typescript
import { ListerCriteresPiloteEval } from "@/server/evaluation/queries/ListerCriteresPiloteEval";
import { ListerRattachementsPiloteEval } from "@/server/evaluation/queries/ListerRattachementsPiloteEval";
import { ListerObjectifsParRattachementPiloteEval } from "@/server/evaluation/queries/ListerObjectifsParRattachementPiloteEval";
```

2. Ajouter dans le type `PiloteEvalDependencies` :
```typescript
listerCriteresPiloteEval: ListerCriteresPiloteEval;
listerRattachementsPiloteEval: ListerRattachementsPiloteEval;
listerObjectifsParRattachementPiloteEval: ListerObjectifsParRattachementPiloteEval;
```

3. Enregistrer dans le conteneur :
```typescript
listerCriteresPiloteEval: asClass(ListerCriteresPiloteEval),
listerRattachementsPiloteEval: asClass(ListerRattachementsPiloteEval),
listerObjectifsParRattachementPiloteEval: asClass(ListerObjectifsParRattachementPiloteEval),
```

### 2.6 Récupérer les données dans getServerSideProps

**Fichier à modifier** : `src/pages/evaluation/utilisateur/[id].tsx`

**Modifications dans getServerSideProps** :

```typescript
const utilisateurId = params?.id as string;

const container = getContainer("piloteEval");

const [criteres, rattachements, objectifsParRattachement] = await Promise.all([
  container.resolve("listerCriteresPiloteEval").run(),
  container.resolve("listerRattachementsPiloteEval").run(),
  container.resolve("listerObjectifsParRattachementPiloteEval").run(),
]);

return {
  props: {
    utilisateurId,
    criteres,
    rattachements,
    objectifsParRattachement,
  },
};
```

**Affichage dans la page** :
- Afficher les informations de l'utilisateur (à récupérer dans une étape ultérieure)
- Afficher les sections pour configurer les droits :
  - Auto-évaluation (sélection de territoires)
  - Consolidation (sélection de territoires)
  - Instruction - Objectifs (sélection de territoires)
  - Instruction - Manière de servir (sélection d'axes)

## Étape 3 : Formulaire de configuration des droits avec React Hook Form

### Vue d'ensemble

Créer un formulaire interactif permettant de configurer les droits d'un utilisateur pour :
- Auto-évaluation (sélection de rattachements)
- Consolidation (sélection de rattachements)
- Instruction - Objectifs (sélection de rattachements)
- Instruction - Manière de servir (sélection de critères)

Le formulaire utilisera React Hook Form pour la gestion d'état et le composant MultiSelect existant pour les sélections multiples.

### 3.1 Définir le schéma de validation avec Zod

**Fichier à créer** : `src/validation/parametrageUtilisateurPiloteEval.ts`

**Structure** :
```typescript
import { z } from "zod";

export const parametrageUtilisateurPiloteEvalSchema = z.object({
  autoEvaluation: z.object({
    rattachementCodes: z.array(z.string()),
  }),
  consolidation: z.object({
    rattachementCodes: z.array(z.string()),
  }),
  instructionObjectifs: z.object({
    rattachementCodes: z.array(z.string()),
  }),
  instructionManiereDeServir: z.object({
    critereCodes: z.array(z.string()),
  }),
});

export type ParametrageUtilisateurPiloteEvalFormulaire = z.infer<
  typeof parametrageUtilisateurPiloteEvalSchema
>;
```

### 3.2 Initialiser React Hook Form dans la page

**Fichier à modifier** : `src/pages/evaluation/utilisateur/[id].tsx`

**Modifications** :

1. Ajouter les imports :
```typescript
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  parametrageUtilisateurPiloteEvalSchema,
  ParametrageUtilisateurPiloteEvalFormulaire,
} from "@/validation/parametrageUtilisateurPiloteEval";
import MultiSelect from "@/components/_commons/MultiSelectNew/MultiSelect";
```

2. Initialiser le formulaire :
```typescript
const {
  control,
  handleSubmit,
  formState: { errors },
} = useForm<ParametrageUtilisateurPiloteEvalFormulaire>({
  resolver: zodResolver(parametrageUtilisateurPiloteEvalSchema),
  defaultValues: {
    autoEvaluation: {
      rattachementCodes: [],
    },
    consolidation: {
      rattachementCodes: [],
    },
    instructionObjectifs: {
      rattachementCodes: [],
    },
    instructionManiereDeServir: {
      critereCodes: [],
    },
  },
});
```

3. Créer le handler de soumission (vide pour l'instant) :
```typescript
const onSubmit = (data: ParametrageUtilisateurPiloteEvalFormulaire) => {
  console.log("Données du formulaire :", data);
  // TODO: implémenter la sauvegarde
};
```

### 3.3 Préparer les données pour les MultiSelect

**Dans le composant de la page** :

1. Transformer les rattachements en options groupées par groupe :
```typescript
const rattachementsParGroupe = rattachements.reduce(
  (acc, rattachement) => {
    if (!acc[rattachement.groupe]) {
      acc[rattachement.groupe] = [];
    }
    acc[rattachement.groupe].push({
      value: rattachement.code,
      label: rattachement.libelle,
    });
    return acc;
  },
  {} as Record<string, { value: string; label: string }[]>
);

const optionsRattachementsGroupées = Object.entries(rattachementsParGroupe).map(
  ([groupe, options]) => ({
    label: groupe,
    options,
  })
);
```

2. Transformer les critères en options :
```typescript
const optionsCritèresGroupées = [
  {
    label: "Critères",
    options: criteres.map((critere) => ({
      value: critere.id,
      label: critere.libelle,
    })),
  },
];
```

3. Transformer les objectifs par rattachement en options :
```typescript
const optionsObjectifsGroupées = Object.entries(objectifsParRattachement).map(
  ([rattachementCode, objectifs]) => {
    const rattachement = rattachements.find((r) => r.code === rattachementCode);
    return {
      label: rattachement?.libelle || rattachementCode,
      options: objectifs.map((objectif) => ({
        value: rattachementCode, // On sélectionne le rattachement, pas l'objectif individuel
        label: objectif.libelle,
      })),
    };
  }
);
```

### 3.4 Intégrer les MultiSelect avec React Hook Form

**Pour chaque section du formulaire** :

#### Section Auto-évaluation

```typescript
<section className="bg-white p-6 rounded shadow-sm">
  <h2 className="!text-2xl font-semibold mb-4">Auto-évaluation</h2>
  <p className="text-gray-600 mb-4">
    Sélection des territoires pour l'auto-évaluation
  </p>

  <Controller
    control={control}
    name="autoEvaluation.rattachementCodes"
    render={({ field }) => (
      <MultiSelect
        afficherBoutonsSélection
        changementValeursSélectionnéesCallback={field.onChange}
        label="Sélectionner les territoires"
        optionsGroupées={optionsRattachementsGroupées}
        suffixeLibellé="territoire(s)"
        valeursSélectionnéesParDéfaut={field.value}
      />
    )}
  />
  {errors.autoEvaluation?.rattachementCodes && (
    <p className="text-red-500 text-sm mt-2">
      {errors.autoEvaluation.rattachementCodes.message}
    </p>
  )}
</section>
```

#### Section Consolidation

```typescript
<section className="bg-white p-6 rounded shadow-sm">
  <h2 className="!text-2xl font-semibold mb-4">Consolidation</h2>
  <p className="text-gray-600 mb-4">
    Sélection des territoires pour la consolidation
  </p>

  <Controller
    control={control}
    name="consolidation.rattachementCodes"
    render={({ field }) => (
      <MultiSelect
        afficherBoutonsSélection
        changementValeursSélectionnéesCallback={field.onChange}
        label="Sélectionner les territoires"
        optionsGroupées={optionsRattachementsGroupées}
        suffixeLibellé="territoire(s)"
        valeursSélectionnéesParDéfaut={field.value}
      />
    )}
  />
  {errors.consolidation?.rattachementCodes && (
    <p className="text-red-500 text-sm mt-2">
      {errors.consolidation.rattachementCodes.message}
    </p>
  )}
</section>
```

#### Section Instruction - Objectifs

```typescript
<section className="bg-white p-6 rounded shadow-sm">
  <h2 className="!text-2xl font-semibold mb-4">Instruction - Objectifs</h2>
  <p className="text-gray-600 mb-4">
    Sélection des territoires pour l'instruction des objectifs
  </p>

  <Controller
    control={control}
    name="instructionObjectifs.rattachementCodes"
    render={({ field }) => (
      <MultiSelect
        afficherBoutonsSélection
        changementValeursSélectionnéesCallback={field.onChange}
        label="Sélectionner les territoires"
        optionsGroupées={optionsRattachementsGroupées}
        suffixeLibellé="territoire(s)"
        valeursSélectionnéesParDéfaut={field.value}
      />
    )}
  />
  {errors.instructionObjectifs?.rattachementCodes && (
    <p className="text-red-500 text-sm mt-2">
      {errors.instructionObjectifs.rattachementCodes.message}
    </p>
  )}
</section>
```

#### Section Instruction - Manière de servir

```typescript
<section className="bg-white p-6 rounded shadow-sm">
  <h2 className="!text-2xl font-semibold mb-4">
    Instruction - Manière de servir
  </h2>
  <p className="text-gray-600 mb-4">
    Sélection des critères pour l'instruction de la manière de servir
  </p>

  <Controller
    control={control}
    name="instructionManiereDeServir.critereCodes"
    render={({ field }) => (
      <MultiSelect
        afficherBoutonsSélection
        changementValeursSélectionnéesCallback={field.onChange}
        label="Sélectionner les critères"
        optionsGroupées={optionsCritèresGroupées}
        suffixeLibellé="critère(s)"
        valeursSélectionnéesParDéfaut={field.value}
      />
    )}
  />
  {errors.instructionManiereDeServir?.critereCodes && (
    <p className="text-red-500 text-sm mt-2">
      {errors.instructionManiereDeServir.critereCodes.message}
    </p>
  )}
</section>
```

### 3.5 Ajouter un bouton de test (sans soumission)

**Ajouter après les sections** :

```typescript
<div className="flex justify-end mt-6">
  <button
    className="fr-btn"
    onClick={handleSubmit(onSubmit)}
    type="button"
  >
    Enregistrer la configuration
  </button>
</div>
```

**Note** : Pour l'instant, le bouton affichera juste les données dans la console.

### 3.6 Wrapper le tout dans un formulaire

**Encapsuler les sections dans une balise form** :

```typescript
<form onSubmit={handleSubmit(onSubmit)}>
  <div className="space-y-6">
    {/* Toutes les sections ici */}
  </div>

  <div className="flex justify-end mt-6">
    <button className="fr-btn" type="submit">
      Enregistrer la configuration
    </button>
  </div>
</form>
```

### Points d'attention

- ✅ Utiliser `Controller` de React Hook Form pour chaque MultiSelect
- ✅ Transformer les données en format attendu par MultiSelect (`optionsGroupées`)
- ✅ Afficher les erreurs de validation sous chaque champ
- ✅ Le bouton "Enregistrer" affichera les données dans la console (pas de sauvegarde pour l'instant)
- ✅ Utiliser `afficherBoutonsSélection` pour permettre "Tout sélectionner" / "Tout désélectionner"
- ✅ Les valeurs par défaut sont des tableaux vides (pas de droits pré-sélectionnés)

### Structure du formulaire

```typescript
{
  autoEvaluation: {
    rattachementCodes: ["REG-01", "REG-02"]
  },
  consolidation: {
    rattachementCodes: ["REG-01"]
  },
  instructionObjectifs: {
    rattachementCodes: ["REG-02", "DROM-01"]
  },
  instructionManiereDeServir: {
    critereCodes: ["critere-id-1", "critere-id-2"]
  }
}
```

## Étape 4 : Récupération des droits existants de l'utilisateur

### Contexte

Les droits d'un utilisateur sont stockés dans la table `rattachement_utilisateur_etape_jalon` qui fait le lien entre :
- Un utilisateur (`utilisateur_id`)
- Un rattachement/territoire (`rattachement_code`)
- Une étape d'évaluation (`etape`: AUTO_EVALUATION, CONSOLIDATION, INSTRUCTION)
- Un jalon/année (`jalon`)

Pour l'instruction, les détails supplémentaires sont dans :
- `instruction_objectif` : liste des objectifs que l'utilisateur peut instruire
- `instruction_critere` : liste des critères que l'utilisateur peut instruire

### 4.1 Créer la query vide

**Fichier à créer** : `src/server/evaluation/queries/RecupererDroitsUtilisateurQuery.ts`

**Structure de base** :
```typescript
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type DroitsUtilisateur = {
  autoEvaluation: {
    rattachementCodes: string[];
  };
  consolidation: {
    rattachementCodes: string[];
  };
  instructionObjectifs: {
    rattachementCodes: string[];
  };
  instructionManiereDeServir: {
    critereCodes: string[];
  };
};

export class RecupererDroitsUtilisateurQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({
    utilisateurId,
    jalon,
  }: {
    utilisateurId: string;
    jalon: number;
  }): Promise<DroitsUtilisateur> {
    // À implémenter
    throw new Error("Not implemented");
  }
}
```

### 4.2 Créer les tests d'intégration (TDD - RED)

**Fichier à créer** : `src/server/evaluation/__tests__/queries/RecupererDroitsUtilisateurQuery.integration.test.ts`

**Scénarios de test** :

```typescript
import { describe, it, expect, beforeEach } from "@jest/globals";
import { RecupererDroitsUtilisateurQuery } from "@/server/evaluation/queries/RecupererDroitsUtilisateurQuery";
import { prisma } from "@/server/db/PrismaClient";
import { $Enums } from "@prisma/client";

describe("RecupererDroitsUtilisateurQuery", () => {
  let query: RecupererDroitsUtilisateurQuery;
  let utilisateurId: string;

  beforeEach(async () => {
    query = new RecupererDroitsUtilisateurQuery({ prisma });

    // Given: un utilisateur de test
    const utilisateur = await prisma.getInstance().utilisateur.create({
      data: {
        email: "test@example.com",
        nom: "Test",
        prenom: "User",
        profilCode: "DITP",
        applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
      },
    });
    utilisateurId = utilisateur.id;
  });

  describe("run", () => {
    it("retourne les rattachements pour AUTO_EVALUATION", async () => {
      // Given: 2 rattachements en auto-évaluation pour le jalon 2025
      await prisma.getInstance().rattachement_utilisateur_etape_jalon.create({
        data: {
          utilisateur_id: utilisateurId,
          rattachement_code: "REG-01",
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        },
      });
      await prisma.getInstance().rattachement_utilisateur_etape_jalon.create({
        data: {
          utilisateur_id: utilisateurId,
          rattachement_code: "REG-02",
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat.autoEvaluation.rattachementCodes).toEqual(
        expect.arrayContaining(["REG-01", "REG-02"])
      );
    });

    it("retourne les rattachements pour CONSOLIDATION", async () => {
      // Given: 1 rattachement en consolidation pour le jalon 2025
      await prisma.getInstance().rattachement_utilisateur_etape_jalon.create({
        data: {
          utilisateur_id: utilisateurId,
          rattachement_code: "REG-03",
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          jalon: 2025,
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat.consolidation.rattachementCodes).toEqual(["REG-03"]);
    });

    it("retourne les rattachements pour INSTRUCTION avec objectifs", async () => {
      // Given: 1 rattachement en instruction pour le jalon 2025
      const rattachementInstruction = await prisma
        .getInstance()
        .rattachement_utilisateur_etape_jalon.create({
          data: {
            utilisateur_id: utilisateurId,
            rattachement_code: "REG-04",
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            jalon: 2025,
          },
        });

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat.instructionObjectifs.rattachementCodes).toEqual([
        "REG-04",
      ]);
    });

    it("retourne les critères pour INSTRUCTION", async () => {
      // Given: 1 rattachement en instruction avec 2 critères
      const rattachementInstruction = await prisma
        .getInstance()
        .rattachement_utilisateur_etape_jalon.create({
          data: {
            utilisateur_id: utilisateurId,
            rattachement_code: "REG-05",
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            jalon: 2025,
          },
        });

      await prisma.getInstance().instruction_critere.create({
        data: {
          rattachement_utilisateur_etape_jalon_id: rattachementInstruction.id,
          critere_id: "critere-1",
        },
      });
      await prisma.getInstance().instruction_critere.create({
        data: {
          rattachement_utilisateur_etape_jalon_id: rattachementInstruction.id,
          critere_id: "critere-2",
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat.instructionManiereDeServir.critereCodes).toEqual(
        expect.arrayContaining(["critere-1", "critere-2"])
      );
    });

    it("ne retourne que les droits pour le jalon spécifié", async () => {
      // Given: des rattachements pour différents jalons
      await prisma.getInstance().rattachement_utilisateur_etape_jalon.create({
        data: {
          utilisateur_id: utilisateurId,
          rattachement_code: "REG-06",
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        },
      });
      await prisma.getInstance().rattachement_utilisateur_etape_jalon.create({
        data: {
          utilisateur_id: utilisateurId,
          rattachement_code: "REG-07",
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2024,
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat.autoEvaluation.rattachementCodes).toEqual(["REG-06"]);
      expect(resultat.autoEvaluation.rattachementCodes).not.toContain("REG-07");
    });

    it("retourne des tableaux vides si l'utilisateur n'a aucun droit", async () => {
      // Given: un utilisateur sans droits

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat).toEqual({
        autoEvaluation: {
          rattachementCodes: [],
        },
        consolidation: {
          rattachementCodes: [],
        },
        instructionObjectifs: {
          rattachementCodes: [],
        },
        instructionManiereDeServir: {
          critereCodes: [],
        },
      });
    });
  });
});
```

### 4.3 Implémenter la query

**Dans le fichier** : `src/server/evaluation/queries/RecupererDroitsUtilisateurQuery.ts`

**Logique d'implémentation** :

1. Récupérer tous les `rattachement_utilisateur_etape_jalon` pour l'utilisateur et le jalon
2. Filtrer par étape (AUTO_EVALUATION, CONSOLIDATION, INSTRUCTION)
3. Pour l'instruction, récupérer aussi les `instruction_critere` associés
4. Retourner la structure attendue

```typescript
async run({
  utilisateurId,
  jalon,
}: {
  utilisateurId: string;
  jalon: number;
}): Promise<DroitsUtilisateur> {
  const rattachements = await this.dependencies.prisma
    .getInstance()
    .rattachement_utilisateur_etape_jalon.findMany({
      where: {
        utilisateur_id: utilisateurId,
        jalon,
      },
      include: {
        instruction_criteres: {
          select: {
            critere_id: true,
          },
        },
      },
    });

  const droits: DroitsUtilisateur = {
    autoEvaluation: {
      rattachementCodes: [],
    },
    consolidation: {
      rattachementCodes: [],
    },
    instructionObjectifs: {
      rattachementCodes: [],
    },
    instructionManiereDeServir: {
      critereCodes: [],
    },
  };

  for (const rattachement of rattachements) {
    switch (rattachement.etape) {
      case "AUTO_EVALUATION":
        droits.autoEvaluation.rattachementCodes.push(
          rattachement.rattachement_code
        );
        break;
      case "CONSOLIDATION":
        droits.consolidation.rattachementCodes.push(
          rattachement.rattachement_code
        );
        break;
      case "INSTRUCTION":
        droits.instructionObjectifs.rattachementCodes.push(
          rattachement.rattachement_code
        );
        // Récupérer les critères
        for (const instructionCritere of rattachement.instruction_criteres) {
          if (
            !droits.instructionManiereDeServir.critereCodes.includes(
              instructionCritere.critere_id
            )
          ) {
            droits.instructionManiereDeServir.critereCodes.push(
              instructionCritere.critere_id
            );
          }
        }
        break;
    }
  }

  return droits;
}
```

### 4.4 Enregistrer la query dans le container

**Fichier à modifier** : `src/server/evaluation/container.ts`

**Ajouts** :

1. Import :
```typescript
import { RecupererDroitsUtilisateurQuery } from "@/server/evaluation/queries/RecupererDroitsUtilisateurQuery";
```

2. Dans le type `PiloteEvalDependencies` :
```typescript
export type PiloteEvalDependencies = {
  // ... autres dépendances
  recupererDroitsUtilisateurQuery: RecupererDroitsUtilisateurQuery;
};
```

3. Dans l'enregistrement :
```typescript
return initialContainer.createScope<PiloteEvalDependencies>().register({
  // ... autres enregistrements
  recupererDroitsUtilisateurQuery: asClass(RecupererDroitsUtilisateurQuery),
});
```

### 4.5 Récupérer les droits dans la page et mettre à jour les valeurs par défaut

**Fichier à modifier** : `src/pages/evaluation/utilisateur/[id].tsx`

**Modifications dans `getServerSideProps`** :

```typescript
const [criteres, rattachements, objectifsParRattachement, droitsUtilisateur] =
  await Promise.all([
    container.resolve("listerCriteresPiloteEval").run(),
    container.resolve("listerRattachementsPiloteEval").run(),
    container.resolve("listerObjectifsParRattachementPiloteEval").run({
      jalon: 2025,
    }),
    container.resolve("recupererDroitsUtilisateurQuery").run({
      utilisateurId,
      jalon: 2025,
    }),
  ]);

return {
  props: {
    utilisateurId,
    criteres,
    rattachements,
    objectifsParRattachement,
    droitsUtilisateur,
  },
};
```

**Modifications dans le composant** :

```typescript
const UtilisateurDetailPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const {
    utilisateurId,
    criteres,
    rattachements,
    objectifsParRattachement,
    droitsUtilisateur,
  } = props;

  const { control, handleSubmit } =
    useForm<ParametrageUtilisateurPiloteEvalFormulaire>({
      resolver: zodResolver(parametrageUtilisateurPiloteEvalSchema),
      defaultValues: droitsUtilisateur, // Utiliser les droits existants
    });

  // ... reste du code
};
```

### Points d'attention

- ✅ Bien filtrer par `utilisateur_id` ET `jalon`
- ✅ Gérer le cas où l'utilisateur n'a aucun droit (retourner des tableaux vides)
- ✅ Pour l'instruction, récupérer à la fois les rattachements ET les critères
- ✅ Éviter les doublons dans `critereCodes` (utiliser `includes` avant d'ajouter)
- ✅ Utiliser `$Enums.etape_evaluation_enum` pour les valeurs d'enum
- ✅ Les tests doivent tous être en rouge avant l'implémentation (TDD)
- ✅ Le jalon sera hard-codé à 2025 pour le moment

## Étapes suivantes (à définir)

- Étape 5 : Sauvegarde et persistance des droits modifiés
- Étape 6 : Mise à jour de la logique de permissions

## Notes techniques

### Schéma Prisma concerné

```prisma
model utilisateur {
  id                       String                   @id @db.Uuid
  email                    String                   @unique
  nom                      String
  prenom                   String
  profilCode               String
  applications_accessibles application_accessible[]
  date_desactivation       DateTime?
  // ... autres champs
}

enum application_accessible {
  PILOTE
  PILOTE_EVAL
  PILOTE_EVAL_PILOTAGE
}
```

### Pattern architectural à suivre

1. **Tests d'abord** : Écrire les tests d'intégration en premier (**RED**)
2. **Query class** : Créer la classe Query dans `src/server/evaluation/queries/`
3. **Container Awilix** : Enregistrer la query dans `src/server/evaluation/container.ts`
4. **getServerSideProps** : Utiliser `getContainer("piloteEval").resolve("listerUtilisateursPiloteEval")`
5. **Page** : Récupérer les données via props et afficher

### Pattern observé dans le codebase

- Les queries d'évaluation suivent le pattern `ListerXxxQuery` ou `AfficherXxxQuery`
- Elles reçoivent `{ prisma: PrismaPilote }` en dépendance
- Elles exposent une méthode `async run(params?): Promise<Result>`
- Les tests d'intégration instancient directement la query avec Prisma
- Les tests sont écrits en français avec GIVEN/WHEN/THEN
- L'enregistrement dans Awilix se fait avec `asClass()`

### Points d'attention

- ✅ Vérifier les droits d'accès (seuls les utilisateurs avec `PILOTE_EVAL_PILOTAGE` peuvent accéder)
- ✅ Exclure les utilisateurs désactivés (`date_desactivation IS NULL`)
- ✅ Gérer le cas où aucun utilisateur n'a accès à Pilote Eval
- ✅ S'assurer que la navigation est cohérente avec les autres pages d'évaluation
- ✅ Utiliser `$Enums.application_accessible` pour les valeurs d'enum
- ✅ Écrire les tests en français avec la structure GIVEN/WHEN/THEN
- ✅ **S'assurer que les tests sont ROUGES avant de commencer l'implémentation**
