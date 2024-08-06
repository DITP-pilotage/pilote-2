import { chantier as ChantierModel, PrismaClient } from '@prisma/client';
import { ChantierRepository } from '@/server/fiche-conducteur/domain/ports/ChantierRepository';
import { Chantier } from '@/server/fiche-conducteur/domain/Chantier';
import { Meteo } from '@/server/fiche-conducteur/domain/Meteo';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';

const convertirEnChantier = (chantierModel: ChantierModel): Chantier => {
  return Chantier.creerChantier({
    id: chantierModel.id,
    nom: chantierModel.nom,
    estTerritorialise: chantierModel.est_territorialise || false,
    tauxAvancement: chantierModel.taux_avancement,
    tauxAvancementAnnuel: chantierModel.taux_avancement_annuel,
    maille: chantierModel.maille,
    codeInsee: chantierModel.code_insee,
    meteo: chantierModel.meteo as Meteo,
    estApplicable: !!chantierModel.est_applicable,
    listeDirecteursAdministrationCentrale: chantierModel.directeurs_administration_centrale,
    listeDirecteursProjet: chantierModel.directeurs_projet,
  });
};

export class PrismaChantierRepository implements ChantierRepository {
  constructor(private prismaClient: PrismaClient) {}

  async récupérerParIdEtParTerritoireCode({ chantierId, territoireCode }: { chantierId: string; territoireCode: string }): Promise<Chantier> {
    const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

    const result = await this.prismaClient.chantier.findUnique({
      where: {
        id_code_insee_maille: {
          id: chantierId,
          maille,
          code_insee: codeInsee,
        },
      },
    });

    if (!result) {
      throw new Error("Le chantier n'existe pas");
    }

    return convertirEnChantier(result);
  }

  async récupérerMailleNatEtDeptParId(chantierId: string): Promise<Chantier[]> {
    const result = await this.prismaClient.chantier.findMany({
      where: {
        id: chantierId,
        OR: [
          {
            maille: 'DEPT',
          },
          {
            maille: 'NAT',
          },
        ],
      },
    });

    if (!result) {
      throw new Error("Le chantier n'existe pas");
    }

    return result.map(convertirEnChantier);
  }
}
