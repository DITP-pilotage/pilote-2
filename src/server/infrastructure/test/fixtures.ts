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
        ordre: 0,
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

  async sousCritere(
    overrides: Partial<Prisma.referentiel_sous_critereUncheckedCreateInput> & {
      parent_id?: string;
    } = {},
  ) {
    const prisma = getPrisma();
    const parent_id =
      overrides.parent_id == null
        ? (await fixtures.critere()).id
        : overrides.parent_id;

    return prisma.referentiel_sous_critere.create({
      data: {
        id: randomUUID(),
        libelle: "Sous-critère test",
        descriptif: "Description",
        ...overrides,
        parent_id,
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

  async instructionObjectif(
    overrides: Partial<Prisma.instruction_objectifUncheckedCreateInput> & {
      rattachement_utilisateur_etape_jalon_id: string;
      objectif_id: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.instruction_objectif.create({
      data: {
        id: randomUUID(),
        ...overrides,
      },
    });
  },

  async instructionCritere(
    overrides: Partial<Prisma.instruction_critereUncheckedCreateInput> & {
      rattachement_utilisateur_etape_jalon_id: string;
      critere_id: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.instruction_critere.create({
      data: {
        id: randomUUID(),
        ...overrides,
      },
    });
  },

  async tutelle(
    overrides: Partial<Prisma.referentiel_tutelleUncheckedCreateInput> = {},
  ) {
    const prisma = getPrisma();
    return prisma.referentiel_tutelle.create({
      data: {
        id: randomUUID(),
        nom: "Tutelle test",
        ...overrides,
      },
    });
  },

  async territoire(
    overrides: Partial<Prisma.territoireUncheckedCreateInput> & {
      code: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.territoire.create({
      data: {
        nom: `Territoire ${overrides.code}`,
        nom_affiche: `Territoire ${overrides.code}`,
        maille: "DEPT",
        code_insee: overrides.code,
        zone_id: `zone-${randomUUID().slice(0, 6)}`,
        ...overrides,
      },
    });
  },

  async chantierIdentite(
    overrides: Partial<Prisma.chantier_identiteUncheckedCreateInput> = {},
  ) {
    const prisma = getPrisma();
    const id = overrides.id || `CH-${randomUUID().slice(0, 6)}`;
    return prisma.chantier_identite.create({
      data: {
        nom: `Chantier ${id}`,
        ...overrides,
        id,
      },
    });
  },

  async chantierTerritoire(
    overrides: Partial<Prisma.chantier_territoireUncheckedCreateInput> & {
      id: string;
      territoire_code: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.chantier_territoire.create({
      data: {
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        ...overrides,
      },
    });
  },

  async chantierTerritoireJalon(
    overrides: Partial<Prisma.chantier_territoire_jalonUncheckedCreateInput> & {
      id: string;
      territoire_code: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.chantier_territoire_jalon.create({
      data: {
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: null,
        ...overrides,
      },
    });
  },

  async chantierEvaluation(
    overrides: Partial<Prisma.chantier_evaluationUncheckedCreateInput> & {
      id: string;
      territoire_code: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.chantier_evaluation.create({
      data: {
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: null,
        date_calcul: new Date(),
        ...overrides,
      },
    });
  },

  async habilitation(
    overrides: Partial<Prisma.habilitationUncheckedCreateInput> & {
      utilisateurId: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.habilitation.create({
      data: {
        scopeCode: "lecture",
        territoires: [],
        perimetres: [],
        chantiers: [],
        ...overrides,
      },
    });
  },

  async rapportHebdomadaireCoordinateur(
    overrides: Partial<Prisma.rapport_hebdomadaire_coordinateurUncheckedCreateInput> = {},
  ) {
    const prisma = getPrisma();
    const coordinateur_id =
      overrides.coordinateur_id ??
      (
        await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        })
      ).id;

    return prisma.rapport_hebdomadaire_coordinateur.create({
      data: {
        id: randomUUID(),
        coordinateur_id,
        date_debut_periode: new Date(),
        date_fin_periode: new Date(),
        contenu_rapport: {
          coordinateur: {
            email: "coordinateur@example.com",
            nom: "Coordinateur",
            prenom: "Test",
            profil: "COORDINATEUR_REGION",
            territoires: [
              { code: "REG-11", nom: "Île-de-France", maille: "REG" },
            ],
          },
          sectionActiviteComptes: {
            comptesCrees: [],
            comptesDesactives: [],
          },
        },
        statut_envoi: "CREE",
        ...overrides,
      },
    });
  },
};
