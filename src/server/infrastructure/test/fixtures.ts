import type { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { getPrisma } from "@/server/db/PrismaTransaction";

/**
 * Test fixtures - Simple composable building blocks for integration tests.
 *
 * Usage:
 *   const utilisateur = await f.utilisateur();
 *   const rattachement = await f.rattachement();
 *   const fiche = await f.fiche({ rattachement_code: rattachement.code });
 */
export const f = {
  async utilisateur(
    overrides: Partial<Prisma.utilisateurUncheckedCreateInput> = {},
  ) {
    const prisma = getPrisma();
    return prisma.utilisateur.create({
      data: {
        id: randomUUID(),
        email: `user-${randomUUID().slice(0, 8)}@example.com`,
        nom: "Test",
        prenom: "User",
        date_creation: new Date(),
        profilCode: "DITP_ADMIN",
        ...overrides,
      },
    });
  },

  async rattachement(
    overrides: Partial<Prisma.referentiel_rattachementUncheckedCreateInput> = {},
  ) {
    const prisma = getPrisma();
    const code = overrides.code || `REG-${randomUUID().slice(0, 6)}`;
    return prisma.referentiel_rattachement.create({
      data: {
        code,
        groupe: code,
        ordre: 1,
        libelle: `Rattachement ${code}`,
        ...overrides,
      },
    });
  },

  async critere(
    overrides: Partial<Prisma.referentiel_critereUncheckedCreateInput> = {},
  ) {
    const prisma = getPrisma();
    return prisma.referentiel_critere.create({
      data: {
        id: randomUUID(),
        libelle: "Critère test",
        descriptif: "Description",
        ...overrides,
      },
    });
  },

  async objectif(
    overrides: Partial<Prisma.referentiel_objectifUncheckedCreateInput> & {
      rattachement_code: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.referentiel_objectif.create({
      data: {
        id: randomUUID(),
        libelle: "Objectif test",
        descriptif: "Description",
        jalon: 2025,
        ...overrides,
      },
    });
  },

  async fiche(
    overrides: Partial<Prisma.fiche_evaluationUncheckedCreateInput> & {
      rattachement_code: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.fiche_evaluation.create({
      data: {
        id: randomUUID(),
        jalon: 2025,
        etape_courante: "AUTO_EVALUATION",
        ...overrides,
      },
    });
  },

  async evaluation(
    overrides: Partial<Prisma.etape_evaluationUncheckedCreateInput> & {
      fiche_evaluation_id: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.etape_evaluation.create({
      data: {
        id: randomUUID(),
        type: "AUTO_EVALUATION",
        ...overrides,
      },
    });
  },

  async evaluationObjectif(
    overrides: Partial<Prisma.evaluation_objectifUncheckedCreateInput> & {
      etape_evaluation_id: string;
      objectif_id: string;
      auteur_id: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.evaluation_objectif.create({
      data: {
        id: randomUUID(),
        note: null,
        commentaire: "",
        ...overrides,
      },
    });
  },

  async evaluationCritere(
    overrides: Partial<Prisma.evaluation_critereUncheckedCreateInput> & {
      etape_evaluation_id: string;
      critere_id: string;
      auteur_id: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.evaluation_critere.create({
      data: {
        id: randomUUID(),
        note: null,
        commentaire: "",
        ...overrides,
      },
    });
  },
};
