# ProConnect sur PILOTE PPG — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un utilisateur ayant un compte PILOTE PPG actif de se connecter via ProConnect, en plus du parcours Keycloak existant, sans duplication de compte ni création automatique.

**Architecture:** Un provider OIDC ProConnect est ajouté à côté de Keycloak dans next-auth. L'IdP authentifie au moment du login et rien de plus : le rapprochement se fait par email normalisé dans un callback `signIn`, et le contrôle d'accès continu passe désormais par le statut du compte en base PPG pour les deux providers — ce qui remplace l'introspection Keycloak dans `proxy.ts`.

**Tech Stack:** Next.js 16 (pages router + quelques routes app router), next-auth `5.0.0-beta.32`, Prisma, awilix (module-system maison), vitest (projets `server-unit` / `server-integration` / `client`), Playwright, DSFR.

**Spec:** `docs/superpowers/specs/2026-09-08-proconnect-ppg-design.md`

## Global Constraints

- **Toujours des exports nommés**, jamais de `export default` — **sauf** les fichiers de `src/pages/**`, où le pages router de Next impose un default export. Les composants restent en exports nommés.
- **Paramètres de fonction sous forme d'objet** pour les helpers et fonctions de domaine : `f({ a, b })`, pas `f(a, b)`.
- **Migrations Prisma : écrire le SQL à la main puis `prisma migrate deploy`.** Ne **jamais** lancer `prisma migrate dev` / `pnpm database:migration` sur ce dépôt : un drift permanent existe sur les tables `raw_data` (gérées par dbt, hors Migrate) et `migrate dev` proposerait un reset de la base.
- **Ne pas refactorer l'existant hors périmètre.** En particulier : ne pas corriger les assertions non-null (`utilisateur!`) du callback `session`, on garantit seulement qu'on ne les atteint plus avec un inconnu.
- Nommage métier en français, cohérent avec le code environnant.
- Commandes de vérification, depuis `apps/pilote-ppg` :
  - `pnpm test:server:unit`
  - `pnpm test:server:integration`
  - `pnpm lint` (= `prisma generate && eslint && tsc`)
- Identifiant du provider ProConnect : **`proconnect`**, en minuscules, partout (config, `id` du provider, valeur stockée en base, comparaisons).

---

### Task 1 : Statut d'un compte en base

Fonde tout le reste : le callback `signIn` et `proxy.ts` en dépendent. Trois issues distinctes plutôt qu'un booléen, parce que PIL-1742 exige des messages différents pour un compte inconnu et un compte désactivé.

**Files:**
- Create: `apps/pilote-ppg/src/server/gestion-utilisateur/domain/StatutCompte.ts`
- Modify: `apps/pilote-ppg/src/server/gestion-utilisateur/domain/ports/UtilisateurRepository.ts` (ajout à l'interface, après `verifierExistenceUtilisateur` ligne 64)
- Modify: `apps/pilote-ppg/src/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository.ts` (après `verifierExistenceUtilisateur`, ligne 252-260)
- Test: `apps/pilote-ppg/src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaUtilisateurRepositoryStatutCompte.integration.test.ts`

**Interfaces:**
- Consumes: rien
- Produces:
  - `type StatutCompte = "actif" | "desactive" | "inconnu"`
  - `UtilisateurRepository.statutCompte(email: string): Promise<StatutCompte>` — normalise l'email (`trim`, `toLowerCase`) avant la recherche

- [ ] **Step 1: Écrire le type de domaine**

Créer `src/server/gestion-utilisateur/domain/StatutCompte.ts` :

```ts
/**
 * Statut d'un compte PILOTE PPG du point de vue de l'authentification.
 * `desactive` correspond à une `date_desactivation` non nulle, convention
 * utilisée dans tout le code (cf. UtilisateurListeGestionContrat).
 */
export type StatutCompte = "actif" | "desactive" | "inconnu";
```

- [ ] **Step 2: Écrire le test d'intégration qui échoue**

Créer `src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaUtilisateurRepositoryStatutCompte.integration.test.ts` :

```ts
import { PrismaUtilisateurRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaUtilisateurRepository#statutCompte", () => {
  let repository: PrismaUtilisateurRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    repository = new PrismaUtilisateurRepository({ prisma: prismaPilote });
  });

  it(
    "retourne actif quand le compte n'a pas de date de désactivation",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({
        email: "agent.actif@exemple.gouv.fr",
        date_desactivation: null,
      });

      const statut = await repository.statutCompte("agent.actif@exemple.gouv.fr");

      expect(statut).toBe("actif");
    }),
  );

  it(
    "retourne desactive quand le compte porte une date de désactivation",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({
        email: "agent.desactive@exemple.gouv.fr",
        date_desactivation: new Date("2026-01-15"),
      });

      const statut = await repository.statutCompte(
        "agent.desactive@exemple.gouv.fr",
      );

      expect(statut).toBe("desactive");
    }),
  );

  it(
    "retourne inconnu quand aucun compte ne porte cet email",
    createIntegrationTest(async () => {
      const statut = await repository.statutCompte("personne@exemple.gouv.fr");

      expect(statut).toBe("inconnu");
    }),
  );

  it(
    "normalise la casse et les espaces autour de l'email",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({ email: "agent.casse@exemple.gouv.fr" });

      const statut = await repository.statutCompte(
        "  Agent.Casse@Exemple.Gouv.FR  ",
      );

      expect(statut).toBe("actif");
    }),
  );
});
```

- [ ] **Step 3: Lancer le test pour vérifier qu'il échoue**

```bash
cd apps/pilote-ppg && pnpm test:server:integration PrismaUtilisateurRepositoryStatutCompte
```

Attendu : ÉCHEC, `repository.statutCompte is not a function`.

- [ ] **Step 4: Ajouter la méthode au port**

Dans `src/server/gestion-utilisateur/domain/ports/UtilisateurRepository.ts`, importer le type en tête de fichier puis ajouter la signature juste après `verifierExistenceUtilisateur(email: string): Promise<boolean>;` :

```ts
import { StatutCompte } from "@/server/gestion-utilisateur/domain/StatutCompte";
```

```ts
  statutCompte(email: string): Promise<StatutCompte>;
```

- [ ] **Step 5: Implémenter dans l'adapter Prisma**

Dans `src/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository.ts`, importer le type puis ajouter la méthode juste après `verifierExistenceUtilisateur` :

```ts
  async statutCompte(email: string): Promise<StatutCompte> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!utilisateur) {
      return "inconnu";
    }

    return utilisateur.date_desactivation === null ? "actif" : "desactive";
  }
```

`findUnique` est possible parce que `utilisateur.email` est `@unique` dans le schéma.

- [ ] **Step 6: Lancer le test pour vérifier qu'il passe**

```bash
cd apps/pilote-ppg && pnpm test:server:integration PrismaUtilisateurRepositoryStatutCompte
```

Attendu : les 4 tests passent.

- [ ] **Step 7: Vérifier que rien d'autre ne casse**

```bash
cd apps/pilote-ppg && pnpm lint:tsc
```

Attendu : aucune erreur. Si un mock de `UtilisateurRepository` échoue à la compilation, c'est que `vitest-mock-extended` ne couvre pas la nouvelle méthode — c'est normalement transparent avec `mock<UtilisateurRepository>()`.

- [ ] **Step 8: Commit**

```bash
git add apps/pilote-ppg/src/server/gestion-utilisateur/domain/StatutCompte.ts \
        apps/pilote-ppg/src/server/gestion-utilisateur/domain/ports/UtilisateurRepository.ts \
        apps/pilote-ppg/src/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository.ts \
        apps/pilote-ppg/src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaUtilisateurRepositoryStatutCompte.integration.test.ts
git commit -m "feat(auth): statut d'un compte utilisateur en base (PIL-1742)"
```

---

### Task 2 : Tracer le provider de connexion

Ajoute la colonne demandée par le critère de succès de l'épique, au moment et à l'endroit où `date_derniere_connexion` est déjà écrite. La signature passe en paramètres nommés parce qu'elle atteindrait trois positionnels.

**Files:**
- Create: `apps/pilote-ppg/src/database/prisma/migrations/20260908000000_utilisateur_dernier_provider_connexion/migration.sql`
- Modify: `apps/pilote-ppg/src/database/prisma/schema.prisma` (model `utilisateur`, à la suite de `date_derniere_connexion` ligne 832)
- Modify: `apps/pilote-ppg/src/server/gestion-utilisateur/domain/ports/UtilisateurRepository.ts:108`
- Modify: `apps/pilote-ppg/src/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository.ts:1067`
- Modify: `apps/pilote-ppg/src/server/infrastructure/api/auth/[...nextauth].tsx:310` (seul appelant)
- Test: `apps/pilote-ppg/src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaUtilisateurRepositoryDerniereConnexion.integration.test.ts`

**Interfaces:**
- Consumes: rien
- Produces: `UtilisateurRepository.mettreAJourDateDerniereConnexion(params: { email: string; date: Date; provider: string }): Promise<void>`

- [ ] **Step 1: Écrire la migration SQL à la main**

Créer `src/database/prisma/migrations/20260908000000_utilisateur_dernier_provider_connexion/migration.sql` :

```sql
-- Trace le fournisseur d'identité utilisé lors de la dernière connexion réussie.
-- Nullable : les comptes existants n'ont pas d'historique.
ALTER TABLE "utilisateur" ADD COLUMN "dernier_provider_connexion" TEXT;
```

- [ ] **Step 2: Déclarer la colonne dans le schéma Prisma**

Dans `src/database/prisma/schema.prisma`, model `utilisateur`, juste après la ligne `date_derniere_connexion` :

```prisma
  dernier_provider_connexion             String?
```

- [ ] **Step 3: Appliquer la migration et régénérer le client**

```bash
cd apps/pilote-ppg && pnpm exec prisma migrate deploy && pnpm exec prisma generate
```

Attendu : `1 migration applied`. **Ne pas lancer `prisma migrate dev`** — cf. Global Constraints.

- [ ] **Step 4: Écrire le test d'intégration qui échoue**

Créer `src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaUtilisateurRepositoryDerniereConnexion.integration.test.ts` :

```ts
import { PrismaUtilisateurRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaUtilisateurRepository#mettreAJourDateDerniereConnexion", () => {
  let repository: PrismaUtilisateurRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    repository = new PrismaUtilisateurRepository({ prisma: prismaPilote });
  });

  it(
    "enregistre la date et le provider de la connexion",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({ email: "agent.trace@exemple.gouv.fr" });

      await repository.mettreAJourDateDerniereConnexion({
        email: "agent.trace@exemple.gouv.fr",
        date: new Date("2026-09-08T10:00:00Z"),
        provider: "proconnect",
      });

      const utilisateur = await prismaPilote
        .getInstance()
        .utilisateur.findUniqueOrThrow({
          where: { email: "agent.trace@exemple.gouv.fr" },
        });
      expect(utilisateur.date_derniere_connexion).toEqual(
        new Date("2026-09-08T10:00:00Z"),
      );
      expect(utilisateur.dernier_provider_connexion).toBe("proconnect");
    }),
  );

  it(
    "écrase le provider précédent à la connexion suivante",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({
        email: "agent.bascule@exemple.gouv.fr",
        dernier_provider_connexion: "keycloak",
      });

      await repository.mettreAJourDateDerniereConnexion({
        email: "agent.bascule@exemple.gouv.fr",
        date: new Date("2026-09-08T11:00:00Z"),
        provider: "proconnect",
      });

      const utilisateur = await prismaPilote
        .getInstance()
        .utilisateur.findUniqueOrThrow({
          where: { email: "agent.bascule@exemple.gouv.fr" },
        });
      expect(utilisateur.dernier_provider_connexion).toBe("proconnect");
    }),
  );
});
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il échoue**

```bash
cd apps/pilote-ppg && pnpm test:server:integration PrismaUtilisateurRepositoryDerniereConnexion
```

Attendu : ÉCHEC à la compilation TypeScript — la méthode attend encore deux paramètres positionnels.

- [ ] **Step 6: Changer la signature du port**

Dans `src/server/gestion-utilisateur/domain/ports/UtilisateurRepository.ts`, remplacer la ligne 108 :

```ts
  mettreAJourDateDerniereConnexion(params: {
    email: string;
    date: Date;
    provider: string;
  }): Promise<void>;
```

- [ ] **Step 7: Adapter l'implémentation Prisma**

Dans `src/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository.ts`, remplacer la méthode ligne 1067 :

```ts
  async mettreAJourDateDerniereConnexion({
    email,
    date,
    provider,
  }: {
    email: string;
    date: Date;
    provider: string;
  }): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { email: email.trim().toLowerCase() },
      data: {
        date_derniere_connexion: date,
        dernier_provider_connexion: provider,
        date_premiere_relance_desactivation: null,
        date_deuxieme_relance_desactivation: null,
        date_desactivation_programee: null,
      },
    });
  }
