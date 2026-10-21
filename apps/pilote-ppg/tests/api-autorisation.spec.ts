import { randomUUID } from "node:crypto";
import { expect, Page } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { TrpcClient } from "./api-client/trpc.client";
import { E2ETestContext } from "./e2e-test-context";
import { CHANTIER_E2E } from "./seed/entites-dediees";

async function trpcPour(
  page: Page,
  e2eContext: E2ETestContext,
  email: string,
): Promise<TrpcClient> {
  await new AppActions(page, e2eContext).loginAs(email);
  return new TrpcClient(page);
}

function nouveauCompte(email: string, territoire: string) {
  return {
    email,
    nom: "Compte",
    prénom: "E2E",
    fonction: "Agent",
    service: "Préfecture de département",
    serviceAutre: null,
    perimetreMinisteriel: null,
    profil: "PREFET_DEPARTEMENT",
    saisieIndicateur: false,
    gestionUtilisateur: false,
    applicationsAccessibles: [],
    habilitations: {
      lecture: { chantiers: [], territoires: [territoire], périmètres: [] },
      responsabilite: { chantiers: [] },
      saisieCommentaire: { chantiers: [] },
    },
  };
}

function emailUnique(prefixe: string): string {
  return `${prefixe}.${randomUUID().slice(0, 8)}@example.com`;
}

async function compteExiste(email: string): Promise<boolean> {
  return (await prisma.utilisateur.count({ where: { email } })) > 0;
}

async function dateDesactivation(email: string): Promise<Date | null> {
  const utilisateur = await prisma.utilisateur.findUniqueOrThrow({
    where: { email },
    select: { date_desactivation: true },
  });
  return utilisateur.date_desactivation;
}

test.describe("Appels directs sans session", () => {
  test("une mutation tRPC est redirigée vers la connexion", async ({
    page,
  }) => {
    const trpc = new TrpcClient(page);

    const resultat = await trpc.mutation(
      "utilisateur.desactiver",
      { email: "prefet.region@example.com" },
      { csrf: null },
    );

    expect(resultat.status).toBe(303);
    expect(resultat.location).toContain("/connexion?callbackUrl=");
  });

  for (const chemin of [
    "/api/trpc/chantier.recupererTousSynthetisesAccessiblesEnLecture",
    "/api/export/chantiers-v2",
    "/api/export/utilisateurs",
  ]) {
    test(`${chemin} est redirigé vers la connexion`, async ({ page }) => {
      const reponse = await page.request.get(chemin, { maxRedirects: 0 });

      expect(reponse.status()).toBe(303);
      expect(reponse.headers().location).toContain("/connexion?callbackUrl=");
    });
  }

  test("le chat de l'assistant est redirigé vers la connexion", async ({
    page,
  }) => {
    const reponse = await page.request.post("/api/albert/chat", {
      data: {},
      maxRedirects: 0,
    });

    expect(reponse.status()).toBe(303);
    expect(reponse.headers().location).toContain("/connexion?callbackUrl=");
  });
});

test.describe("Appels directs avec session", () => {
  test("un profil connecté lit les chantiers de son périmètre", async ({
    page,
    e2eContext,
  }) => {
    const trpc = await trpcPour(page, e2eContext, "ditp.pilotage@example.com");

    const resultat = await trpc.query<unknown[]>(
      "chantier.recupererTousSynthetisesAccessiblesEnLecture",
    );

    expect(resultat.status).toBe(200);
    expect(resultat.errorCode).toBeNull();
    expect(resultat.data?.length).toBeGreaterThan(0);
  });
});

