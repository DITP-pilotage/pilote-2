# PIL-1871 — Accès Albert gérés en base : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (exécution inline). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer `ASK_AI_TERRITOIRE_EMAILS` et les `NEXT_PUBLIC_FF_ASK_AI_<PROFIL>` par deux tables administrables depuis le panel Albert, avec une règle d'accès calculée côté serveur.

**Architecture:** Nouveau module serveur `src/server/albert-access/` (règle pure + port repository + adapter Prisma + use cases + router tRPC `albertAccess`), consommé par le `getServerSideProps` de la page territoire et par `api/albert/chat`. Côté client, deux onglets dans `AlbertPanel` et un composant générique `shared/SearchPicker` (Radix Popover + `cmdk`).

**Tech Stack:** Next.js (pages + app router), tRPC, Prisma 7 / PostgreSQL, Vitest (+ vitest-mock-extended), Radix UI, cmdk, Tailwind, sonner.

**Spec:** `apps/pilote-ppg/docs/superpowers/specs/2026-10-15-pil-1871-acces-albert-design.md`

## Global Constraints

- Toutes les commandes partent de la racine du repo (`/Users/jordantaillefer/Documents/Missions/Projets/pilote-2`), jamais de `cd` dans un sous-dossier : `pnpm -C apps/pilote-ppg <script>`.
- pnpm uniquement, jamais npm.
- Nommage : technique en anglais, termes domaine (`profil`, `utilisateur`, `nom`, `prenom`) en français ; pas d'accents dans les chemins ni les identifiants créés.
- Exports nommés uniquement (sauf pages Next).
- Pas de `as never`, pas de `as unknown as X`.
- Pas de commentaires explicatifs superflus.
- UI : Tailwind + composants `src/client/components/shared/`, pas de classes `fr-*`, pas de couleurs en dur (tokens `dsfr-*` / `primary`).
- Pas de tests front.
- Toute lecture/écriture des permissions réservée à `DITP_ADMIN`.
- `NEXT_PUBLIC_FF_ASK_AI` reste le kill switch global (s'applique aussi à `DITP_ADMIN`).
- Scénarios DITP seulement pour `DITP_ADMIN` et `DITP_PILOTAGE` ; tous les autres profils → scénarios coordinateur.
- Lint ppg avant chaque commit : `pnpm -C apps/pilote-ppg lint` (prisma generate + oxlint + tsc + prettier).
- Commits au format commit-billable : titre `[DITP-pilotage/pilote-2] feature(PIL-1871): …`, trailers `Refs: PIL-1871`, `Project: pilote-2`, `Client: DITP-pilotage`, `Category: feature`, `Stack`, `Tags`, `Files-changed`. Pas de Co-Authored-By.
- Ne rien faire sur les conteneurs Docker de la base : si la base est injoignable, demander à l'utilisateur de vérifier que Docker est allumé.

## Review Focus

- Utilisateur désactivé (`date_desactivation` non nul) : ne doit pas sortir dans la recherche — testé dans Task 2.
- Recherche avec majuscules ou espaces autour (« Jean.Dupont@ ») : insensible à la casse et trimée — testé dans Task 2 (casse) et Task 3 (trim / longueur min).
- Ajout d'un utilisateur déjà présent (double clic, deux onglets) : idempotent, pas d'erreur 500 — testé dans Task 2.
- Utilisateur supprimé de Pilote alors qu'il est autorisé : la ligne d'accès disparaît en cascade — testé dans Task 2.
- Session sans profil (`profil` null/undefined) : pas d'accès, scénarios coordinateur, pas de crash — testé dans Task 1.

---

### Task 1: Règle d'accès pure `checkAlbertAccess`

**Files:**
- Create: `apps/pilote-ppg/src/server/albert-access/domain/checkAlbertAccess.ts`
- Test: `apps/pilote-ppg/src/server/albert-access/__tests__/domain/checkAlbertAccess.unit.test.ts`

**Interfaces:**
- Produces:
  - `type AlbertScenarios = "ditp" | "coordinateur"`
  - `interface AlbertAccess { peutUtiliser: boolean; scenarios: AlbertScenarios }`
  - `checkAlbertAccess(params: { killSwitch: boolean; profil: string | null; profilActive: boolean; utilisateurAutorise: boolean }): AlbertAccess`

- [ ] **Step 1: Write the failing test**

```ts
import { checkAlbertAccess } from "@/server/albert-access/domain/checkAlbertAccess";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

const aucunAcces = {
  killSwitch: true,
  profilActive: false,
  utilisateurAutorise: false,
};

describe("checkAlbertAccess", () => {
  it("refuse tout le monde quand le kill switch est coupé, DITP_ADMIN compris", () => {
    const result = checkAlbertAccess({
      killSwitch: false,
      profil: ProfilEnum.DITP_ADMIN,
      profilActive: true,
      utilisateurAutorise: true,
    });

    expect(result.peutUtiliser).toBe(false);
  });

  it("autorise toujours DITP_ADMIN, sans aucune permission en base", () => {
    const result = checkAlbertAccess({
      ...aucunAcces,
      profil: ProfilEnum.DITP_ADMIN,
    });

    expect(result.peutUtiliser).toBe(true);
  });

  it("autorise un utilisateur dont le profil est activé", () => {
    const result = checkAlbertAccess({
      ...aucunAcces,
      profil: ProfilEnum.COORDINATEUR_REGION,
      profilActive: true,
    });

    expect(result.peutUtiliser).toBe(true);
  });

  it("autorise un utilisateur autorisé individuellement", () => {
    const result = checkAlbertAccess({
      ...aucunAcces,
      profil: ProfilEnum.PREFET_REGION,
      utilisateurAutorise: true,
    });

    expect(result.peutUtiliser).toBe(true);
  });

  it("refuse un utilisateur ni activé par son profil ni autorisé individuellement", () => {
    const result = checkAlbertAccess({
      ...aucunAcces,
      profil: ProfilEnum.DITP_PILOTAGE,
    });

    expect(result.peutUtiliser).toBe(false);
  });

  it("refuse une session sans profil et lui attribue les scénarios coordinateur", () => {
    const result = checkAlbertAccess({ ...aucunAcces, profil: null });

    expect(result).toEqual({ peutUtiliser: false, scenarios: "coordinateur" });
  });

  it.each([ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE])(
    "propose les scénarios DITP au profil %s",
    (profil) => {
      expect(checkAlbertAccess({ ...aucunAcces, profil }).scenarios).toBe(
        "ditp",
      );
    },
  );

  it.each([
    ProfilEnum.EQUIPE_DIR_PROJET,
    ProfilEnum.COORDINATEUR_REGION,
    ProfilEnum.COORDINATEUR_DEPARTEMENT,
    ProfilEnum.PREFET_DEPARTEMENT,
  ])("propose les scénarios coordinateur au profil %s", (profil) => {
    expect(checkAlbertAccess({ ...aucunAcces, profil }).scenarios).toBe(
      "coordinateur",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C apps/pilote-ppg exec vitest run --project server-unit src/server/albert-access/__tests__/domain/checkAlbertAccess.unit.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Write minimal implementation**

```ts
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

export type AlbertScenarios = "ditp" | "coordinateur";

export interface AlbertAccess {
  peutUtiliser: boolean;
  scenarios: AlbertScenarios;
}

const PROFILS_SCENARIOS_DITP: ReadonlySet<string> = new Set([
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.DITP_PILOTAGE,
]);

export const checkAlbertAccess = ({
  killSwitch,
  profil,
  profilActive,
  utilisateurAutorise,
}: {
  killSwitch: boolean;
  profil: string | null;
  profilActive: boolean;
  utilisateurAutorise: boolean;
}): AlbertAccess => ({
  peutUtiliser:
    killSwitch &&
    (profil === ProfilEnum.DITP_ADMIN || profilActive || utilisateurAutorise),
  scenarios:
    profil !== null && PROFILS_SCENARIOS_DITP.has(profil)
      ? "ditp"
      : "coordinateur",
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: même commande qu'au Step 2. Expected: PASS.

- [ ] **Step 5: Commit** (après `pnpm -C apps/pilote-ppg lint`)

```bash
git add apps/pilote-ppg/src/server/albert-access
git commit  # titre : [DITP-pilotage/pilote-2] feature(PIL-1871): règle d'accès Albert pure (profil, utilisateur, kill switch)
```

---

### Task 2: Tables, port et repository Prisma

**Files:**
- Modify: `apps/pilote-ppg/src/database/prisma/schema.prisma` (modèles `profil`, `utilisateur` + 2 nouveaux modèles)
- Create: `apps/pilote-ppg/src/database/prisma/migrations/20261015000000_albert_access/migration.sql`
- Create: `apps/pilote-ppg/src/server/albert-access/domain/ports/AlbertAccessRepository.ts`
- Create: `apps/pilote-ppg/src/server/albert-access/infrastructure/adapters/PrismaAlbertAccessRepository.ts`
- Test: `apps/pilote-ppg/src/server/albert-access/__tests__/infrastructure/adapters/PrismaAlbertAccessRepository.integration.test.ts`

**Interfaces:**
- Produces (port) :

```ts
export interface ProfilAccess {
  code: string;
  nom: string;
  active: boolean;
}

export interface UtilisateurAccess {
  utilisateurId: string;
  email: string;
  nom: string;
  prenom: string;
  profilCode: string;
  profilNom: string;
  autoriseViaProfil: boolean;
}

export interface UtilisateurSearchResult extends UtilisateurAccess {
  dejaAjoute: boolean;
}

export interface AlbertAccessRepository {
  listProfils(): Promise<ProfilAccess[]>;
  setProfilActive(profilCode: string, active: boolean): Promise<void>;
  listUtilisateurs(): Promise<UtilisateurAccess[]>;
  searchUtilisateurs(email: string, limit: number): Promise<UtilisateurSearchResult[]>;
  findUtilisateurProfil(utilisateurId: string): Promise<string | null>;
  addUtilisateur(utilisateurId: string): Promise<void>;
  removeUtilisateur(utilisateurId: string): Promise<void>;
  getAccessFlags(utilisateurId: string, profil: string | null): Promise<{ profilActive: boolean; utilisateurAutorise: boolean }>;
}
```

- [ ] **Step 1: Schéma Prisma**

Dans `schema.prisma`, ajouter le champ de relation inverse dans `model profil` (après `utilisateur utilisateur[]`) :

```prisma
  albert_access_profil                            albert_access_profil?
```

et dans `model utilisateur` (à la fin des champs de relation) :

```prisma
  albert_access_utilisateur              albert_access_utilisateur?
```

puis les deux modèles :

```prisma
model albert_access_profil {
  profil_code   String   @id
  profil        profil   @relation(fields: [profil_code], references: [code], onDelete: Cascade, onUpdate: Cascade)
  date_creation DateTime @default(now())

  @@schema("public")
}

model albert_access_utilisateur {
  utilisateur_id String      @id @db.Uuid
  utilisateur    utilisateur @relation(fields: [utilisateur_id], references: [id], onDelete: Cascade)
  date_creation  DateTime    @default(now())

  @@schema("public")
}
```

- [ ] **Step 2: Migration SQL**

`migrations/20261015000000_albert_access/migration.sql` :

```sql
-- Accès à l'assistant IA (Albert) par profil : un profil est activé si sa ligne existe.
CREATE TABLE "albert_access_profil" (
    "profil_code" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "albert_access_profil_pkey" PRIMARY KEY ("profil_code")
);

-- Accès à l'assistant IA accordés individuellement à des utilisateurs.
CREATE TABLE "albert_access_utilisateur" (
    "utilisateur_id" UUID NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "albert_access_utilisateur_pkey" PRIMARY KEY ("utilisateur_id")
);

ALTER TABLE "albert_access_profil" ADD CONSTRAINT "albert_access_profil_profil_code_fkey" FOREIGN KEY ("profil_code") REFERENCES "profil"("code") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "albert_access_utilisateur" ADD CONSTRAINT "albert_access_utilisateur_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

Vérifier la cohérence schéma ↔ migration : `pnpm -C apps/pilote-ppg exec prisma migrate diff --from-migrations src/database/prisma/migrations --to-schema src/database/prisma/schema.prisma --script` doit sortir un script vide (si la commande exige une shadow database, se contenter de l'étape suivante). Puis appliquer sur la base de test : `pnpm -C apps/pilote-ppg test:database:init` (si la base est injoignable : demander à l'utilisateur de vérifier Docker).

- [ ] **Step 3: Port** — créer `domain/ports/AlbertAccessRepository.ts` avec exactement le bloc « Produces (port) » ci-dessus.

- [ ] **Step 4: Write the failing integration test**

```ts
import { PrismaAlbertAccessRepository } from "@/server/albert-access/infrastructure/adapters/PrismaAlbertAccessRepository";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PilotePrismaClient } from "@/server/framework/persistence/PrismaTransaction";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

const COORDINATEUR_ID = "c57f3b57-f4d7-40e2-81fe-65e27fbd8ad0";
const PREFET_ID = "d1e776ad-af24-4320-bef9-7367d0373cad";
const ADMIN_ID = "eb735d0d-8249-496c-9c54-a2d502405950";
const DESACTIVE_ID = "dce03af2-e6c6-4f9c-8162-6afb98de6318";

describe("PrismaAlbertAccessRepository", () => {
  let repository: PrismaAlbertAccessRepository;
  let prisma: PilotePrismaClient;

  beforeEach(() => {
    const prismaPilote = new PrismaPilote();
    prisma = prismaPilote.getInstance();
    repository = new PrismaAlbertAccessRepository({ prisma: prismaPilote });
  });

  const creerUtilisateurs = () =>
    prisma.utilisateur.createMany({
      data: [
        {
          id: COORDINATEUR_ID,
          email: "jean.dupont@test.com",
          nom: "Dupont",
          prenom: "Jean",
          profilCode: ProfilEnum.COORDINATEUR_REGION,
          date_creation: new Date(),
        },
        {
          id: PREFET_ID,
          email: "jeanne.martin@test.com",
          nom: "Martin",
          prenom: "Jeanne",
          profilCode: ProfilEnum.PREFET_REGION,
          date_creation: new Date(),
        },
        {
          id: ADMIN_ID,
          email: "jean.admin@test.com",
          nom: "Admin",
          prenom: "Jean",
          profilCode: ProfilEnum.DITP_ADMIN,
          date_creation: new Date(),
        },
        {
          id: DESACTIVE_ID,
          email: "jean.desactive@test.com",
          nom: "Desactive",
          prenom: "Jean",
          profilCode: ProfilEnum.PREFET_REGION,
          date_creation: new Date(),
          date_desactivation: new Date(),
        },
      ],
    });

  describe("profils", () => {
    it(
      "Doit lister les profils sans DITP_ADMIN, inactifs par défaut",
      createIntegrationTest(async () => {
        const profils = await repository.listProfils();

        expect(profils.map((p) => p.code)).not.toContain(ProfilEnum.DITP_ADMIN);
        expect(profils.map((p) => p.code)).toEqual(
          expect.arrayContaining([
            ProfilEnum.COORDINATEUR_REGION,
            ProfilEnum.COORDINATEUR_DEPARTEMENT,
          ]),
        );
        expect(profils.every((p) => !p.active)).toBe(true);
      }),
    );

    it(
      "Doit activer puis désactiver un profil",
      createIntegrationTest(async () => {
        await repository.setProfilActive(ProfilEnum.COORDINATEUR_REGION, true);
        await repository.setProfilActive(ProfilEnum.COORDINATEUR_REGION, true);

        let profils = await repository.listProfils();
        expect(
          profils.find((p) => p.code === ProfilEnum.COORDINATEUR_REGION)?.active,
        ).toBe(true);

        await repository.setProfilActive(ProfilEnum.COORDINATEUR_REGION, false);

        profils = await repository.listProfils();
        expect(
          profils.find((p) => p.code === ProfilEnum.COORDINATEUR_REGION)?.active,
        ).toBe(false);
      }),
    );
  });

  describe("utilisateurs", () => {
    it(
      "Doit ajouter un utilisateur de façon idempotente et le lister",
      createIntegrationTest(async () => {
        await creerUtilisateurs();

        await repository.addUtilisateur(PREFET_ID);
        await repository.addUtilisateur(PREFET_ID);

        const utilisateurs = await repository.listUtilisateurs();
        expect(utilisateurs).toEqual([
          {
            utilisateurId: PREFET_ID,
            email: "jeanne.martin@test.com",
            nom: "Martin",
            prenom: "Jeanne",
            profilCode: ProfilEnum.PREFET_REGION,
            profilNom: expect.any(String),
            autoriseViaProfil: false,
          },
        ]);
      }),
    );

    it(
      "Doit signaler un utilisateur déjà autorisé via son profil",
      createIntegrationTest(async () => {
        await creerUtilisateurs();
        await repository.addUtilisateur(COORDINATEUR_ID);
        await repository.setProfilActive(ProfilEnum.COORDINATEUR_REGION, true);

        const [utilisateur] = await repository.listUtilisateurs();

        expect(utilisateur.autoriseViaProfil).toBe(true);
      }),
    );

    it(
      "Doit retirer un utilisateur",
      createIntegrationTest(async () => {
        await creerUtilisateurs();
        await repository.addUtilisateur(PREFET_ID);

        await repository.removeUtilisateur(PREFET_ID);

        expect(await repository.listUtilisateurs()).toEqual([]);
      }),
    );

    it(
      "Doit supprimer l'accès en cascade quand l'utilisateur est supprimé",
      createIntegrationTest(async () => {
        await creerUtilisateurs();
        await repository.addUtilisateur(PREFET_ID);

        await prisma.utilisateur.delete({ where: { id: PREFET_ID } });

        expect(await prisma.albert_access_utilisateur.count()).toBe(0);
      }),
    );

    it(
      "Doit retrouver le profil d'un utilisateur, null s'il est inconnu",
      createIntegrationTest(async () => {
        await creerUtilisateurs();

        expect(await repository.findUtilisateurProfil(ADMIN_ID)).toBe(
          ProfilEnum.DITP_ADMIN,
        );
        expect(
          await repository.findUtilisateurProfil(
            "00000000-0000-0000-0000-000000000000",
          ),
        ).toBeNull();
      }),
    );
  });

  describe("searchUtilisateurs", () => {
    it(
      "Doit chercher sans tenir compte de la casse, sans DITP_ADMIN ni utilisateur désactivé",
      createIntegrationTest(async () => {
        await creerUtilisateurs();
        await repository.addUtilisateur(PREFET_ID);
        await repository.setProfilActive(ProfilEnum.COORDINATEUR_REGION, true);

        const resultats = await repository.searchUtilisateurs("JEAN", 10);

        expect(
          resultats.map(({ email, dejaAjoute, autoriseViaProfil }) => ({
            email,
            dejaAjoute,
            autoriseViaProfil,
          })),
        ).toEqual([
          {
            email: "jean.dupont@test.com",
            dejaAjoute: false,
            autoriseViaProfil: true,
          },
          {
            email: "jeanne.martin@test.com",
            dejaAjoute: true,
            autoriseViaProfil: false,
          },
        ]);
      }),
    );

    it(
      "Doit limiter le nombre de résultats",
      createIntegrationTest(async () => {
        await creerUtilisateurs();

        expect(await repository.searchUtilisateurs("jean", 1)).toHaveLength(1);
      }),
    );
  });

  describe("getAccessFlags", () => {
    it(
      "Doit indiquer profil activé et autorisation individuelle",
      createIntegrationTest(async () => {
        await creerUtilisateurs();
        await repository.setProfilActive(ProfilEnum.COORDINATEUR_REGION, true);
        await repository.addUtilisateur(PREFET_ID);

        expect(
          await repository.getAccessFlags(
            COORDINATEUR_ID,
            ProfilEnum.COORDINATEUR_REGION,
          ),
        ).toEqual({ profilActive: true, utilisateurAutorise: false });
        expect(
          await repository.getAccessFlags(PREFET_ID, ProfilEnum.PREFET_REGION),
        ).toEqual({ profilActive: false, utilisateurAutorise: true });
        expect(await repository.getAccessFlags(PREFET_ID, null)).toEqual({
          profilActive: false,
          utilisateurAutorise: true,
        });
      }),
    );
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `pnpm -C apps/pilote-ppg exec vitest run --project server-integration src/server/albert-access`
Expected: FAIL (adapter introuvable).

- [ ] **Step 6: Implementation**

```ts
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PilotePrismaClient } from "@/server/framework/persistence/PrismaTransaction";
import {
  AlbertAccessRepository,
  ProfilAccess,
  UtilisateurAccess,
  UtilisateurSearchResult,
} from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

const UTILISATEUR_SELECT = {
  id: true,
  email: true,
  nom: true,
  prenom: true,
  profilCode: true,
  profil: {
    select: { nom: true, albert_access_profil: { select: { profil_code: true } } },
  },
} as const;

type UtilisateurRow = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profilCode: string;
  profil: { nom: string; albert_access_profil: { profil_code: string } | null };
};

const toUtilisateurAccess = (utilisateur: UtilisateurRow): UtilisateurAccess => ({
  utilisateurId: utilisateur.id,
  email: utilisateur.email,
  nom: utilisateur.nom,
  prenom: utilisateur.prenom,
  profilCode: utilisateur.profilCode,
  profilNom: utilisateur.profil.nom,
  autoriseViaProfil: utilisateur.profil.albert_access_profil !== null,
});

export class PrismaAlbertAccessRepository implements AlbertAccessRepository {
  private prisma: PilotePrismaClient;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma.getInstance();
  }

  async listProfils(): Promise<ProfilAccess[]> {
    const profils = await this.prisma.profil.findMany({
      where: { code: { not: ProfilEnum.DITP_ADMIN } },
      select: {
        code: true,
        nom: true,
        albert_access_profil: { select: { profil_code: true } },
      },
      orderBy: { nom: "asc" },
    });
    return profils.map((profil) => ({
      code: profil.code,
      nom: profil.nom,
      active: profil.albert_access_profil !== null,
    }));
  }

  async setProfilActive(profilCode: string, active: boolean): Promise<void> {
    if (active) {
      await this.prisma.albert_access_profil.upsert({
        where: { profil_code: profilCode },
        create: { profil_code: profilCode },
        update: {},
      });
      return;
    }
    await this.prisma.albert_access_profil.deleteMany({
      where: { profil_code: profilCode },
    });
  }

  async listUtilisateurs(): Promise<UtilisateurAccess[]> {
    const acces = await this.prisma.albert_access_utilisateur.findMany({
      orderBy: { date_creation: "desc" },
      select: { utilisateur: { select: UTILISATEUR_SELECT } },
    });
    return acces.map(({ utilisateur }) => toUtilisateurAccess(utilisateur));
  }

  async searchUtilisateurs(
    email: string,
    limit: number,
  ): Promise<UtilisateurSearchResult[]> {
    const utilisateurs = await this.prisma.utilisateur.findMany({
      where: {
        email: { contains: email, mode: "insensitive" },
        profilCode: { not: ProfilEnum.DITP_ADMIN },
        date_desactivation: null,
      },
      orderBy: { email: "asc" },
      take: limit,
      select: {
        ...UTILISATEUR_SELECT,
        albert_access_utilisateur: { select: { utilisateur_id: true } },
      },
    });
    return utilisateurs.map((utilisateur) => ({
      ...toUtilisateurAccess(utilisateur),
      dejaAjoute: utilisateur.albert_access_utilisateur !== null,
    }));
  }

  async findUtilisateurProfil(utilisateurId: string): Promise<string | null> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { profilCode: true },
    });
    return utilisateur?.profilCode ?? null;
  }

  async addUtilisateur(utilisateurId: string): Promise<void> {
    await this.prisma.albert_access_utilisateur.upsert({
      where: { utilisateur_id: utilisateurId },
      create: { utilisateur_id: utilisateurId },
      update: {},
    });
  }

  async removeUtilisateur(utilisateurId: string): Promise<void> {
    await this.prisma.albert_access_utilisateur.deleteMany({
      where: { utilisateur_id: utilisateurId },
    });
  }

  async getAccessFlags(
    utilisateurId: string,
    profil: string | null,
  ): Promise<{ profilActive: boolean; utilisateurAutorise: boolean }> {
    const accesProfil =
      profil === null
        ? null
        : await this.prisma.albert_access_profil.findUnique({
            where: { profil_code: profil },
          });
    const accesUtilisateur =
      await this.prisma.albert_access_utilisateur.findUnique({
        where: { utilisateur_id: utilisateurId },
      });
    return {
      profilActive: accesProfil !== null,
      utilisateurAutorise: accesUtilisateur !== null,
    };
  }
}
```

Si `UtilisateurRow` diverge du type inféré par Prisma, le remplacer par `Prisma.utilisateurGetPayload<{ select: typeof UTILISATEUR_SELECT }>` (import `Prisma` depuis `@prisma/client`).

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm -C apps/pilote-ppg exec vitest run --project server-integration src/server/albert-access`
Expected: PASS.

- [ ] **Step 8: Commit** (après lint) — titre : `… feature(PIL-1871): tables et repository des accès Albert`.

---

### Task 3: Use cases et module `albertAccess`

**Files:**
- Create: `apps/pilote-ppg/src/server/albert-access/module.ts`
- Create: `apps/pilote-ppg/src/server/albert-access/usecases/{ListProfilsUseCase,SetProfilActiveUseCase,ListUtilisateursUseCase,SearchUtilisateursUseCase,AddUtilisateurUseCase,RemoveUtilisateurUseCase,CheckAlbertAccessUseCase}.ts`
- Modify: `apps/pilote-ppg/src/server/module-system/moduleNames.ts` (ajouter `"albertAccess"`)
- Modify: `apps/pilote-ppg/src/server/dependances.ts` (import + `allModules` + `registerContainer`)
- Test: `apps/pilote-ppg/src/server/albert-access/__tests__/usecases/{SetProfilActiveUseCase,AddUtilisateurUseCase,SearchUtilisateursUseCase}.unit.test.ts`

**Interfaces:**
- Consumes: `AlbertAccessRepository` (Task 2), `checkAlbertAccess` / `AlbertAccess` (Task 1), `recupererToutesLesVariablesContenuUseCase` (export du module `gestionContenu`, type `GestionContenuExports`).
- Produces (cradle `albertAccess`) :
  - `listProfilsUseCase.execute(): Promise<ProfilAccess[]>`
  - `setProfilActiveUseCase.execute({ profilCode, active }): Promise<void>` — `BadRequestError` si `DITP_ADMIN`
  - `listUtilisateursUseCase.execute(): Promise<UtilisateurAccess[]>`
  - `searchUtilisateursUseCase.execute({ email }): Promise<UtilisateurSearchResult[]>` — `[]` si moins de 3 caractères après trim, limite 10
  - `addUtilisateurUseCase.execute({ utilisateurId }): Promise<void>` — `NotFoundError` si inconnu, `BadRequestError` si `DITP_ADMIN`
  - `removeUtilisateurUseCase.execute({ utilisateurId }): Promise<void>`
  - `checkAlbertAccessUseCase.execute({ utilisateurId, profil }): Promise<AlbertAccess>`

- [ ] **Step 1: Write the failing tests**

`SetProfilActiveUseCase.unit.test.ts` :

```ts
import { mock, MockProxy } from "vitest-mock-extended";
import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import { SetProfilActiveUseCase } from "@/server/albert-access/usecases/SetProfilActiveUseCase";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

describe("SetProfilActiveUseCase", () => {
  let albertAccessRepository: MockProxy<AlbertAccessRepository>;
  let useCase: SetProfilActiveUseCase;

  beforeEach(() => {
    albertAccessRepository = mock<AlbertAccessRepository>();
    useCase = new SetProfilActiveUseCase({ albertAccessRepository });
  });

  it("Doit activer un profil", async () => {
    await useCase.execute({
      profilCode: ProfilEnum.COORDINATEUR_REGION,
      active: true,
    });

    expect(albertAccessRepository.setProfilActive).toHaveBeenCalledWith(
      ProfilEnum.COORDINATEUR_REGION,
      true,
    );
  });

  it("Doit refuser de modifier DITP_ADMIN", async () => {
    await expect(
      useCase.execute({ profilCode: ProfilEnum.DITP_ADMIN, active: false }),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(albertAccessRepository.setProfilActive).not.toHaveBeenCalled();
  });
});
```

`AddUtilisateurUseCase.unit.test.ts` :

```ts
import { mock, MockProxy } from "vitest-mock-extended";
import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import { AddUtilisateurUseCase } from "@/server/albert-access/usecases/AddUtilisateurUseCase";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import { NotFoundError } from "@/shared/errors/not-found-error";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

const UTILISATEUR_ID = "c57f3b57-f4d7-40e2-81fe-65e27fbd8ad0";

describe("AddUtilisateurUseCase", () => {
  let albertAccessRepository: MockProxy<AlbertAccessRepository>;
  let useCase: AddUtilisateurUseCase;

  beforeEach(() => {
    albertAccessRepository = mock<AlbertAccessRepository>();
    useCase = new AddUtilisateurUseCase({ albertAccessRepository });
  });

  it("Doit ajouter un utilisateur Pilote existant", async () => {
    albertAccessRepository.findUtilisateurProfil.mockResolvedValue(
      ProfilEnum.PREFET_REGION,
    );

    await useCase.execute({ utilisateurId: UTILISATEUR_ID });

    expect(albertAccessRepository.addUtilisateur).toHaveBeenCalledWith(
      UTILISATEUR_ID,
    );
  });

  it("Doit refuser un utilisateur inconnu de Pilote", async () => {
    albertAccessRepository.findUtilisateurProfil.mockResolvedValue(null);

    await expect(
      useCase.execute({ utilisateurId: UTILISATEUR_ID }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(albertAccessRepository.addUtilisateur).not.toHaveBeenCalled();
  });

  it("Doit refuser un utilisateur DITP_ADMIN", async () => {
    albertAccessRepository.findUtilisateurProfil.mockResolvedValue(
      ProfilEnum.DITP_ADMIN,
    );

    await expect(
      useCase.execute({ utilisateurId: UTILISATEUR_ID }),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(albertAccessRepository.addUtilisateur).not.toHaveBeenCalled();
  });
});
```

`SearchUtilisateursUseCase.unit.test.ts` :

```ts
import { mock, MockProxy } from "vitest-mock-extended";
import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import { SearchUtilisateursUseCase } from "@/server/albert-access/usecases/SearchUtilisateursUseCase";

describe("SearchUtilisateursUseCase", () => {
  let albertAccessRepository: MockProxy<AlbertAccessRepository>;
  let useCase: SearchUtilisateursUseCase;

  beforeEach(() => {
    albertAccessRepository = mock<AlbertAccessRepository>();
    albertAccessRepository.searchUtilisateurs.mockResolvedValue([]);
    useCase = new SearchUtilisateursUseCase({ albertAccessRepository });
  });

  it("Doit ne rien chercher en dessous de 3 caractères utiles", async () => {
    expect(await useCase.execute({ email: "  je  " })).toEqual([]);
    expect(albertAccessRepository.searchUtilisateurs).not.toHaveBeenCalled();
  });

  it("Doit chercher l'email trimé avec une limite de 10", async () => {
    await useCase.execute({ email: "  jean.d " });

    expect(albertAccessRepository.searchUtilisateurs).toHaveBeenCalledWith(
      "jean.d",
      10,
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -C apps/pilote-ppg exec vitest run --project server-unit src/server/albert-access`
Expected: FAIL (use cases introuvables).

- [ ] **Step 3: Module**

`module.ts` :

```ts
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { GestionContenuExports } from "@/server/gestion-contenu/module";
import { AlbertAccessRepository } from "./domain/ports/AlbertAccessRepository";
import { PrismaAlbertAccessRepository } from "./infrastructure/adapters/PrismaAlbertAccessRepository";
import { ListProfilsUseCase } from "./usecases/ListProfilsUseCase";
import { SetProfilActiveUseCase } from "./usecases/SetProfilActiveUseCase";
import { ListUtilisateursUseCase } from "./usecases/ListUtilisateursUseCase";
import { SearchUtilisateursUseCase } from "./usecases/SearchUtilisateursUseCase";
import { AddUtilisateurUseCase } from "./usecases/AddUtilisateurUseCase";
import { RemoveUtilisateurUseCase } from "./usecases/RemoveUtilisateurUseCase";
import { CheckAlbertAccessUseCase } from "./usecases/CheckAlbertAccessUseCase";

type AlbertAccessCradle = GestionContenuExports & {
  albertAccessRepository: AlbertAccessRepository;
  listProfilsUseCase: ListProfilsUseCase;
  setProfilActiveUseCase: SetProfilActiveUseCase;
  listUtilisateursUseCase: ListUtilisateursUseCase;
  searchUtilisateursUseCase: SearchUtilisateursUseCase;
  addUtilisateurUseCase: AddUtilisateurUseCase;
  removeUtilisateurUseCase: RemoveUtilisateurUseCase;
  checkAlbertAccessUseCase: CheckAlbertAccessUseCase;
};

export const albertAccessModule = defineModule<
  NoExports,
  AlbertAccessCradle
>()({
  name: "albertAccess",
  imports: ["framework", "gestionContenu"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      albertAccessRepository: asModuleClass(PrismaAlbertAccessRepository),
      listProfilsUseCase: asModuleClass(ListProfilsUseCase),
      setProfilActiveUseCase: asModuleClass(SetProfilActiveUseCase),
      listUtilisateursUseCase: asModuleClass(ListUtilisateursUseCase),
      searchUtilisateursUseCase: asModuleClass(SearchUtilisateursUseCase),
      addUtilisateurUseCase: asModuleClass(AddUtilisateurUseCase),
      removeUtilisateurUseCase: asModuleClass(RemoveUtilisateurUseCase),
      checkAlbertAccessUseCase: asModuleClass(CheckAlbertAccessUseCase),
    } satisfies VerifyCradle<
      Omit<AlbertAccessCradle, keyof GestionContenuExports>
    >);
  },
});

type Scope = ExtractScope<typeof albertAccessModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
```

Si `tsc` rejette le `satisfies` ou le typage des imports, s'aligner sur `src/server/albert/module.ts` (qui sépare `AlbertOwnCradle` et `AlbertImports = FrameworkDependencies & ChantierExports`) : `type AlbertAccessCradle = AlbertAccessOwnCradle & AlbertAccessImports` avec `AlbertAccessImports = FrameworkDependencies & GestionContenuExports`, et `satisfies VerifyCradle<AlbertAccessOwnCradle>`.

Enregistrement : ajouter `"albertAccess"` à `moduleNames.ts`, puis dans `dependances.ts` : `import { albertAccessModule } from "./albert-access/module";`, l'ajouter à `allModules` et `albertAccess: getContainer("albertAccess"),` dans `registerContainer()` (suivre les entrées `albert` voisines).

- [ ] **Step 4: Use cases**

`ListProfilsUseCase.ts` :

```ts
import { AlbertAccessRepository, ProfilAccess } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import type { Inject } from "@/server/albert-access/module";

export class ListProfilsUseCase {
  private albertAccessRepository: AlbertAccessRepository;

  constructor({ albertAccessRepository }: Inject<"albertAccessRepository">) {
    this.albertAccessRepository = albertAccessRepository;
  }

  async execute(): Promise<ProfilAccess[]> {
    return this.albertAccessRepository.listProfils();
  }
}
```

`ListUtilisateursUseCase.ts` : même forme, `execute(): Promise<UtilisateurAccess[]>` → `listUtilisateurs()`.

`RemoveUtilisateurUseCase.ts` : même forme, `execute({ utilisateurId }: { utilisateurId: string }): Promise<void>` → `removeUtilisateur(utilisateurId)`.

`SetProfilActiveUseCase.ts` :

```ts
import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import type { Inject } from "@/server/albert-access/module";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

export class SetProfilActiveUseCase {
  private albertAccessRepository: AlbertAccessRepository;

  constructor({ albertAccessRepository }: Inject<"albertAccessRepository">) {
    this.albertAccessRepository = albertAccessRepository;
  }

  async execute({
    profilCode,
    active,
  }: {
    profilCode: string;
    active: boolean;
  }): Promise<void> {
    if (profilCode === ProfilEnum.DITP_ADMIN) {
      throw new BadRequestError(
        "Les administrateurs DITP ont toujours accès à l'assistant IA",
      );
    }
    await this.albertAccessRepository.setProfilActive(profilCode, active);
  }
}
```

`SearchUtilisateursUseCase.ts` :

```ts
import { AlbertAccessRepository, UtilisateurSearchResult } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import type { Inject } from "@/server/albert-access/module";

const LONGUEUR_MIN_RECHERCHE = 3;
const LIMITE_RESULTATS = 10;

export class SearchUtilisateursUseCase {
  private albertAccessRepository: AlbertAccessRepository;

  constructor({ albertAccessRepository }: Inject<"albertAccessRepository">) {
    this.albertAccessRepository = albertAccessRepository;
  }

  async execute({ email }: { email: string }): Promise<UtilisateurSearchResult[]> {
    const recherche = email.trim();
    if (recherche.length < LONGUEUR_MIN_RECHERCHE) {
      return [];
    }
    return this.albertAccessRepository.searchUtilisateurs(
      recherche,
      LIMITE_RESULTATS,
    );
  }
}
```

`AddUtilisateurUseCase.ts` :

```ts
import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import type { Inject } from "@/server/albert-access/module";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import { NotFoundError } from "@/shared/errors/not-found-error";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

export class AddUtilisateurUseCase {
  private albertAccessRepository: AlbertAccessRepository;

  constructor({ albertAccessRepository }: Inject<"albertAccessRepository">) {
    this.albertAccessRepository = albertAccessRepository;
  }

  async execute({ utilisateurId }: { utilisateurId: string }): Promise<void> {
    const profil =
      await this.albertAccessRepository.findUtilisateurProfil(utilisateurId);
    if (profil === null) {
      throw new NotFoundError("Aucun utilisateur Pilote ne correspond");
    }
    if (profil === ProfilEnum.DITP_ADMIN) {
      throw new BadRequestError(
        "Les administrateurs DITP ont toujours accès à l'assistant IA",
      );
    }
    await this.albertAccessRepository.addUtilisateur(utilisateurId);
  }
}
```

`CheckAlbertAccessUseCase.ts` :

```ts
import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import { AlbertAccess, checkAlbertAccess } from "@/server/albert-access/domain/checkAlbertAccess";
import type { Inject } from "@/server/albert-access/module";
import type { RecupererToutesLesVariablesContenuUseCase } from "@/server/gestion-contenu/usecases/RecupererToutesLesVariablesContenuUseCase";

export class CheckAlbertAccessUseCase {
  private albertAccessRepository: AlbertAccessRepository;
  private recupererToutesLesVariablesContenuUseCase: RecupererToutesLesVariablesContenuUseCase;

  constructor({
    albertAccessRepository,
    recupererToutesLesVariablesContenuUseCase,
  }: Inject<
    "albertAccessRepository" | "recupererToutesLesVariablesContenuUseCase"
  >) {
    this.albertAccessRepository = albertAccessRepository;
    this.recupererToutesLesVariablesContenuUseCase =
      recupererToutesLesVariablesContenuUseCase;
  }

  async execute({
    utilisateurId,
    profil,
  }: {
    utilisateurId: string;
    profil: string | null;
  }): Promise<AlbertAccess> {
    const variables = await this.recupererToutesLesVariablesContenuUseCase.run();
    const flags = await this.albertAccessRepository.getAccessFlags(
      utilisateurId,
      profil,
    );
    return checkAlbertAccess({
      killSwitch: variables.NEXT_PUBLIC_FF_ASK_AI,
      profil,
      ...flags,
    });
  }
}
```

(Vérifier le chemin réel de `RecupererToutesLesVariablesContenuUseCase` avec `grep -rn "class RecupererToutesLesVariablesContenuUseCase" apps/pilote-ppg/src`.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm -C apps/pilote-ppg exec vitest run --project server-unit src/server/albert-access` puis `pnpm -C apps/pilote-ppg exec tsc` (le compile-check de `allModules` doit passer).
Expected: PASS, tsc sans erreur.

- [ ] **Step 6: Commit** — titre : `… feature(PIL-1871): use cases et module albertAccess`.

---

### Task 4: Router tRPC `albertAccess`

**Files:**
- Create: `apps/pilote-ppg/src/server/albert-access/infrastructure/trpc/albertAccess.ts`
- Modify: `apps/pilote-ppg/src/server/app/trpc/appRouter.ts` (import + `albertAccess: albertAccessRouter`)
- Modify: `apps/pilote-ppg/src/server/framework/trpc/categorieLogRouteurTRPC.ts` (`albertAccess: "albert"`)

**Interfaces:**
- Consumes: use cases de Task 3.
- Produces (client `api.albertAccess.*`) : `listProfils` (query), `setProfilActive` (mutation `{ profilCode: string; active: boolean }`), `listUtilisateurs` (query), `searchUtilisateurs` (query `{ email: string }`), `addUtilisateur` (mutation `{ utilisateurId: string (uuid) }`), `removeUtilisateur` (mutation `{ utilisateurId: string (uuid) }`).

- [ ] **Step 1: Router**

```ts
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";
import { UnauthorizedError } from "@/shared/errors/unauthorized-error";

const assertDitpAdmin = (profil: string | undefined) => {
  if (profil !== ProfilEnum.DITP_ADMIN) {
    throw new UnauthorizedError(
      "Vous n'êtes pas autorisé à effectuer cette action",
    );
  }
};

const utilisateurInput = z.object({ utilisateurId: z.string().uuid() });

export const albertAccessRouter = createTRPCRouter({
  listProfils: protectedProcedure.query(({ ctx }) => {
    assertDitpAdmin(ctx.session.profil);
    return getContainer("albertAccess").resolve("listProfilsUseCase").execute();
  }),

  setProfilActive: protectedProcedure
    .input(z.object({ profilCode: z.string(), active: z.boolean() }))
    .mutation(({ ctx, input }) => {
      assertDitpAdmin(ctx.session.profil);
      return getContainer("albertAccess")
        .resolve("setProfilActiveUseCase")
        .execute(input);
    }),

  listUtilisateurs: protectedProcedure.query(({ ctx }) => {
    assertDitpAdmin(ctx.session.profil);
    return getContainer("albertAccess")
      .resolve("listUtilisateursUseCase")
      .execute();
  }),

  searchUtilisateurs: protectedProcedure
    .input(z.object({ email: z.string() }))
    .query(({ ctx, input }) => {
      assertDitpAdmin(ctx.session.profil);
      return getContainer("albertAccess")
        .resolve("searchUtilisateursUseCase")
        .execute(input);
    }),

  addUtilisateur: protectedProcedure
    .input(utilisateurInput)
    .mutation(({ ctx, input }) => {
      assertDitpAdmin(ctx.session.profil);
      return getContainer("albertAccess")
        .resolve("addUtilisateurUseCase")
        .execute(input);
    }),

  removeUtilisateur: protectedProcedure
    .input(utilisateurInput)
    .mutation(({ ctx, input }) => {
      assertDitpAdmin(ctx.session.profil);
      return getContainer("albertAccess")
        .resolve("removeUtilisateurUseCase")
        .execute(input);
    }),
});
```

(Adapter le type du paramètre de `assertDitpAdmin` au type réel de `ctx.session.profil` si tsc le demande.)

- [ ] **Step 2: Enregistrer** le router dans `appRouter.ts` et la catégorie de log dans `categorieLogRouteurTRPC.ts` (copier la forme des entrées `albert`).

- [ ] **Step 3: Vérifier** : `pnpm -C apps/pilote-ppg exec tsc` → aucune erreur.

- [ ] **Step 4: Commit** — titre : `… feature(PIL-1871): router tRPC albertAccess réservé aux DITP_ADMIN`.

---

### Task 5: Brancher la règle en base et supprimer les variables d'environnement

**Files:**
- Modify: `apps/pilote-ppg/src/pages/accueil/chantier/[territoireCode]/index.tsx` (~l.18 import, ~l.226 calcul, ~l.253 prop)
- Modify: `apps/pilote-ppg/src/client/components/PageAccueil/PageAccueil.tsx:39`
- Modify: `apps/pilote-ppg/src/client/components/PageAccueil/BasePageAccueilLayout.tsx` (import l.6, props l.68/84, l.89-90, l.185-198)
- Modify: `apps/pilote-ppg/src/app/api/albert/chat/route.ts` (imports l.7-11, l.31-46)
- Modify: `apps/pilote-ppg/src/config.ts` (l.223-247, l.414-419)
- Modify: `apps/pilote-ppg/src/server/gestion-contenu/domain/VariableContenuDisponible.ts` (l.10-14, l.50-73)
- Modify: `apps/pilote-ppg/.env.e2e` (l.55-59)
- Modify si besoin : `apps/pilote-ppg/src/server/gestion-contenu/__tests__/usecases/RecupererFeatureFlipsUseCase.unit.test.ts`
- Delete: `apps/pilote-ppg/src/server/albert/accesAskAI.ts`, `apps/pilote-ppg/src/server/albert/__tests__/accesAskAI.unit.test.ts`, `apps/pilote-ppg/src/server/albert/emailsAutorisesAskAITerritoire.ts`, `apps/pilote-ppg/src/client/components/PageAccueil/useAskAIAccess.ts`

**Interfaces:**
- Consumes: `checkAlbertAccessUseCase` (Task 3), type `AlbertAccess` (Task 1).
- Produces: prop de page `accesAlbert: AlbertAccess` (remplace `emailAutoriseAskAITerritoire`).

- [ ] **Step 1: Page territoire** — remplacer l'import et le calcul :

```ts
const accesAlbert = await getContainer("albertAccess")
  .resolve("checkAlbertAccessUseCase")
  .execute({ utilisateurId: session.user.id, profil: session.profil ?? null });
```

et dans `props` remplacer `emailAutoriseAskAITerritoire,` par `accesAlbert,`.

- [ ] **Step 2: `PageAccueil.tsx`** — `accesAlbert={props.accesAlbert}` à la place de `emailAutoriseAskAITerritoire={…}`.

- [ ] **Step 3: `BasePageAccueilLayout.tsx`**
  - supprimer l'import de `useAskAIAccess` ; ajouter `import type { AlbertAccess } from "@/server/albert-access/domain/checkAlbertAccess";`
  - prop `accesAlbert: AlbertAccess` à la place de `emailAutoriseAskAITerritoire: boolean` (interface + destructuring)
  - remplacer l'appel au hook par `const estDITPAdmin = session?.profil === ProfilEnum.DITP_ADMIN;`
  - dans le JSX : `{accesAlbert.peutUtiliser ? (` et
    ```tsx
    scenarios={
      accesAlbert.scenarios === "coordinateur"
        ? scenariosTerritoireCoordinateur({ territoireCode })
        : scenariosTerritoireDITP({ territoireCode, jalon, estDITPAdmin })
    }
    ```

- [ ] **Step 4: Route chat** — remplacer les imports `accesAskAI` / `emailsAutorisesAskAITerritoire` et le bloc de calcul par :

```ts
const { peutUtiliser } = await getContainer("albertAccess")
  .resolve("checkAlbertAccessUseCase")
  .execute({ utilisateurId: session.user.id, profil: session.profil ?? null });

if (!peutUtiliser) {
  return new Response("Forbidden", { status: 403 });
}
```

Supprimer l'appel à `recupererToutesLesVariablesContenuUseCase` s'il ne sert plus ailleurs dans la route (`grep -n "variables" apps/pilote-ppg/src/app/api/albert/chat/route.ts`).

- [ ] **Step 5: Nettoyage**
  - supprimer les 4 fichiers listés en « Delete » (`git rm`) ;
  - `config.ts` : retirer `askAIDitpAdmin`, `askAIEquipeDirProjet`, `askAIDitpPilotage`, `askAITerritoire`, `askAICoordinateur` (garder `askAI`) et `askAITerritoireEmails` ;
  - `VariableContenuDisponible.ts` : retirer les 5 clés `NEXT_PUBLIC_FF_ASK_AI_*` de l'interface et les 5 entrées de `FEATURE_FLIP_DEFINITIONS` (garder `NEXT_PUBLIC_FF_ASK_AI`) ;
  - `.env.e2e` : retirer les 5 lignes `NEXT_PUBLIC_FF_ASK_AI_*` (garder `NEXT_PUBLIC_FF_ASK_AI=true`).

- [ ] **Step 6: Vérifier qu'il ne reste aucune référence**

Run: `grep -rnE "ASK_AI_|askAITerritoire|askAIDitp|askAIEquipe|askAICoordinateur|emailAutoriseAskAI|useAskAIAccess|accesAskAI|estEligibleTerritoire" apps/pilote-ppg/src apps/pilote-ppg/tests apps/pilote-ppg/.env.e2e apps/pilote-ppg/.env.example apps/pilote-ppg/.env.test`
Expected: aucune sortie.

- [ ] **Step 7: Tests et typage**

Run: `pnpm -C apps/pilote-ppg exec tsc` puis `pnpm -C apps/pilote-ppg test:server:unit`
Expected: PASS ; si `RecupererFeatureFlipsUseCase.unit.test.ts` échoue sur des clés supprimées, retirer ces clés du test.

- [ ] **Step 8: Commit** — titre : `… feature(PIL-1871): accès Albert lu en base, suppression des variables d'environnement`.

---

### Task 6: Composant `SearchPicker` (Radix Popover + cmdk) et `useDebouncedValue`

**Files:**
- Modify: `apps/pilote-ppg/package.json` + `pnpm-lock.yaml` (via `pnpm -C apps/pilote-ppg add cmdk@^1.1.1`)
- Create: `apps/pilote-ppg/src/client/components/shared/SearchPicker.tsx`
- Create: `apps/pilote-ppg/src/client/hooks/useDebouncedValue.ts`

**Interfaces:**
- Produces:
  - `SearchPicker<T>(props: SearchPickerProps<T>)` avec `SearchPickerProps<T> = { items: T[]; search: string; onSearchChange: (search: string) => void; onSelect: (item: T) => void; getKey: (item: T) => string; renderItem: (item: T) => ReactNode; isItemDisabled?: (item: T) => boolean; isLoading?: boolean; triggerLabel: ReactNode; searchPlaceholder?: string; emptyLabel?: string }`
  - `useDebouncedValue<T>(value: T, delayMs: number): T`

- [ ] **Step 1: Dépendance** — `pnpm -C apps/pilote-ppg add cmdk@^1.1.1`.

- [ ] **Step 2: `useDebouncedValue.ts`**

```ts
import { useEffect, useState } from "react";

export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
};
```

- [ ] **Step 3: `SearchPicker.tsx`**

```tsx
import { Command } from "cmdk";
import { Popover } from "radix-ui";
import { ReactNode, useState } from "react";
import { Icone } from "@/components/_commons/Icone";
import { LoupeContourIcon } from "@/components/_commons/Icones/LoupeContourIcon";
import { clsxm } from "@/utils/clsxm";

type SearchPickerProps<T> = {
  items: T[];
  search: string;
  onSearchChange: (search: string) => void;
  onSelect: (item: T) => void;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  isItemDisabled?: (item: T) => boolean;
  isLoading?: boolean;
  triggerLabel: ReactNode;
  searchPlaceholder?: string;
  emptyLabel?: string;
};

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus";

export const SearchPicker = <T,>({
  items,
  search,
  onSearchChange,
  onSelect,
  getKey,
  renderItem,
  isItemDisabled,
  isLoading = false,
  triggerLabel,
  searchPlaceholder = "Rechercher…",
  emptyLabel = "Aucun résultat",
}: SearchPickerProps<T>) => {
  const [open, setOpen] = useState(false);

  const changerOuverture = (next: boolean) => {
    setOpen(next);
    if (!next) onSearchChange("");
  };

  return (
    <Popover.Root onOpenChange={changerOuverture} open={open}>
      <Popover.Trigger
        className={clsxm(
          "flex w-full items-center gap-2 rounded-t px-4 py-2 text-left text-base leading-6",
          "bg-dsfr-grey-950 text-dsfr-mention-grey border-0 border-b-2 border-solid border-primary",
          FOCUS,
        )}
      >
        <Icone className="w-5 h-5 shrink-0 text-primary" icone={LoupeContourIcon} />
        <span className="truncate">{triggerLabel}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-80 bg-white border border-solid border-dsfr-grey-900 shadow-lg"
          sideOffset={4}
        >
          <Command label={searchPlaceholder} shouldFilter={false}>
            <Command.Input
              className="w-full px-4 py-2 text-base leading-6 border-0 border-b border-solid border-dsfr-grey-900 outline-none placeholder:italic placeholder:text-dsfr-mention-grey"
              onValueChange={onSearchChange}
              placeholder={searchPlaceholder}
              value={search}
            />
            <Command.List className="max-h-80 overflow-y-auto p-1">
              {isLoading ? (
                <Command.Loading>
                  <p className="px-3 py-4 text-sm text-dsfr-mention-grey mb-0">
                    Recherche…
                  </p>
                </Command.Loading>
              ) : (
                <Command.Empty className="px-3 py-4 text-sm text-dsfr-mention-grey">
                  {emptyLabel}
                </Command.Empty>
              )}
              {items.map((item) => (
                <Command.Item
                  className={clsxm(
                    "flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-sm outline-none",
                    "data-[selected=true]:bg-dsfr-alt-blue-france",
                    "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60",
                  )}
                  disabled={isItemDisabled?.(item)}
                  key={getKey(item)}
                  onSelect={() => {
                    onSelect(item);
                    changerOuverture(false);
                  }}
                  value={getKey(item)}
                >
                  {renderItem(item)}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
```

(Vérifier que `LoupeContourIcon`, `dsfr-alt-blue-france`, `dsfr-mention-grey`, `dsfr-grey-900` existent : ils sont déjà utilisés par `SearchInput.tsx` / `Select.tsx`.)

- [ ] **Step 4: Vérifier** : `pnpm -C apps/pilote-ppg lint` → OK.

- [ ] **Step 5: Commit** — titre : `… feature(PIL-1871): composant SearchPicker (Radix Popover + cmdk)` ; inclure `package.json` et `pnpm-lock.yaml`.

---

### Task 7: Onglets « Permissions profils » et « Permissions emails »

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertPanel.tsx`
- Create: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertProfilPermissions.tsx`
- Create: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertUtilisateurPermissions.tsx`

**Interfaces:**
- Consumes: `api.albertAccess.*` (Task 4), `SearchPicker` + `useDebouncedValue` (Task 6), `Tabs`, `Table`, `Switch`, `Notice`, `Badge`, `Button` (shared), `toast` (sonner), `api` (`@/server/framework/trpc/api`).

- [ ] **Step 1: `AlbertPanel.tsx`**

```tsx
type Onglet =
  | "discussion"
  | "dashboard"
  | "permissions-profils"
  | "permissions-emails";

const ITEMS: { value: Onglet; label: string }[] = [
  { value: "discussion", label: "Discussion" },
  { value: "dashboard", label: "Dashboard" },
  { value: "permissions-profils", label: "Permissions profils" },
  { value: "permissions-emails", label: "Permissions emails" },
];

const isOnglet = (value: string): value is Onglet =>
  ITEMS.some((item) => item.value === value);

const CONTENU: Record<Onglet, () => JSX.Element> = {
  discussion: AlbertChat,
  dashboard: AlbertDashboard,
  "permissions-profils": AlbertProfilPermissions,
  "permissions-emails": AlbertUtilisateurPermissions,
};
```

et dans le rendu : `const Contenu = CONTENU[ongletActif];` puis `<Contenu />` à la place du ternaire. (Si le typage `() => JSX.Element` coince avec les composants existants, utiliser `ComponentType` de `react`.)

- [ ] **Step 2: `AlbertProfilPermissions.tsx`**

```tsx
import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { Notice } from "@/components/shared/Notice";
import { Switch } from "@/components/shared/Switch";
import { Table } from "@/components/shared/Table";

const TOAST_OPTIONS = {
  duration: 3000,
  position: "top-right",
  richColors: true,
} as const;

export const AlbertProfilPermissions = () => {
  const utils = api.useUtils();
  const { data: profils = [] } = api.albertAccess.listProfils.useQuery();
  const setProfilActive = api.albertAccess.setProfilActive.useMutation({
    onSuccess: async (_, { active }) => {
      await Promise.all([
        utils.albertAccess.listProfils.invalidate(),
        utils.albertAccess.listUtilisateurs.invalidate(),
      ]);
      toast.success(active ? "Accès activé" : "Accès désactivé", TOAST_OPTIONS);
    },
    onError: (error) => toast.error(error.message, TOAST_OPTIONS),
  });

  return (
    <div className="flex flex-col gap-6">
      <Notice containerClassName="px-4" variant="info">
        Les administrateurs DITP ont toujours accès à l'assistant IA.
      </Notice>
      <Table caption="Accès à l'assistant IA par profil" captionHidden>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Profil</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Accès</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {profils.map((profil) => (
            <Table.Row key={profil.code}>
              <Table.Cell>{profil.nom}</Table.Cell>
              <Table.Cell>
                <Switch.Root
                  aria-label={`Accès à l'assistant IA pour le profil ${profil.nom}`}
                  checked={profil.active}
                  disabled={setProfilActive.isPending}
                  onCheckedChange={(active) =>
                    setProfilActive.mutate({ profilCode: profil.code, active })
                  }
                >
                  <Switch.Thumb disabled={setProfilActive.isPending} />
                </Switch.Root>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};
```

(Vérifier dans `Table.tsx` les noms exacts des sous-composants exportés — `Header`, `Body`, `Row`, `ColumnHeaderCell`, `Cell` — et dans l'usage tRPC du repo si `isPending` ou `isLoading` est la propriété de mutation en vigueur.)

- [ ] **Step 3: `AlbertUtilisateurPermissions.tsx`**

```tsx
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { SearchPicker } from "@/components/shared/SearchPicker";
import { Table } from "@/components/shared/Table";
import { useDebouncedValue } from "@/client/hooks/useDebouncedValue";

const TOAST_OPTIONS = {
  duration: 3000,
  position: "top-right",
  richColors: true,
} as const;

const LONGUEUR_MIN_RECHERCHE = 3;

const MentionProfil = ({ profilNom }: { profilNom: string }) => (
  <Badge size="sm" variant="info">
    Déjà autorisé via le profil {profilNom}
  </Badge>
);

export const AlbertUtilisateurPermissions = () => {
  const utils = api.useUtils();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const rechercheActive = debouncedSearch.length >= LONGUEUR_MIN_RECHERCHE;

  const { data: utilisateurs = [] } =
    api.albertAccess.listUtilisateurs.useQuery();
  const { data: resultats = [], isFetching } =
    api.albertAccess.searchUtilisateurs.useQuery(
      { email: debouncedSearch },
      { enabled: rechercheActive },
    );

  const invalider = () =>
    Promise.all([
      utils.albertAccess.listUtilisateurs.invalidate(),
      utils.albertAccess.searchUtilisateurs.invalidate(),
    ]);

  const addUtilisateur = api.albertAccess.addUtilisateur.useMutation({
    onSuccess: async () => {
      await invalider();
      toast.success("Utilisateur autorisé", TOAST_OPTIONS);
    },
    onError: (error) => toast.error(error.message, TOAST_OPTIONS),
  });
  const removeUtilisateur = api.albertAccess.removeUtilisateur.useMutation({
    onSuccess: async () => {
      await invalider();
      toast.success("Accès retiré", TOAST_OPTIONS);
    },
    onError: (error) => toast.error(error.message, TOAST_OPTIONS),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-xl">
        <SearchPicker
          emptyLabel={
            rechercheActive
              ? "Aucun utilisateur Pilote ne correspond"
              : `Saisissez au moins ${LONGUEUR_MIN_RECHERCHE} caractères de l'email`
          }
          getKey={(utilisateur) => utilisateur.utilisateurId}
          isItemDisabled={(utilisateur) => utilisateur.dejaAjoute}
          isLoading={rechercheActive && isFetching}
          items={rechercheActive ? resultats : []}
          onSearchChange={setSearch}
          onSelect={(utilisateur) =>
            addUtilisateur.mutate({ utilisateurId: utilisateur.utilisateurId })
          }
          renderItem={(utilisateur) => (
            <span className="flex flex-col gap-1">
              <span>
                {utilisateur.prenom} {utilisateur.nom} · {utilisateur.email} ·{" "}
                {utilisateur.profilNom}
              </span>
              {utilisateur.dejaAjoute ? (
                <span className="text-xs text-dsfr-mention-grey">
                  Déjà dans la liste
                </span>
              ) : utilisateur.autoriseViaProfil ? (
                <MentionProfil profilNom={utilisateur.profilNom} />
              ) : null}
            </span>
          )}
          search={search}
          searchPlaceholder="Rechercher par email"
          triggerLabel="Ajouter un utilisateur…"
        />
      </div>
      {utilisateurs.length === 0 ? (
        <p className="text-dsfr-mention-grey">
          Aucun utilisateur autorisé individuellement
        </p>
      ) : (
        <Table caption="Utilisateurs autorisés individuellement" captionHidden>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Profil</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>
                <span className="sr-only">Actions</span>
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {utilisateurs.map((utilisateur) => (
              <Table.Row key={utilisateur.utilisateurId}>
                <Table.Cell>
                  {utilisateur.prenom} {utilisateur.nom}
                </Table.Cell>
                <Table.Cell>{utilisateur.email}</Table.Cell>
                <Table.Cell>
                  <span className="flex flex-col items-start gap-1">
                    {utilisateur.profilNom}
                    {utilisateur.autoriseViaProfil ? (
                      <MentionProfil profilNom={utilisateur.profilNom} />
                    ) : null}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Button
                    disabled={removeUtilisateur.isPending}
                    onClick={() =>
                      removeUtilisateur.mutate({
                        utilisateurId: utilisateur.utilisateurId,
                      })
                    }
                    size="sm"
                    variant="tertiary"
                  >
                    Retirer
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
};
```

(Vérifier les props de `Badge` — `size` existe-t-il ? — et adapter ; le Badge DSFR est en majuscules : si le rendu est trop lourd, utiliser un `<span className="text-xs text-dsfr-info-425">` à la place.)

- [ ] **Step 4: Vérifier** : `pnpm -C apps/pilote-ppg lint` → OK. Pas de pilotage navigateur : l'utilisateur teste lui-même.

- [ ] **Step 5: Commit** — titre : `… feature(PIL-1871): onglets Permissions profils et emails du panel Albert`.

---

### Task 8: Vérification finale, push et PR

- [ ] **Step 1: Suites complètes**

Run: `pnpm -C apps/pilote-ppg lint` puis `pnpm -C apps/pilote-ppg test:server` puis `pnpm -C apps/pilote-ppg test:client`
Expected: tout PASS (si la base de test n'a pas la migration : `pnpm -C apps/pilote-ppg test:database:init`).

- [ ] **Step 2: Push** — `git push -u origin feature/PIL-1871-acces-assistant-ia`.

- [ ] **Step 3: PR** vers `dev` (`gh pr create --base dev`), sans mention de Claude, contenant :
  - lien Jira PIL-1871 ;
  - résumé des changements (tables, module `albertAccess`, onglets, `SearchPicker` + `cmdk`, suppression des variables) ;
  - section **Recette** avec URL exacte + action pour chaque point (reprendre la section Recette de la spec, dont le point « à vérifier » sur les scénarios DITP / `EQUIPE_DIR_PROJET`) ;
  - section **Déploiement** : relever avant mise en prod `ASK_AI_TERRITOIRE_EMAILS` et `NEXT_PUBLIC_FF_ASK_AI_*` sur chaque env Scalingo, réactiver à la main via l'interface après mise en prod, puis supprimer ces variables.