```

- [ ] **Step 8: Adapter l'unique appelant**

Dans `src/server/infrastructure/api/auth/[...nextauth].tsx`, remplacer l'appel ligne 310 :

```ts
          await utilisateurRepository.mettreAJourDateDerniereConnexion({
            email: user.email,
            date: new Date(),
            provider: account.provider,
          });
```

- [ ] **Step 9: Lancer les tests et le typecheck**

```bash
cd apps/pilote-ppg && pnpm test:server:integration PrismaUtilisateurRepositoryDerniereConnexion && pnpm lint:tsc
```

Attendu : les 2 tests passent, aucune erreur de type.

- [ ] **Step 10: Commit**

```bash
git add apps/pilote-ppg/src/database/prisma \
        apps/pilote-ppg/src/server/gestion-utilisateur \
        "apps/pilote-ppg/src/server/infrastructure/api/auth/[...nextauth].tsx"
git commit -m "feat(auth): trace le provider utilisé à la dernière connexion (PIL-1737)"
```

---

### Task 3 : Configuration et provider ProConnect

Le point le plus risqué du lot : Auth.js ne livre aucun provider ProConnect, et l'endpoint `userinfo` renvoie un JWT signé là où Auth.js attend du JSON. À traiter tôt pour lever le risque.

**Files:**
- Modify: `apps/pilote-ppg/src/config.ts` (bloc `proconnect` après le bloc `keycloak`, ligne 56-89)
- Modify: `apps/pilote-ppg/.env.example` (après les variables `KEYCLOAK_*`, ligne 51-54)
- Create: `apps/pilote-ppg/src/server/infrastructure/api/auth/proconnect.ts`
- Test: `apps/pilote-ppg/src/server/infrastructure/api/auth/__tests__/proconnect.unit.test.ts`

**Interfaces:**
- Consumes: rien
- Produces:
  - `PROVIDER_PROCONNECT = "proconnect"` (constante)
  - `decoderPayloadJwt({ jwt }: { jwt: string }): unknown`
  - `profilProConnectSchema` — validation du payload userinfo
  - `proconnect` — l'`OIDCConfig` à passer à `providers`
- Ce fichier vit dans `src/server/infrastructure/api/auth/`, qui **n'est pas** un dossier de routes : les handlers sont exposés par `src/app/api/auth/[...nextauth]/route.ts`. Y ajouter un fichier ne crée aucune route.

- [ ] **Step 1: Écrire le test unitaire du décodage et du profil**

Créer `src/server/infrastructure/api/auth/__tests__/proconnect.unit.test.ts` :

```ts
import {
  decoderPayloadJwt,
  profilProConnectSchema,
} from "@/server/infrastructure/api/auth/proconnect";

const encoderJwt = (payload: object): string => {
  const base64url = (valeur: string) =>
    Buffer.from(valeur, "utf8").toString("base64url");
  return `${base64url('{"alg":"RS256"}')}.${base64url(JSON.stringify(payload))}.signature`;
};