test.describe("Gestion des comptes utilisateurs", () => {
  test("un coordinateur crée puis désactive un compte de son département", async ({
    page,
    e2eContext,
  }) => {
    const email = emailUnique("e2e.autorise");
    e2eContext.track("UTILISATEUR_CREE", { email });
    const trpc = await trpcPour(
      page,
      e2eContext,
      "coordinateur.departement@example.com",
    );

    const creation = await trpc.mutation(
      "utilisateur.creer",
      nouveauCompte(email, "DEPT-56"),
    );
    const desactivation = await trpc.mutation("utilisateur.desactiver", {
      email,
    });

    expect(creation.status).toBe(200);
    expect(desactivation.status).toBe(200);
    expect(await dateDesactivation(email)).not.toBeNull();
  });

  test("un coordinateur ne crée pas de compte hors de ses départements", async ({
    page,
    e2eContext,
  }) => {
    const email = emailUnique("e2e.hors.perimetre");
    e2eContext.track("UTILISATEUR_CREE", { email });
    const trpc = await trpcPour(
      page,
      e2eContext,
      "coordinateur.departement@example.com",
    );

    const resultat = await trpc.mutation(
      "utilisateur.creer",
      nouveauCompte(email, "DEPT-13"),
    );

    expect(resultat.status).toBe(403);
    expect(resultat.errorCode).toBe("ForbiddenError");
    expect(await compteExiste(email)).toBe(false);
  });

  test("un profil sans gestion des comptes ne crée pas de compte", async ({
    page,
    e2eContext,
  }) => {
    const email = emailUnique("e2e.sans.gestion");
    e2eContext.track("UTILISATEUR_CREE", { email });
    const trpc = await trpcPour(
      page,
      e2eContext,
      "prefet.departement@example.com",
    );

    const resultat = await trpc.mutation(
      "utilisateur.creer",
      nouveauCompte(email, "DEPT-56"),
    );

    expect(resultat.status).toBe(403);
    expect(resultat.errorCode).toBe("ForbiddenError");
    expect(await compteExiste(email)).toBe(false);
  });

  test("un coordinateur ne désactive pas un compte hors de son périmètre", async ({
    page,
    e2eContext,
  }) => {
    const trpc = await trpcPour(
      page,
      e2eContext,
      "coordinateur.departement@example.com",
    );

    const resultat = await trpc.mutation("utilisateur.desactiver", {
      email: "premiere.ministre@example.com",
    });

    expect(resultat.status).toBe(403);
    expect(resultat.errorCode).toBe("ForbiddenError");
    expect(await dateDesactivation("premiere.ministre@example.com")).toBeNull();
  });

  test("un coordinateur ne réactive pas un compte hors de son périmètre", async ({
    page,
    e2eContext,
  }) => {
    const trpc = await trpcPour(
      page,
      e2eContext,
      "coordinateur.departement@example.com",
    );

    const resultat = await trpc.mutation("utilisateur.reactiver", {
      email: "premiere.ministre@example.com",
    });

    expect(resultat.status).toBe(403);
    expect(resultat.errorCode).toBe("ForbiddenError");
  });

  test("une mutation sans jeton CSRF est refusée", async ({
    page,
    e2eContext,
  }) => {
    const trpc = await trpcPour(page, e2eContext, "ditp.admin@example.com");

    const resultat = await trpc.mutation(
      "utilisateur.desactiver",
      { email: "premiere.ministre@example.com" },
      { csrf: null },
    );

    expect(resultat.status).toBe(400);
    expect(await dateDesactivation("premiere.ministre@example.com")).toBeNull();
  });

  test("une mutation avec un jeton CSRF invalide est refusée", async ({
    page,
    e2eContext,
  }) => {
    const trpc = await trpcPour(page, e2eContext, "ditp.admin@example.com");

    const resultat = await trpc.mutation(
      "utilisateur.desactiver",
      { email: "premiere.ministre@example.com" },
      { csrf: "jeton-invalide" },
    );

    expect(resultat.status).toBe(403);
    expect(resultat.errorCode).toBe("FORBIDDEN");
    expect(await dateDesactivation("premiere.ministre@example.com")).toBeNull();
  });
});

test.describe("Tokens API", () => {
  for (const procedure of [
    "gestionTokenAPI.creerTokenAPI",
    "gestionTokenAPI.supprimerTokenAPI",
  ]) {
    test(`${procedure} est réservé à l'administrateur DITP`, async ({
      page,
      e2eContext,
    }) => {
      e2eContext.track("TOKEN_API_CREE", {
        email: "ditp.pilotage@example.com",
      });
      const trpc = await trpcPour(
        page,
        e2eContext,
        "equipe.dir.projet@example.com",
      );

      const resultat = await trpc.mutation(procedure, {
        email: "ditp.pilotage@example.com",
      });

      expect(resultat.status).toBe(401);
      expect(resultat.errorCode).toBe("UnauthorizedError");
      expect(
        await prisma.token_api_information.count({
          where: { email: "ditp.pilotage@example.com" },
        }),
      ).toBe(0);
    });
  }
});

test.describe("Paramétrage des chantiers", () => {
  for (const [procedure, input] of [
    ["parametrageChantier.list", undefined],
    ["parametrageChantier.get", { chantierId: CHANTIER_E2E }],
    [
      "parametrageChantier.getIndicateursPonderations",
      { chantierId: CHANTIER_E2E },
    ],
  ] as const) {
    test(`${procedure} est réservé à l'administrateur DITP`, async ({
      page,
      e2eContext,
    }) => {
      const trpc = await trpcPour(
        page,
        e2eContext,
        "coordinateur.region@example.com",
      );

      const resultat = await trpc.query(procedure, input);

      expect(resultat.status).toBe(403);
      expect(resultat.errorCode).toBe("ForbiddenError");
    });
  }

  test("l'enregistrement d'un chantier est réservé à l'administrateur DITP", async ({
    page,
    e2eContext,
  }) => {
    const trpc = await trpcPour(
      page,
      e2eContext,
      "coordinateur.region@example.com",
    );

    const resultat = await trpc.mutation("parametrageChantier.save", {
      chantierId: CHANTIER_E2E,
      chNom: "Nom modifié par un coordinateur",
      chDescr: null,
      chPpg: "PPG-001",
      chTerrito: true,
      chSaisieAte: null,
      chState: "PUBLIE",
      zgApplicable: null,
      porteurIdPrincipal: "POR-001",
      porteurIdsSecondaires: [],
      porteurIdsDAC: [],
      chPer: "PER-001",
      mailleApplicable: ["NAT"],
      chCibleAttendue: false,
      conseillerMail: null,
    });

    expect(resultat.status).toBe(403);
    expect(resultat.errorCode).toBe("ForbiddenError");
    const chantier = await prisma.chantier_identite.findUniqueOrThrow({
      where: { id: CHANTIER_E2E },
      select: { nom: true },
    });
    expect(chantier.nom).toBe("Chantier e2e");
  });

  test("l'enregistrement des pondérations est réservé à l'administrateur DITP", async ({
    page,
    e2eContext,
  }) => {
    const trpc = await trpcPour(
      page,
      e2eContext,
      "coordinateur.region@example.com",
    );

    const resultat = await trpc.mutation(
      "parametrageChantier.savePonderationsIndicateurs",
      { lignes: [] },
    );

    expect(resultat.status).toBe(403);
    expect(resultat.errorCode).toBe("ForbiddenError");
  });
});
