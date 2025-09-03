import {
  chantier_identite as ChantierIdentiteModel,
  chantier_territoire as ChantierTerritoireModel,
  chantier_territoire_jalon as ChantierTerritoireJalonModel,
} from "@prisma/client";
import { ChantierRepository } from "@/server/fiche-conducteur/domain/ports/ChantierRepository";
import { Chantier } from "@/server/fiche-conducteur/domain/Chantier";
import { Meteo } from "@/server/fiche-conducteur/domain/Meteo";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";

import { PrismaPilote } from "@/server/db/PrismaPilote";

import { PilotePrismaClient } from "@/server/db/PrismaTransaction";

const convertirChantierTerritoireEnChantier = (
  chantierTerritoireModel: ChantierTerritoireModel & {
    chantier_identite: ChantierIdentiteModel;
    chantier_territoire_jalon: ChantierTerritoireJalonModel[];
  },
): Chantier => {
  return Chantier.creerChantier({
    id: chantierTerritoireModel.id,
    nom: chantierTerritoireModel.chantier_identite.nom,
    estTerritorialise:
      chantierTerritoireModel.chantier_identite.est_territorialise || false,
    tauxAvancement: chantierTerritoireModel.taux_avancement_mandat,
    tauxAvancementAnnuel: verifyValeurIsNotNullOrUndefined(
      chantierTerritoireModel.chantier_territoire_jalon[0]?.taux_avancement,
    ),
    maille: chantierTerritoireModel.maille,
    codeInsee: chantierTerritoireModel.code_insee,
    territoireCode: chantierTerritoireModel.territoire_code,
    meteo: chantierTerritoireModel.meteo as Meteo,
    estApplicable: !!chantierTerritoireModel.est_applicable,
    listeDirecteursAdministrationCentrale:
      chantierTerritoireModel.chantier_identite
        .directeurs_administration_centrale,
    listeDirecteursProjet:
      chantierTerritoireModel.chantier_identite.directeurs_projet,
  });
};

const convertirChantierIdentiteEnChantier = (
  chantierIdentiteModel: ChantierIdentiteModel,
  chantierTerritoire: ChantierTerritoireModel & {
    chantier_territoire_jalon: ChantierTerritoireJalonModel[];
  },
): Chantier => {
  return Chantier.creerChantier({
    id: chantierIdentiteModel.id,
    nom: chantierIdentiteModel.nom,
    estTerritorialise: chantierIdentiteModel.est_territorialise || false,
    tauxAvancement: chantierTerritoire.taux_avancement_mandat,
    tauxAvancementAnnuel:
      chantierTerritoire.chantier_territoire_jalon[0]?.taux_avancement || null,
    maille: chantierTerritoire.maille,
    codeInsee: chantierTerritoire.code_insee,
    territoireCode: chantierTerritoire.territoire_code,
    meteo: chantierTerritoire.meteo as Meteo,
    estApplicable: !!chantierTerritoire.est_applicable,
    listeDirecteursAdministrationCentrale:
      chantierIdentiteModel.directeurs_administration_centrale,
    listeDirecteursProjet: chantierIdentiteModel.directeurs_projet,
  });
};

interface Dependencies {
  prisma: PrismaPilote;
}

export class PrismaChantierRepository implements ChantierRepository {
  private prisma: PilotePrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async récupérerParIdEtParTerritoireCode({
    chantierId,
    territoireCode,
    jalon,
  }: {
    chantierId: string;
    territoireCode: string;
    jalon: number;
  }): Promise<Chantier> {
    const result = await this.prisma.chantier_territoire.findUnique({
      where: {
        id_territoire_code: {
          id: chantierId,
          territoire_code: territoireCode,
        },
      },
      include: {
        chantier_identite: true,
        chantier_territoire_jalon: {
          where: {
            jalon,
          },
        },
      },
    });

    if (!result) {
      throw new Error("Le chantier n'existe pas");
    }

    return convertirChantierTerritoireEnChantier(result);
  }

  async récupérerMailleNatEtDeptParId(
    chantierId: string,
    jalon: number,
  ): Promise<Chantier[]> {
    const result = await this.prisma.chantier_identite.findUnique({
      where: {
        id: chantierId,
      },
      include: {
        chantier_territoire: {
          where: {
            OR: [
              {
                maille: "DEPT",
              },
              {
                maille: "NAT",
              },
            ],
          },
          include: {
            chantier_territoire_jalon: {
              where: {
                jalon,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new Error("Le chantier n'existe pas");
    }

    return result.chantier_territoire.map((chantierTerritoire) =>
      convertirChantierIdentiteEnChantier(result, chantierTerritoire),
    );
  }
}