describe("decoderPayloadJwt", () => {
  it("décode le payload d'un JWT", () => {
    const jwt = encoderJwt({ sub: "abc", email: "agent@exemple.gouv.fr" });

    expect(decoderPayloadJwt({ jwt })).toEqual({
      sub: "abc",
      email: "agent@exemple.gouv.fr",
    });
  });

  it("décode correctement les caractères accentués", () => {
    const jwt = encoderJwt({ sub: "abc", usual_name: "Ézéchiel" });

    expect(decoderPayloadJwt({ jwt })).toMatchObject({
      usual_name: "Ézéchiel",
    });
  });

  it("lève une erreur explicite si le JWT est malformé", () => {
    expect(() => decoderPayloadJwt({ jwt: "pas-un-jwt" })).toThrow(
      "Réponse userinfo ProConnect malformée",
    );
  });
});

describe("profilProConnectSchema", () => {
  it("accepte un profil ProConnect complet", () => {
    const resultat = profilProConnectSchema.safeParse({
      sub: "abc",
      email: "agent@exemple.gouv.fr",
      given_name: "Alice",
      usual_name: "Richard",
    });

    expect(resultat.success).toBe(true);
  });

  it("accepte un profil sans email : le refus est du ressort du callback signIn", () => {
    const resultat = profilProConnectSchema.safeParse({ sub: "abc" });

    expect(resultat.success).toBe(true);
  });

  it("refuse un profil sans sub", () => {
    const resultat = profilProConnectSchema.safeParse({
      email: "agent@exemple.gouv.fr",
    });

    expect(resultat.success).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd apps/pilote-ppg && pnpm test:server:unit proconnect
```

Attendu : ÉCHEC, le module `proconnect` n'existe pas.

- [ ] **Step 3: Ajouter le bloc de configuration**

Dans `src/config.ts`, juste après le bloc `keycloak` (qui se termine par `logoutUrl`, ligne ~89) :

```ts
  proconnect: {
    doc: "Fournisseur d'identité ProConnect. Obligatoire hors mode DEV_PASSWORD.",
    clientId: {
      format: String,
      default: "ToBeDefined",
      env: "PROCONNECT_CLIENT_ID",
    },
    clientSecret: {
      format: String,
      default: "ToBeDefined",
      env: "PROCONNECT_CLIENT_SECRET",
    },
    issuer: {
      format: String,
      default: "ToBeDefined",
      doc: "URL de découverte OIDC, ex. https://fca.integ01.dev-agentconnect.fr/api/v2",
      env: "PROCONNECT_ISSUER",
    },
  },
```

- [ ] **Step 4: Documenter les variables d'environnement**

Dans `.env.example`, après les lignes `KEYCLOAK_*` :

```
# ProConnect — plateforme d'intégration DINUM.
# Obligatoire hors mode DEV_PASSWORD. Nécessite une application ProConnect
# déclarée pour PPG, avec l'URL de redirection locale enregistrée :
#   https://pilote.modernisation.localhost/api/auth/callback/proconnect
PROCONNECT_ISSUER=https://fca.integ01.dev-agentconnect.fr/api/v2
PROCONNECT_CLIENT_ID=TBD
PROCONNECT_CLIENT_SECRET=TBD
```

- [ ] **Step 5: Écrire le provider**

Créer `src/server/infrastructure/api/auth/proconnect.ts` :

```ts
import type { OIDCConfig } from "next-auth/providers";
import { z } from "zod";
import { configuration } from "@/config";

export const PROVIDER_PROCONNECT = "proconnect";

/**
 * ProConnect ne suit pas la nomenclature OIDC courante : le nom de famille est
 * porté par `usual_name` et non `family_name`.
 * L'email est optionnel ici : une identité sans email exploitable doit produire
 * un refus lisible côté callback `signIn`, pas une erreur de parsing opaque.
 */
export const profilProConnectSchema = z.object({
  sub: z.string().min(1),
  email: z.string().optional(),
  given_name: z.string().optional(),
  usual_name: z.string().optional(),
});

export type ProfilProConnect = z.infer<typeof profilProConnectSchema>;

/**
 * L'endpoint `userinfo` de ProConnect répond en `application/jwt` et non en
 * JSON, contrairement à ce qu'attend Auth.js. On décode le payload sans
 * vérifier la signature : la réponse vient directement de l'émetteur, sur un
 * canal TLS, en échange d'un access token que nous venons d'obtenir. C'est le
 * même niveau de confiance que pour un userinfo JSON standard.
 */
export const decoderPayloadJwt = ({ jwt }: { jwt: string }): unknown => {
  const payload = jwt.split(".")[1];
  if (!payload) {
    throw new Error("Réponse userinfo ProConnect malformée");
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Réponse userinfo ProConnect malformée");
  }
};

export const proconnect: OIDCConfig<ProfilProConnect> = {
  id: PROVIDER_PROCONNECT,
  name: "ProConnect",
  type: "oidc",
  issuer: configuration().proconnect.issuer,
  clientId: configuration().proconnect.clientId,
  clientSecret: configuration().proconnect.clientSecret,
  authorization: {
    params: { scope: "openid given_name usual_name email" },
  },
  client: { token_endpoint_auth_method: "client_secret_post" },
  userinfo: {
    async request({ tokens, provider }) {
      const url = provider.userinfo?.url;
      if (!url) {
        throw new Error("Endpoint userinfo ProConnect introuvable");
      }
      const reponse = await fetch(url, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!reponse.ok) {
        throw new Error(
          `Appel userinfo ProConnect en échec (${reponse.status})`,
        );
      }
      return profilProConnectSchema.parse(
        decoderPayloadJwt({ jwt: await reponse.text() }),
      );
    },
  },
  profile(profil) {
    return {
      id: profil.sub,
      email: profil.email ?? null,
      name:
        [profil.given_name, profil.usual_name].filter(Boolean).join(" ") ||
        null,
    };
  },
};
```

- [ ] **Step 6: Lancer les tests pour vérifier qu'ils passent**

```bash
cd apps/pilote-ppg && pnpm test:server:unit proconnect && pnpm lint:tsc
```

Attendu : les 6 tests passent, aucune erreur de type.

Si `OIDCConfig` n'est pas exporté par `next-auth/providers` dans la beta.32, l'importer depuis `@auth/core/providers` — vérifier avec :
`grep -rn "OIDCConfig" node_modules/next-auth/providers/index.d.ts`

- [ ] **Step 7: Enregistrer le provider**

Dans `src/server/infrastructure/api/auth/[...nextauth].tsx`, importer le provider puis remplacer la ligne `providers:` de `authConfig` :

```ts
import { proconnect } from "@/server/infrastructure/api/auth/proconnect";
```

```ts
  providers: !!configuration().devPassword
    ? [credentialsProvider]
    : [keycloak, proconnect],
```

- [ ] **Step 8: Vérifier la découverte OIDC à la main**

Avec les identifiants d'intégration renseignés dans `.env`, démarrer l'appli (`pnpm dev`) et ouvrir `/api/auth/signin`. Attendu : les deux providers apparaissent, et cliquer sur ProConnect redirige vers l'écran ProConnect d'intégration.

Ce pas est manuel et ne peut pas être automatisé : il valide la déclaration de l'application côté DINUM autant que le code. **Si l'application ProConnect d'intégration n'est pas encore déclarée, s'arrêter ici et le signaler — les tâches 4 à 9 ne peuvent pas être validées de bout en bout sans elle**, même si elles restent implémentables et testables unitairement.

- [ ] **Step 9: Commit**

```bash
git add apps/pilote-ppg/src/config.ts apps/pilote-ppg/.env.example \
        apps/pilote-ppg/src/server/infrastructure/api/auth/
git commit -m "feat(auth): provider OIDC ProConnect (PIL-1742)"
```

---

### Task 4 : Le refus de connexion

Le cœur de PIL-1742. La règle est extraite en fonction pure pour être testable sans container ni base, puis branchée dans le callback `signIn`. Sans cette garde, une identité ProConnect inconnue atteint les assertions non-null du callback `session` (`utilisateur!.profil`, ligne 362) et produit un 500.

**Files:**
- Create: `apps/pilote-ppg/src/server/authentification/domain/autoriserConnexionProConnect.ts`
- Modify: `apps/pilote-ppg/src/server/infrastructure/api/auth/[...nextauth].tsx` (ajout d'un callback `signIn` dans `authConfig.callbacks`, avant `jwt`)
- Test: `apps/pilote-ppg/src/server/authentification/__tests__/domain/autoriserConnexionProConnect.unit.test.ts`

**Interfaces:**
- Consumes: `StatutCompte` (Task 1), `PROVIDER_PROCONNECT` (Task 3)
- Produces:
  - `type MotifRefusConnexion = "email_absent" | "compte_inconnu" | "compte_desactive"`
  - `autoriserConnexionProConnect({ email, recupererStatutCompte }): Promise<MotifRefusConnexion | null>` — `null` signifie autorisé

- [ ] **Step 1: Écrire le test unitaire qui échoue**

Créer `src/server/authentification/__tests__/domain/autoriserConnexionProConnect.unit.test.ts` :

```ts
import { autoriserConnexionProConnect } from "@/server/authentification/domain/autoriserConnexionProConnect";
import { StatutCompte } from "@/server/gestion-utilisateur/domain/StatutCompte";

const recupererStatut = (statut: StatutCompte) => vi.fn().mockResolvedValue(statut);

describe("autoriserConnexionProConnect", () => {
  it("autorise un compte actif", async () => {
    const motif = await autoriserConnexionProConnect({
      email: "agent@exemple.gouv.fr",
      recupererStatutCompte: recupererStatut("actif"),
    });

    expect(motif).toBeNull();
  });

  it("refuse une identité inconnue de PILOTE", async () => {
    const motif = await autoriserConnexionProConnect({
      email: "inconnu@exemple.gouv.fr",
      recupererStatutCompte: recupererStatut("inconnu"),
    });

    expect(motif).toBe("compte_inconnu");
  });

  it("refuse un compte désactivé", async () => {
    const motif = await autoriserConnexionProConnect({
      email: "desactive@exemple.gouv.fr",
      recupererStatutCompte: recupererStatut("desactive"),
    });

    expect(motif).toBe("compte_desactive");
  });

  it.each([undefined, null, "", "   "])(
    "refuse une identité sans email exploitable (%p)",
    async (email) => {
      const recupererStatutCompte = recupererStatut("actif");

      const motif = await autoriserConnexionProConnect({
        email,
        recupererStatutCompte,
      });

      expect(motif).toBe("email_absent");
      expect(recupererStatutCompte).not.toHaveBeenCalled();
    },
  );

  it("normalise l'email avant de chercher le compte", async () => {
    const recupererStatutCompte = recupererStatut("actif");

    await autoriserConnexionProConnect({
      email: "  Agent.Richard@Exemple.Gouv.FR ",
      recupererStatutCompte,
    });

    expect(recupererStatutCompte).toHaveBeenCalledWith(
      "agent.richard@exemple.gouv.fr",
    );
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd apps/pilote-ppg && pnpm test:server:unit autoriserConnexionProConnect
```

Attendu : ÉCHEC, le module n'existe pas.

- [ ] **Step 3: Écrire la fonction**

Créer `src/server/authentification/domain/autoriserConnexionProConnect.ts` :

```ts
import { StatutCompte } from "@/server/gestion-utilisateur/domain/StatutCompte";

export type MotifRefusConnexion =
  | "email_absent"
  | "compte_inconnu"
  | "compte_desactive";

/**
 * ProConnect authentifie, PILOTE PPG autorise. Aucun compte ni aucune
 * habilitation n'est créé à partir des données ProConnect : l'email normalisé
 * est la seule clé de rapprochement avec un compte existant.
 *
 * Retourne `null` si la connexion est autorisée, sinon le motif du refus.
 */
export const autoriserConnexionProConnect = async ({
  email,
  recupererStatutCompte,
}: {
  email: string | null | undefined;
  recupererStatutCompte: (email: string) => Promise<StatutCompte>;
}): Promise<MotifRefusConnexion | null> => {
  const emailNormalise = email?.trim().toLowerCase();
  if (!emailNormalise) {
    return "email_absent";
  }

  const statut = await recupererStatutCompte(emailNormalise);
  if (statut === "inconnu") {
    return "compte_inconnu";
  }
  if (statut === "desactive") {
    return "compte_desactive";
  }

  return null;
};
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

```bash
cd apps/pilote-ppg && pnpm test:server:unit autoriserConnexionProConnect
```

Attendu : les 8 cas passent.

- [ ] **Step 5: Brancher le callback signIn**

Dans `src/server/infrastructure/api/auth/[...nextauth].tsx`, ajouter les imports puis le callback `signIn` **avant** `jwt` dans `authConfig.callbacks` :

```ts
import { autoriserConnexionProConnect } from "@/server/authentification/domain/autoriserConnexionProConnect";
import { PROVIDER_PROCONNECT } from "@/server/infrastructure/api/auth/proconnect";
```

```ts
    async signIn({ account, profile }) {
      if (account?.provider !== PROVIDER_PROCONNECT) {
        return true;
      }

      const { getContainer } = await import("@/server/dependances");
      const utilisateurRepository =
        getContainer("gestionUtilisateur").cradle.utilisateurRepository;

      const motif = await autoriserConnexionProConnect({
        email: profile?.email,
        recupererStatutCompte: (email) =>
          utilisateurRepository.statutCompte(email),
      });

      if (motif) {
        logger.warn(
          {
            categorie: "auth",
            source: "nextauth.signIn",
            provider: account.provider,
            motif,
          },
          "Connexion ProConnect refusée",
        );
        return `/connexion?motif=${motif}`;
      }

      logger.info(
        {
          categorie: "auth",
          source: "nextauth.signIn",
          provider: account.provider,
        },
        "Connexion ProConnect autorisée",
      );
      return true;
    },
```

Ne jamais logger l'email dans les cas de refus : une identité refusée n'est pas un utilisateur de PILOTE.

- [ ] **Step 6: Vérifier que le retour de chaîne redirige bien**

Auth.js v5 redirige vers l'URL quand le callback `signIn` retourne une chaîne. Le confirmer dans la version installée :

```bash
cd apps/pilote-ppg && grep -rn "signIn" node_modules/@auth/core/types.d.ts | grep -i "redirect\|string"
```

Si ce n'est pas supporté dans la beta.32, remplacer `return \`/connexion?motif=${motif}\`` par `return false` et laisser `pages.error` (Task 8) traiter le paramètre `error=AccessDenied` — dans ce cas, la distinction entre les trois motifs n'est plus visible côté page, ce qui **doit être signalé** car PIL-1742 exige une explication compréhensible.

- [ ] **Step 7: Lancer les tests et le typecheck**

```bash
cd apps/pilote-ppg && pnpm test:server:unit && pnpm lint:tsc
```

Attendu : tout passe.

- [ ] **Step 8: Commit**

```bash
git add apps/pilote-ppg/src/server/authentification \
        "apps/pilote-ppg/src/server/infrastructure/api/auth/[...nextauth].tsx"
git commit -m "feat(auth): refuse les identités ProConnect sans compte PILOTE actif (PIL-1742)"
```

---

### Task 5 : Session ProConnect sans refresh

Sans ce correctif, la première expiration de l'access token ProConnect appelle `refreshAccessToken`, qui est câblé en dur sur Keycloak et dont la branche `else` retourne `RefreshAccessTokenError` — ce qui fait retourner `null` au callback `jwt` et tue la session.

**Files:**
- Modify: `apps/pilote-ppg/src/server/infrastructure/api/auth/[...nextauth].tsx` (`_hasExpired`, ligne 246-252)
- Test: `apps/pilote-ppg/src/server/infrastructure/api/auth/__tests__/expirationSession.unit.test.ts`

**Interfaces:**
- Consumes: `PROVIDER_PROCONNECT` (Task 3)
- Produces: `sessionExpiree({ provider, accessTokenExpires, maintenant }): boolean` — exporté depuis un module dédié pour rester testable sans monter tout `[...nextauth].tsx`

- [ ] **Step 1: Écrire le test unitaire qui échoue**

Créer `src/server/infrastructure/api/auth/__tests__/expirationSession.unit.test.ts` :

```ts
import { sessionExpiree } from "@/server/infrastructure/api/auth/expirationSession";

const MAINTENANT = new Date("2026-09-08T12:00:00Z").getTime();
const IL_Y_A_UNE_HEURE = MAINTENANT - 3_600_000;
const DANS_UNE_HEURE = MAINTENANT + 3_600_000;

describe("sessionExpiree", () => {
  it("considère un access token Keycloak dépassé comme expiré", () => {
    expect(
      sessionExpiree({
        provider: "keycloak",
        accessTokenExpires: IL_Y_A_UNE_HEURE,
        maintenant: MAINTENANT,
      }),
    ).toBe(true);
  });

  it("considère un access token Keycloak encore valide comme non expiré", () => {
    expect(
      sessionExpiree({
        provider: "keycloak",
        accessTokenExpires: DANS_UNE_HEURE,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });

  it("n'expire jamais une session ProConnect : la session PILOTE est autonome", () => {
    expect(
      sessionExpiree({
        provider: "proconnect",
        accessTokenExpires: IL_Y_A_UNE_HEURE,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });

  it("n'expire jamais une session credentials", () => {
    expect(
      sessionExpiree({
        provider: "credentials",
        accessTokenExpires: IL_Y_A_UNE_HEURE,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd apps/pilote-ppg && pnpm test:server:unit expirationSession
```

Attendu : ÉCHEC, le module n'existe pas.

- [ ] **Step 3: Écrire le module**

Créer `src/server/infrastructure/api/auth/expirationSession.ts` :

```ts
import { PROVIDER_PROCONNECT } from "@/server/infrastructure/api/auth/proconnect";

/**
 * Providers dont l'access token ne conditionne pas la durée de la session
 * PILOTE.
 *
 * ProConnect plafonne son refresh token à 2 h en dur, sans rotation : le
 * rafraîchir est impossible au-delà. La session PILOTE est donc autonome, et
 * le contrôle d'accès continu passe par le statut du compte en base (proxy.ts)
 * plutôt que par l'IdP.
 */
const PROVIDERS_SANS_RAFRAICHISSEMENT = [PROVIDER_PROCONNECT, "credentials"];

export const sessionExpiree = ({
  provider,
  accessTokenExpires,
  maintenant,
}: {
  provider: string;
  accessTokenExpires: number;
  maintenant: number;
}): boolean => {
  if (PROVIDERS_SANS_RAFRAICHISSEMENT.includes(provider)) {
    return false;
  }
  return maintenant >= accessTokenExpires;
};
```

- [ ] **Step 4: Remplacer `_hasExpired`**

Dans `src/server/infrastructure/api/auth/[...nextauth].tsx`, supprimer la fonction `_hasExpired` et importer le nouveau module :

```ts
import { sessionExpiree } from "@/server/infrastructure/api/auth/expirationSession";
```

Puis, dans le callback `jwt`, remplacer `if (!_hasExpired(toPiloteJWTPayload(token)))` par :

```ts
      const piloteToken = toPiloteJWTPayload(token);
      if (
        !sessionExpiree({
          provider: piloteToken.provider,
          accessTokenExpires: piloteToken.accessTokenExpires,
          maintenant: Date.now(),
        })
      ) {
        return token;
      }
```

- [ ] **Step 5: Ne pas conserver le refresh token ProConnect**

D'abord rendre le champ optionnel dans le type `PiloteJWTPayload` (ligne ~99), sinon l'affectation ci-dessous ne compile pas :

```ts
  refreshToken?: string;
```

`refreshAccessToken` et `refreshAccessTokenAvecDeduplication` continuent de lire ce champ, mais ne sont jamais atteints pour ProConnect puisque `sessionExpiree` retourne `false` : ne pas les modifier.

Puis, dans le callback `jwt`, branche de première connexion (`if (account != null && user != null)`), remplacer la ligne `refreshToken: account.refresh_token,` par :

```ts
          // ProConnect plafonne le refresh token à 2 h sans rotation : on ne
          // l'utilise pas, donc on ne le conserve pas dans la session.
          refreshToken:
            account.provider === PROVIDER_PROCONNECT
              ? undefined
              : account.refresh_token,
```

- [ ] **Step 6: Ne pas tenter de handshake de déconnexion ProConnect**

`doFinalSignoutHandshake` teste déjà `if (provider == keycloak.id)` et ne fait rien pour les autres providers : **aucune modification nécessaire**. Le vérifier en relisant la fonction (ligne 38-90) et passer au pas suivant. La déconnexion ProConnect est locale par décision de conception : on détruit la session PILOTE sans toucher à la session ProConnect.

- [ ] **Step 7: Lancer les tests et le typecheck**

```bash
cd apps/pilote-ppg && pnpm test:server:unit && pnpm lint:tsc
```

Attendu : les 4 nouveaux tests passent, aucune erreur de type, aucune référence résiduelle à `_hasExpired`.

- [ ] **Step 8: Commit**

```bash
git add apps/pilote-ppg/src/server/infrastructure/api/auth/
git commit -m "feat(auth): session PILOTE autonome pour ProConnect, sans rafraîchissement (PIL-1742)"
```

---

### Task 6 : Contrôle d'accès continu dans proxy.ts

Remplace l'introspection Keycloak par le statut du compte en base, pour les deux providers, et fait porter à la redirection le chemin demandé. Possible parce que le `proxy.ts` de Next 16 tourne obligatoirement en runtime Node.

**Files:**
- Modify: `apps/pilote-ppg/src/proxy.ts` (suppression de `validateKeycloakToken` lignes 34-65, réécriture du bloc `if (!estRoutePublique)` lignes 133-187)
- Create: `apps/pilote-ppg/src/server/authentification/domain/cheminDeRetour.ts`
- Test: `apps/pilote-ppg/src/server/authentification/__tests__/domain/cheminDeRetour.unit.test.ts`

**Interfaces:**
- Consumes: `UtilisateurRepository.statutCompte` (Task 1)
- Produces: `cheminDeRetourSur({ chemin }): string | null`

- [ ] **Step 1: Écrire le test de validation du chemin de retour**

Créer `src/server/authentification/__tests__/domain/cheminDeRetour.unit.test.ts` :

```ts
import { cheminDeRetourSur } from "@/server/authentification/domain/cheminDeRetour";

describe("cheminDeRetourSur", () => {
  it.each([
    "/accueil/chantier/NAT-FR",
    "/chantier/CH-001?onglet=indicateurs",
    "/",
  ])("accepte le chemin interne %s", (chemin) => {
    expect(cheminDeRetourSur({ chemin })).toBe(chemin);
  });

  it.each([
    "https://exemple.test/phishing",
    "//exemple.test/phishing",
    "/\\exemple.test",
    "javascript:alert(1)",
  ])("refuse le chemin non interne %s", (chemin) => {
    expect(cheminDeRetourSur({ chemin })).toBeNull();
  });

  it("refuse un chemin déraisonnablement long", () => {
    expect(cheminDeRetourSur({ chemin: `/${"a".repeat(512)}` })).toBeNull();
  });

  it("refuse une valeur vide", () => {
    expect(cheminDeRetourSur({ chemin: "" })).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd apps/pilote-ppg && pnpm test:server:unit cheminDeRetour
```

Attendu : ÉCHEC, le module n'existe pas.

- [ ] **Step 3: Écrire la validation**

Créer `src/server/authentification/domain/cheminDeRetour.ts` :

```ts
/**
 * Un chemin de retour doit rester interne à PILOTE. On refuse toute valeur qui
 * pourrait être interprétée comme une URL absolue ou protocol-relative
 * (`//exemple.test`), sous peine d'ouvrir une redirection arbitraire depuis
 * l'écran de connexion.
 */
const CHEMIN_INTERNE = /^\/(?:[^/\\].*)?$/;
const LONGUEUR_MAXIMALE = 512;

export const cheminDeRetourSur = ({
  chemin,
}: {
  chemin: string | null | undefined;
}): string | null => {
  if (!chemin || chemin.length > LONGUEUR_MAXIMALE) {
    return null;
  }
  return CHEMIN_INTERNE.test(chemin) ? chemin : null;
};
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

```bash
cd apps/pilote-ppg && pnpm test:server:unit cheminDeRetour
```

Attendu : les 9 cas passent.

- [ ] **Step 5: Rendre `/connexion` publique**

Dans `src/proxy.ts`, ajouter la route à `estRoutePublique` (ligne ~122), juste après `pathname.startsWith("/api/auth")` :

```ts
    pathname.startsWith("/connexion") ||
```

Sans ça, un utilisateur non authentifié serait redirigé vers `/connexion`, qui le redirigerait à son tour — boucle.

- [ ] **Step 6: Supprimer l'introspection Keycloak**

Dans `src/proxy.ts`, supprimer la fonction `validateKeycloakToken` (lignes 34-65) et l'import `axios` (ligne 3), qui n'a plus d'autre usage dans ce fichier.

- [ ] **Step 7: Réécrire le bloc de contrôle**

Dans `src/proxy.ts`, remplacer l'intégralité du bloc `if (!estRoutePublique) { … }` par :

```ts
  if (!estRoutePublique) {
    const useSecureCookies =
      process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: useSecureCookies,
    });

    if (!token) {
      return NextResponse.redirect(urlDeConnexion(request), { status: 303 });
    }

    if (!process.env.DEV_PASSWORD) {
      const email = (token.user as { email?: string } | undefined)?.email;
      const { getContainer } = await import("@/server/dependances");
      const utilisateurRepository =
        getContainer("gestionUtilisateur").cradle.utilisateurRepository;
      const statut = email
        ? await utilisateurRepository.statutCompte(email)
        : "inconnu";

      if (statut !== "actif") {
        logger.info(
          { categorie: "auth", source: "proxy", statut },
          "Session invalidée : compte non actif",
        );

        const redirectResponse = NextResponse.redirect(
          urlDeConnexion(request),
          { status: 303 },
        );

        const authCookiePrefixes = [
          "next-auth.session-token",
          "__Secure-next-auth.session-token",
          "authjs.session-token",
          "__Secure-authjs.session-token",
          "authjs.callback-url",
          "authjs.csrf-token",
          "next-auth.callback-url",
          "next-auth.csrf-token",
        ];

        for (const { name } of request.cookies.getAll()) {
          if (authCookiePrefixes.some((prefix) => name.startsWith(prefix))) {
            redirectResponse.cookies.set(name, "", {
              expires: new Date(0),
              path: "/",
              httpOnly: true,
              // Doit matcher les attributs d'origine : les cookies `__Secure-`
              // exigent Secure, et NextAuth les pose dès que NEXTAUTH_URL est
              // en https. Sans ça le navigateur ignore le clear et on tombe en
              // boucle de redirections. Ce chemin est emprunté à chaque
              // désactivation de compte, donc bien plus souvent qu'avant.
              secure: useSecureCookies,
              sameSite: "lax",
            });
          }
        }

        redirectResponse.cookies.set("csrf", "", {
          expires: new Date(0),
          path: "/",
          sameSite: "lax",
        });

        return redirectResponse;
      }
    }

    const cookie = request.cookies.get("csrf")?.value;

    // CSRF handling
    if (token.jti && (cookie === undefined || cookie !== token.jti)) {
      const jti = String(token.jti);
      response.cookies.set("csrf", jti, {
        sameSite: "lax",
        httpOnly: false,
        path: "/",
      });
    }
  }
```

Puis ajouter le helper au-dessus de `export async function proxy` :

```ts
const urlDeConnexion = (request: NextRequest): URL => {
  const url = new URL("/connexion", request.url);
  const chemin = cheminDeRetourSur({
    chemin: `${request.nextUrl.pathname}${request.nextUrl.search}`,
  });
  if (chemin && chemin !== "/") {
    url.searchParams.set("callbackUrl", chemin);
  }
  return url;
};
```

Et l'import :

```ts
import { cheminDeRetourSur } from "@/server/authentification/domain/cheminDeRetour";
```

`callbackUrl` est le nom déjà utilisé par next-auth et déjà lu par `src/pages/index.tsx` — ne pas en inventer un autre.

- [ ] **Step 8: Vérifier le typecheck et la suite serveur**

```bash
cd apps/pilote-ppg && pnpm lint:tsc && pnpm test:server
```

Attendu : aucune erreur, aucune référence résiduelle à `validateKeycloakToken` ni à `axios` dans `proxy.ts`.

- [ ] **Step 9: Vérifier manuellement la désactivation en HTTPS**

Ce pas ne peut pas être automatisé et couvre le chemin le plus critique de la tâche.

1. Se connecter en local (en HTTPS, via `pnpm dev` qui sert `https://pilote.modernisation.localhost`).
2. En base : `UPDATE utilisateur SET date_desactivation = now() WHERE email = '<son email>';`
3. Naviguer vers n'importe quelle page.

Attendu : redirection unique vers `/connexion`, cookies de session effacés, **aucune boucle de redirection**. Si une boucle se produit, l'attribut `secure` du clear ne correspond pas à celui de la pose.

4. Restaurer : `UPDATE utilisateur SET date_desactivation = NULL WHERE email = '<son email>';`

- [ ] **Step 10: Commit**

```bash
git add apps/pilote-ppg/src/proxy.ts apps/pilote-ppg/src/server/authentification/
git commit -m "feat(auth): contrôle d'accès continu sur le statut du compte en base (PIL-1742)"
```

---

### Task 7 : Feature flip ProConnect

Suit le pattern d'ajout de flip du dépôt, tel qu'appliqué par le commit `9950e8183` : bloc convict, entrée dans la source de vérité, lecture côté client via `useEnv`.

**Files:**
- Modify: `apps/pilote-ppg/src/config.ts` (bloc `featureFlip`)
- Modify: `apps/pilote-ppg/src/server/gestion-contenu/domain/VariableContenuDisponible.ts` (interface + `FEATURE_FLIP_DEFINITIONS`)

**Interfaces:**
- Consumes: rien
- Produces: le flip `NEXT_PUBLIC_FF_PROCONNECT`, lisible côté client par `useEnv("NEXT_PUBLIC_FF_PROCONNECT")`

- [ ] **Step 1: Déclarer le flip dans la configuration**

Dans `src/config.ts`, à la fin du bloc `featureFlip` :

```ts
    proconnect: {
      format: Boolean,
      default: false,
      doc: "Affiche le bouton ProConnect sur l'écran de connexion",
      env: "NEXT_PUBLIC_FF_PROCONNECT",
    },
```

Défaut `false` : le flip protège la mise en production, il s'active explicitement.

- [ ] **Step 2: Déclarer le flip dans la source de vérité**

Dans `src/server/gestion-contenu/domain/VariableContenuDisponible.ts`, ajouter à l'interface `VARIABLE_CONTENU_DISPONIBLE` :

```ts
  NEXT_PUBLIC_FF_PROCONNECT: boolean;
```

Puis à la fin de `FEATURE_FLIP_DEFINITIONS` :

```ts
  {
    envKey: "NEXT_PUBLIC_FF_PROCONNECT",
    configKey: "proconnect",
    label: "Connexion ProConnect",
  },
```

- [ ] **Step 3: Vérifier**

```bash
cd apps/pilote-ppg && pnpm lint:tsc && pnpm test:server:unit
```

Attendu : aucune erreur. Le typage de `configKey` (`keyof FeatureFlipConfig`) garantit que le nom de la clé de config correspond bien au bloc ajouté au pas 1.

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-ppg/src/config.ts \
        apps/pilote-ppg/src/server/gestion-contenu/domain/VariableContenuDisponible.ts
git commit -m "feat(auth): feature flip d'affichage du bouton ProConnect (PIL-1744)"
```

---

### Task 8 : Écran de choix du mode de connexion

PIL-1744. La page porte aussi les messages d'erreur et de refus, ce qui satisfait d'un même geste « revenir au choix des modes après une erreur » et « le refus affiche une explication, le contact d'assistance, un accès au parcours Keycloak ».

**Attention — piège non évident :** `MiseEnPage` affiche `PageLanding` pour **tout** utilisateur non authentifié, sur **toutes** les routes. Sans l'exception du pas 4, la page `/connexion` ne s'affichera jamais.

**Files:**
- Create: `apps/pilote-ppg/src/client/components/PageConnexion/messagesConnexion.ts`
- Create: `apps/pilote-ppg/src/client/components/PageConnexion/PageConnexion.tsx`
- Create: `apps/pilote-ppg/src/pages/connexion.tsx`
- Modify: `apps/pilote-ppg/src/client/components/_commons/MiseEnPage/MiseEnPage.tsx:39`
- Test: `apps/pilote-ppg/src/client/components/PageConnexion/__tests__/messagesConnexion.unit.test.ts`

**Interfaces:**
- Consumes: `MotifRefusConnexion` (Task 4), le flip `NEXT_PUBLIC_FF_PROCONNECT` (Task 7)
- Produces: `messageDeConnexion({ motif, error }): string | null`, `PageConnexion`

Le test de ce composant porte sur la fonction de message, pas sur le rendu : la logique testable est là, et le projet `client` de vitest n'a pas de setup pour `next-auth/react` ni pour les hooks tRPC.

- [ ] **Step 1: Écrire le test des messages**

Créer `src/client/components/PageConnexion/__tests__/messagesConnexion.unit.test.ts` :

```ts
import { messageDeConnexion } from "@/client/components/PageConnexion/messagesConnexion";

describe("messageDeConnexion", () => {
  it("ne renvoie aucun message en l'absence de motif et d'erreur", () => {
    expect(messageDeConnexion({ motif: null, error: null })).toBeNull();
  });

  it("explique qu'aucun compte PILOTE ne correspond", () => {
    expect(messageDeConnexion({ motif: "compte_inconnu", error: null })).toContain(
      "aucun compte PILOTE",
    );
  });

  it("explique qu'un compte est désactivé", () => {
    expect(
      messageDeConnexion({ motif: "compte_desactive", error: null }),
    ).toContain("désactivé");
  });

  it("explique qu'aucune adresse électronique n'a été transmise", () => {
    expect(messageDeConnexion({ motif: "email_absent", error: null })).toContain(
      "adresse électronique",
    );
  });

  it("traite une erreur next-auth générique", () => {
    expect(messageDeConnexion({ motif: null, error: "Configuration" })).toContain(
      "connexion n'a pas abouti",
    );
  });

  it("ignore un motif inconnu plutôt que d'afficher une valeur brute", () => {
    expect(messageDeConnexion({ motif: "n_importe_quoi", error: null })).toContain(
      "connexion n'a pas abouti",
    );
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd apps/pilote-ppg && pnpm test:client:unit messagesConnexion
```

Attendu : ÉCHEC, le module n'existe pas.

- [ ] **Step 3: Écrire les messages**

Créer `src/client/components/PageConnexion/messagesConnexion.ts` :

```ts
const MESSAGE_GENERIQUE =
  "La connexion n'a pas abouti. Vous pouvez réessayer ci-dessous.";

const MESSAGES_PAR_MOTIF: Record<string, string> = {
  compte_inconnu:
    "Nous n'avons trouvé aucun compte PILOTE correspondant à votre adresse électronique. Votre compte doit avoir été créé au préalable par un administrateur.",
  compte_desactive:
    "Votre compte PILOTE est désactivé. Contactez l'assistance pour demander sa réactivation.",
  email_absent:
    "Le fournisseur d'identité n'a transmis aucune adresse électronique exploitable. Sans elle, nous ne pouvons pas retrouver votre compte PILOTE.",
};

export const messageDeConnexion = ({
  motif,
  error,
}: {
  motif: string | null;
  error: string | null;
}): string | null => {
  if (motif) {
    return MESSAGES_PAR_MOTIF[motif] ?? MESSAGE_GENERIQUE;
  }
  if (error) {
    return MESSAGE_GENERIQUE;
  }
  return null;
};
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

```bash
cd apps/pilote-ppg && pnpm test:client:unit messagesConnexion
```

Attendu : les 6 tests passent.

- [ ] **Step 5: Écrire le composant**

Créer `src/client/components/PageConnexion/PageConnexion.tsx` :

```tsx
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { FunctionComponent } from "react";
import { useEnv } from "@/client/hooks/useEnv";
import Titre from "@/components/_commons/Titre/Titre";
import { messageDeConnexion } from "./messagesConnexion";

const premierParametre = (valeur: string | string[] | undefined): string | null =>
  Array.isArray(valeur) ? (valeur[0] ?? null) : (valeur ?? null);

export const PageConnexion: FunctionComponent = () => {
  const { query } = useRouter();
  const ffProConnect = useEnv("NEXT_PUBLIC_FF_PROCONNECT");

  const callbackUrl = premierParametre(query.callbackUrl) ?? undefined;
  const message = messageDeConnexion({
    motif: premierParametre(query.motif),
    error: premierParametre(query.error),
  });

  return (
    <main>
      <div className="fr-container fr-py-8w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-6">
            <Titre baliseHtml="h1">Connexion à PILOTE</Titre>

            {message ? (
              <div className="fr-alert fr-alert--error fr-mb-4w" role="alert">
                <p>{message}</p>
                <p>
                  Besoin d'aide ?{" "}
                  <a className="fr-link" href="mailto:pilote@modernisation.gouv.fr">
                    pilote@modernisation.gouv.fr
                  </a>
                </p>
              </div>
            ) : null}

            {ffProConnect ? (
              <div className="fr-mb-4w">
                <button
                  className="proconnect-button"
                  onClick={() => signIn("proconnect", { callbackUrl })}
                  type="button"
                >
                  S'identifier avec ProConnect
                </button>
                <p className="fr-mt-1w fr-text--sm">
                  <a
                    className="fr-link"
                    href="https://proconnect.gouv.fr/"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Qu'est-ce que ProConnect ?
                  </a>
                </p>
              </div>
            ) : null}

            <button
              className="fr-btn fr-btn--secondary"
              onClick={() => signIn("keycloak", { callbackUrl })}
              type="button"
            >
              Se connecter avec une adresse électronique et un mot de passe
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
```

**Le bouton ProConnect doit respecter la charte DINUM.** Le markup et les styles officiels viennent du kit ProConnect (`https://github.com/proconnect-gouv/proconnect-documentation`, section « bouton ProConnect ») : intégrer la feuille de style et les assets du kit, et remplacer la classe `proconnect-button` par celle du kit. Le rendu ci-dessus est un placeholder fonctionnel, **pas** une implémentation conforme — le faire valider visuellement avant la mise en production.

- [ ] **Step 6: Écrire la page**

Créer `src/pages/connexion.tsx` :

```tsx
import Head from "next/head";
import { GetServerSideProps } from "next";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { PageConnexion } from "@/client/components/PageConnexion/PageConnexion";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);

  if (session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  return { props: {} };
};

const NextPageConnexion: FunctionComponent = () => (
  <>
    <Head>
      <title>Connexion - PILOTE</title>
    </Head>
    <PageConnexion />
  </>
);

export default NextPageConnexion;
```

`export default` est imposé par le pages router de Next — c'est l'exception documentée dans les Global Constraints.

- [ ] **Step 7: Excepter la page dans MiseEnPage**

Dans `src/client/components/_commons/MiseEnPage/MiseEnPage.tsx`, ajouter l'import et la condition :

```tsx
import { useRouter } from "next/router";
```

```tsx
  const { pathname } = useRouter();
  const estPageDeConnexion = pathname === "/connexion";
```

Puis remplacer la ligne 38-39 :

```tsx
          {status === "unauthenticated" && !estPageDeConnexion ? (
            <PageLanding />
          ) : (
```

Sans cette exception, `MiseEnPage` substitue `PageLanding` au contenu de toute page vue par un utilisateur non authentifié — donc `/connexion` afficherait la landing.

- [ ] **Step 8: Vérifier manuellement**

```bash
cd apps/pilote-ppg && pnpm dev
```

Ouvrir `https://pilote.modernisation.localhost/connexion` en navigation privée.

Attendu, flip désactivé : seul le bouton « adresse électronique et mot de passe » s'affiche.
Puis activer `NEXT_PUBLIC_FF_PROCONNECT=true` et recharger : les deux boutons s'affichent.
Enfin, ouvrir `/connexion?motif=compte_desactive` : le message de compte désactivé et le contact d'assistance s'affichent **au-dessus des boutons**, celui de Keycloak compris.

- [ ] **Step 9: Lancer les tests et le typecheck**

```bash
cd apps/pilote-ppg && pnpm test:client:unit && pnpm lint
```

Attendu : tout passe.

- [ ] **Step 10: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PageConnexion \
        apps/pilote-ppg/src/pages/connexion.tsx \
        apps/pilote-ppg/src/client/components/_commons/MiseEnPage/MiseEnPage.tsx
git commit -m "feat(auth): écran de choix du mode de connexion (PIL-1744)"
```

---

### Task 9 : Brancher les points d'entrée

Dernier maillon : tous les « Se connecter » ouvrent l'écran de choix, et next-auth y renvoie ses propres erreurs.

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/_commons/BoutonSeConnecter.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageLanding/PageLanding.tsx:42`
- Modify: `apps/pilote-ppg/src/server/infrastructure/api/auth/[...nextauth].tsx` (ajout de `pages` dans `authConfig`)
- Test: `apps/pilote-ppg/tests/connexion.spec.ts`

**Interfaces:**
- Consumes: la page `/connexion` (Task 8)
- Produces: rien

- [ ] **Step 1: Rediriger le bouton d'en-tête**

Remplacer `src/client/components/_commons/BoutonSeConnecter.tsx` :

```tsx
import Link from "next/link";
import { Icone } from "@/components/_commons/Icone";
import { Account1Icon } from "@/components/_commons/Icones/Account1Icon";

export const BoutonSeConnecter = () => (
  <Link
    className="flex gap-2 !p-0 !text-primary"
    href="/connexion"
    title="Se connecter"
  >
    <Icone icone={Account1Icon} />
    Se connecter
  </Link>
);
```

- [ ] **Step 2: Rediriger le bouton de la landing**

Dans `src/client/components/PageLanding/PageLanding.tsx`, remplacer le `<button>` ligne 40-46 par :

```tsx
                <Link className="fr-btn fr-mr-2w rounded" href="/connexion">
                  Se connecter
                </Link>
```

`Link` est déjà importé dans ce fichier. Supprimer l'import `signIn` de `next-auth/react`, devenu inutile.

- [ ] **Step 3: Déclarer les pages next-auth**

Dans `src/server/infrastructure/api/auth/[...nextauth].tsx`, ajouter à `authConfig`, juste après `trustHost: true` :

```ts
  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },
```

`signIn` évite l'écran de choix par défaut de next-auth ; `error` fait revenir toute erreur de fournisseur sur l'écran de choix, ce qu'exige PIL-1744.

- [ ] **Step 4: Écrire le test e2e**

Créer `tests/connexion.spec.ts` :

```ts
import { test, expect } from "@playwright/test";

test.describe("Écran de choix du mode de connexion", () => {
  test("le bouton Se connecter de la landing ouvre l'écran de choix", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Se connecter" }).first().click();

    await expect(page).toHaveURL(/\/connexion/);
    await expect(
      page.getByRole("heading", { name: "Connexion à PILOTE" }),
    ).toBeVisible();
  });

  test("le parcours mot de passe reste accessible depuis l'écran de choix", async ({
    page,
  }) => {
    await page.goto("/connexion");

    await expect(
      page.getByRole("button", {
        name: "Se connecter avec une adresse électronique et un mot de passe",
      }),
    ).toBeVisible();
  });

  test("un refus affiche une explication et le contact d'assistance", async ({
    page,
  }) => {
    await page.goto("/connexion?motif=compte_desactive");

    await expect(page.getByRole("alert")).toContainText("désactivé");
    await expect(page.getByRole("alert")).toContainText(
      "pilote@modernisation.gouv.fr",
    );
    await expect(
      page.getByRole("button", {
        name: "Se connecter avec une adresse électronique et un mot de passe",
      }),
    ).toBeVisible();
  });

  test("une page protégée redirige vers l'écran de choix en conservant la destination", async ({
    page,
  }) => {
    await page.goto("/accueil/chantier/NAT-FR");

    await expect(page).toHaveURL(
      /\/connexion\?callbackUrl=%2Faccueil%2Fchantier%2FNAT-FR/,
    );
  });
});
```

Le dernier test suppose un contexte non authentifié. Si la configuration Playwright du dépôt applique un `storageState` authentifié par défaut, ajouter `test.use({ storageState: { cookies: [], origins: [] } })` en tête du `describe`.

- [ ] **Step 5: Lancer les tests e2e**

```bash
cd apps/pilote-ppg && pnpm test:e2e connexion
```

Attendu : les 4 tests passent. Le bouton ProConnect n'est pas testé ici : le flip est à `false` par défaut, et l'environnement e2e tourne en `DEV_PASSWORD`.

- [ ] **Step 6: Vérifier la non-régression Keycloak**

```bash
cd apps/pilote-ppg && pnpm test:e2e
```

Attendu : la suite complète passe, `login.spec.ts` compris. Si `login.spec.ts` échoue parce qu'il cliquait un bouton qui est devenu un lien, l'adapter au nouveau parcours — c'est explicitement ce que demande PIL-1743 (« les tests de non-régression du parcours Keycloak sont adaptés au nouvel écran de choix »).

- [ ] **Step 7: Vérifier qu'aucune fixture e2e n'est désactivée**

```bash
cd apps/pilote-ppg && grep -rn "date_desactivation" tests/
```

Attendu : aucune fixture d'utilisateur servant à se connecter ne porte de `date_desactivation`. Le cas échéant, le nouveau `proxy.ts` l'éjecterait — corriger la fixture.

- [ ] **Step 8: Vérification finale**

```bash
cd apps/pilote-ppg && pnpm lint && pnpm test:server && pnpm test:client && pnpm test:e2e
```

Attendu : tout passe.

- [ ] **Step 9: Commit**

```bash
git add apps/pilote-ppg/src/client apps/pilote-ppg/tests \
        "apps/pilote-ppg/src/server/infrastructure/api/auth/[...nextauth].tsx"
git commit -m "feat(auth): tous les points d'entrée ouvrent l'écran de choix (PIL-1743, PIL-1744)"
```

---

## Points à signaler à la relecture

Ces éléments sont identifiés dans la spec et **ne sont pas traités par ce plan**. Les remonter en refinement plutôt que de les traiter en silence :

- **Le lien PPG → PMB force `provider=keycloak`** (branche `feat/mb-ppg-pmb-sso-auto-login`, `mb-webapp/src/main.tsx`). Un utilisateur connecté en ProConnect qui clique « Pilote Marque Blanche » s'authentifiera une seconde fois. Aucune des trois US ne le couvre.
- **La suppression de l'introspection Keycloak (Task 6) modifie le parcours Keycloak**, alors que PIL-1743 demande qu'il soit inchangé. Décision assumée, à défendre.
- **Le volume d'utilisateurs dont l'email PPG ne correspondra pas à leur email ProConnect est inconnu.** Requête SQL à passer avant la mise en service.
- **Le bouton ProConnect (Task 8, pas 5) est un placeholder fonctionnel**, pas une intégration conforme à la charte DINUM.
