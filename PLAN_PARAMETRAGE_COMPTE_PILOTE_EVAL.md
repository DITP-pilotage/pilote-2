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

## Étapes suivantes (à définir)

- Étape 2 : Page de détail utilisateur `/evaluation/utilisateur/[id]`
- Étape 3 : Formulaire de configuration des droits par territoire/axe
- Étape 4 : Sauvegarde et persistance des droits
- Étape 5 : Mise à jour de la logique de permissions

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
