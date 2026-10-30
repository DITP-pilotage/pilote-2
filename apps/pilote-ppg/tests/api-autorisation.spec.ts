import { randomUUID } from "node:crypto";
import { expect, Page } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { TrpcClient } from "./api-client/trpc.client";
import { E2ETestContext } from "./e2e-test-context";
import { CHANTIER_FOR_WRITES } from "./seed/dedicated-entities";

async function trpcAs(
  page: Page,
  e2eContext: E2ETestContext,
  email: string,
): Promise<TrpcClient> {
  await new AppActions(page, e2eContext).loginAs(email);
  return TrpcClient.outsideApp(page);
}

function buildUtilisateurInput(email: string, territoire: string) {
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

function uniqueEmail(prefix: string): string {
  return `${prefix}.${randomUUID().slice(0, 8)}@example.com`;
}

async function utilisateurExists(email: string): Promise<boolean> {
  return (await prisma.utilisateur.count({ where: { email } })) > 0;
}

async function getDateDesactivation(email: string): Promise<Date | null> {
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

    const result = await trpc.mutation(
      "utilisateur.desactiver",
      { email: "prefet.region@example.com" },
      { csrf: null },
    );

    expect(result.status).toBe(303);
    expect(result.location).toContain("/connexion?callbackUrl=");
  });

  for (const path of [
    "/api/trpc/chantier.recupererTousSynthetisesAccessiblesEnLecture",
    "/api/export/chantiers-v2",
    "/api/export/utilisateurs",
  ]) {
    test(`${path} est redirigé vers la connexion`, async ({ page }) => {
      const response = await page.request.get(path, { maxRedirects: 0 });

      expect(response.status()).toBe(303);
      expect(response.headers().location).toContain("/connexion?callbackUrl=");
    });
  }

  test("le chat de l'assistant est redirigé vers la connexion", async ({
    page,
  }) => {
    const response = await page.request.post("/api/albert/chat", {
      data: {},
      maxRedirects: 0,
    });

    expect(response.status()).toBe(303);
    expect(response.headers().location).toContain("/connexion?callbackUrl=");
  });
});

test.describe("Appels directs avec session", () => {
  test("un profil connecté lit les chantiers de son périmètre", async ({
    page,
    e2eContext,
  }) => {
    const trpc = await trpcAs(page, e2eContext, "ditp.pilotage@example.com");

    const result = await trpc.query<unknown[]>(
      "chantier.recupererTousSynthetisesAccessiblesEnLecture",
    );

    expect(result.status).toBe(200);
    expect(result.errorCode).toBeNull();
    expect(result.data?.length).toBeGreaterThan(0);
  });
});

