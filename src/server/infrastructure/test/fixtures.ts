import { $Enums, Prisma } from "@prisma/client";
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
export const fixtures = {
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

  async rattachementGroupe(
    overrides: Partial<Prisma.referentiel_rattachement_groupeUncheckedCreateInput> = {},
  ) {
    const prisma = getPrisma();
    const code = overrides.code || `GRP-${randomUUID().slice(0, 6)}`;
    return prisma.referentiel_rattachement_groupe.create({
      data: {
        code,
        ordre: 1,
        libelle: `Groupe ${code}`,
        ...overrides,
      },
    });
  },

  async rattachement(
    overrides: Partial<Prisma.referentiel_rattachementUncheckedCreateInput> & {
      groupe?: string;
    } = {},
  ) {
    const prisma = getPrisma();
    const code = overrides.code || `REG-${randomUUID().slice(0, 6)}`;
    const groupe =
      overrides.groupe == null
        ? (await fixtures.rattachementGroupe()).code
        : overrides.groupe;

    return prisma.referentiel_rattachement.create({
      data: {
        code,
        ordre: 1,
        libelle: `Rattachement ${code}`,
        ...overrides,
        groupe,
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
      rattachement_code?: string;
    } = {},
  ) {
    const prisma = getPrisma();
    const rattachement_code =
      overrides.rattachement_code == null
        ? (await fixtures.rattachement()).code
        : overrides.rattachement_code;

    return prisma.referentiel_objectif.create({
      data: {
        id: randomUUID(),
        libelle: "Objectif test",
        descriptif: "Description",
        jalon: 2025,
        ...overrides,
        rattachement_code,
      },
    });
  },

  async fiche(
    overrides: Partial<Prisma.fiche_evaluationUncheckedCreateInput> & {
      rattachement_code?: string;
    } = {},
  ) {
    const prisma = getPrisma();
    const rattachement_code =
      overrides.rattachement_code == null
        ? (await fixtures.rattachement()).code
        : overrides.rattachement_code;

    return prisma.fiche_evaluation.create({
      data: {
        id: randomUUID(),
        jalon: 2025,
        etape_courante: "AUTO_EVALUATION",
        ...overrides,
        rattachement_code,
      },
    });
  },

  async etapeEvaluation(
    overrides: Partial<Prisma.etape_evaluationUncheckedCreateInput> & {
      fiche_evaluation_id?: string;
      fiche?: Partial<Prisma.fiche_evaluationUncheckedCreateInput>;
    } = {},
  ) {
    const prisma = getPrisma();
    const { fiche, ...rest } = overrides;

    const fiche_evaluation_id =
      rest.fiche_evaluation_id == null
        ? (await fixtures.fiche(fiche ?? {})).id
        : rest.fiche_evaluation_id;

    return prisma.etape_evaluation.create({
      data: {
        id: randomUUID(),
        type: "AUTO_EVALUATION",
        ...rest,
        fiche_evaluation_id,
      },
    });
  },

  async evaluationObjectif(
    overrides: Partial<Prisma.evaluation_objectifUncheckedCreateInput> & {
      etape_evaluation_id: string;
      objectif_id?: string;
      auteur_id: string;
    },
  ) {
    const prisma = getPrisma();
    const objectif_id =
      overrides.objectif_id == null
        ? (await fixtures.objectif()).id
        : overrides.objectif_id;

    return prisma.evaluation_objectif.create({
      data: {
        id: randomUUID(),
        note: null,
        commentaire: "",
        ...overrides,
        objectif_id,
      },
    });
  },

  async evaluationCritere(
    overrides: Partial<Prisma.evaluation_critereUncheckedCreateInput> & {
      etape_evaluation_id: string;
      critere_id?: string;
      auteur_id: string;
    },
  ) {
    const prisma = getPrisma();
    const critere_id =
      overrides.critere_id == null
        ? (await fixtures.critere()).id
        : overrides.critere_id;

    return prisma.evaluation_critere.create({
      data: {
        id: randomUUID(),
        note: null,
        commentaire: "",
        ...overrides,
        critere_id,
      },
    });
  },

  async rattachementUtilisateurEtapeJalon(
    overrides: Partial<Prisma.rattachement_utilisateur_etape_jalonUncheckedCreateInput> & {
      utilisateur_id: string;
      rattachement_code: string;
      etape: $Enums.etape_evaluation_enum;
    },
  ) {
    const prisma = getPrisma();
    return prisma.rattachement_utilisateur_etape_jalon.create({
      data: {
        id: randomUUID(),
        jalon: 2025,
        ...overrides,
      },
    });
  },
};