test.describe("Gestion des comptes utilisateurs", () => {
  test("un coordinateur crée puis désactive un compte de son département", async ({
    page,
    e2eContext,
  }) => {
    const email = uniqueEmail("e2e.autorise");
    e2eContext.track("UTILISATEUR_CREATED", { email });
    const trpc = await trpcAs(
      page,
      e2eContext,
      "coordinateur.departement@example.com",
    );

    const creationResult = await trpc.mutation(
      "utilisateur.creer",
      buildUtilisateurInput(email, "DEPT-56"),
    );
    const deactivationResult = await trpc.mutation("utilisateur.desactiver", {
      email,
    });

    expect(creationResult.status).toBe(200);
    expect(deactivationResult.status).toBe(200);
    expect(await getDateDesactivation(email)).not.toBeNull();
  });

  test("un coordinateur ne crée pas de compte hors de ses départements", async ({
    page,
    e2eContext,
  }) => {
    const email = uniqueEmail("e2e.hors.perimetre");
    e2eContext.track("UTILISATEUR_CREATED", { email });
    const trpc = await trpcAs(
      page,
      e2eContext,
      "coordinateur.departement@example.com",
    );

    const result = await trpc.mutation(
      "utilisateur.creer",
      buildUtilisateurInput(email, "DEPT-13"),
    );

    expect(result.status).toBe(403);
    expect(result.errorCode).toBe("ForbiddenError");
    expect(await utilisateurExists(email)).toBe(false);
  });

  test("un profil sans gestion des comptes ne crée pas de compte", async ({
    page,
    e2eContext,
  }) => {
    const email = uniqueEmail("e2e.sans.gestion");
    e2eContext.track("UTILISATEUR_CREATED", { email });
    const trpc = await trpcAs(
      page,
      e2eContext,
      "prefet.departement@example.com",
    );

    const result = await trpc.mutation(
      "utilisateur.creer",
      buildUtilisateurInput(email, "DEPT-56"),
    );

    expect(result.status).toBe(403);
    expect(result.errorCode).toBe("ForbiddenError");
    expect(await utilisateurExists(email)).toBe(false);
  });

  test("un coordinateur ne désactive pas un compte hors de son périmètre", async ({
    page,
    e2eContext,
  }) => {
    // Si la garde régresse, le compte serait désactivé : on prévoit sa réactivation.
    e2eContext.track("UTILISATEUR_DEACTIVATED", {
      email: "premiere.ministre@example.com",
    });
    const trpc = await trpcAs(
      page,
      e2eContext,
      "coordinateur.departement@example.com",
    );

    const result = await trpc.mutation("utilisateur.desactiver", {
      email: "premiere.ministre@example.com",
    });

    expect(result.status).toBe(403);
    expect(result.errorCode).toBe("ForbiddenError");
    expect(
      await getDateDesactivation("premiere.ministre@example.com"),
    ).toBeNull();
  });

  test("un coordinateur ne réactive pas un compte hors de son périmètre", async ({
    page,
    e2eContext,
  }) => {
    // Si la garde régresse, le compte serait réactivé : on prévoit de le redésactiver.
    e2eContext.track("UTILISATEUR_REACTIVATED", {
      email: "compte.desactive@example.com",
    });
    const trpc = await trpcAs(
      page,
      e2eContext,
      "coordinateur.departement@example.com",
    );

    const result = await trpc.mutation("utilisateur.reactiver", {
      email: "compte.desactive@example.com",
    });

    expect(result.status).toBe(403);
    expect(result.errorCode).toBe("ForbiddenError");
    expect(
      await getDateDesactivation("compte.desactive@example.com"),
    ).not.toBeNull();
  });

  test("une mutation sans jeton CSRF est refusée", async ({
    page,
    e2eContext,
  }) => {
    // Si la garde régresse, le compte serait désactivé : on prévoit sa réactivation.
    e2eContext.track("UTILISATEUR_DEACTIVATED", {
      email: "premiere.ministre@example.com",
    });
    const trpc = await trpcAs(page, e2eContext, "ditp.admin@example.com");

    const result = await trpc.mutation(
      "utilisateur.desactiver",
      { email: "premiere.ministre@example.com" },
      { csrf: null },
    );

    expect(result.status).toBe(400);
    expect(
      await getDateDesactivation("premiere.ministre@example.com"),
    ).toBeNull();
  });

  test("une mutation avec un jeton CSRF invalide est refusée", async ({
    page,
    e2eContext,
  }) => {
    // Si la garde régresse, le compte serait désactivé : on prévoit sa réactivation.
    e2eContext.track("UTILISATEUR_DEACTIVATED", {
      email: "premiere.ministre@example.com",
    });
    const trpc = await trpcAs(page, e2eContext, "ditp.admin@example.com");

    const result = await trpc.mutation(
      "utilisateur.desactiver",
      { email: "premiere.ministre@example.com" },
      { csrf: "jeton-invalide" },
    );

    expect(result.status).toBe(403);
    expect(result.errorCode).toBe("FORBIDDEN");
    expect(
      await getDateDesactivation("premiere.ministre@example.com"),
    ).toBeNull();
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
      e2eContext.track("TOKEN_API_CREATED", {
        email: "ditp.pilotage@example.com",
      });
      const trpc = await trpcAs(
        page,
        e2eContext,
        "equipe.dir.projet@example.com",
      );

      const result = await trpc.mutation(procedure, {
        email: "ditp.pilotage@example.com",
      });

      expect(result.status).toBe(401);
      expect(result.errorCode).toBe("UnauthorizedError");
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
    ["parametrageChantier.get", { chantierId: CHANTIER_FOR_WRITES }],
    [
      "parametrageChantier.getIndicateursPonderations",
      { chantierId: CHANTIER_FOR_WRITES },
    ],
  ] as const) {
    test(`${procedure} est réservé à l'administrateur DITP`, async ({
      page,
      e2eContext,
    }) => {
      const trpc = await trpcAs(
        page,
        e2eContext,
        "coordinateur.region@example.com",
      );

      const result = await trpc.query(procedure, input);

      expect(result.status).toBe(403);
      expect(result.errorCode).toBe("ForbiddenError");
    });
  }

  test("l'enregistrement d'un chantier est réservé à l'administrateur DITP", async ({
    page,
    e2eContext,
  }) => {
    const trpc = await trpcAs(
      page,
      e2eContext,
      "coordinateur.region@example.com",
    );

    const result = await trpc.mutation("parametrageChantier.save", {
      chantierId: CHANTIER_FOR_WRITES,
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

    expect(result.status).toBe(403);
    expect(result.errorCode).toBe("ForbiddenError");
    const metadata = await prisma.metadata_chantiers.findUniqueOrThrow({
      where: { chantier_id: CHANTIER_FOR_WRITES },
      select: { ch_nom: true },
    });
    expect(metadata.ch_nom).toBe("Chantier e2e");
  });

  test("l'enregistrement des pondérations est réservé à l'administrateur DITP", async ({
    page,
    e2eContext,
  }) => {
    const trpc = await trpcAs(
      page,
      e2eContext,
      "coordinateur.region@example.com",
    );

    const result = await trpc.mutation(
      "parametrageChantier.savePonderationsIndicateurs",
      { lignes: [] },
    );

    expect(result.status).toBe(403);
    expect(result.errorCode).toBe("ForbiddenError");
  });
});
