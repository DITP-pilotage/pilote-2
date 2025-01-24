import { chantier_territoire as ChantierTerritoireModel, chantier_identite as ChantierIdentiteModel, chantier_territoire_jalon as ChantierTerritoireJalonModel, PrismaClient } from '@prisma/client';
import { ChantierRepository } from '@/server/fiche-conducteur/domain/ports/ChantierRepository';
import { Chantier } from '@/server/fiche-conducteur/domain/Chantier';
import { Meteo } from '@/server/fiche-conducteur/domain/Meteo';
import {
  getAnneeAffichageDateDeBascule,
} from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getDateBasculeAffichageValeursAnneePrecedente';
import { configuration } from '@/config';

const convertirChantierTerritoireEnChantier = (chantierTerritoireModel: ChantierTerritoireModel & { chantier_identite: ChantierIdentiteModel, chantier_territoire_jalon: ChantierTerritoireJalonModel[] }): Chantier => {
  return Chantier.creerChantier({
    id: chantierTerritoireModel.id,
    nom: chantierTerritoireModel.chantier_identite.nom,
    estTerritorialise: chantierTerritoireModel.chantier_identite.est_territorialise || false,
    tauxAvancement: chantierTerritoireModel.taux_avancement_mandat,
    tauxAvancementAnnuel: chantierTerritoireModel.chantier_territoire_jalon[0]?.taux_avancement || null,
    maille: chantierTerritoireModel.maille,
    codeInsee: chantierTerritoireModel.code_insee,
    territoireCode: chantierTerritoireModel.territoire_code,
    meteo: chantierTerritoireModel.meteo as Meteo,
    estApplicable: !!chantierTerritoireModel.est_applicable,
    listeDirecteursAdministrationCentrale: chantierTerritoireModel.chantier_identite.directeurs_administration_centrale,
    listeDirecteursProjet: chantierTerritoireModel.chantier_identite.directeurs_projet,
  });
};

const convertirChantierIdentiteEnChantier = (chantierIdentiteModel: ChantierIdentiteModel, chantierTerritoire: ChantierTerritoireModel & { chantier_territoire_jalon: ChantierTerritoireJalonModel[] }): Chantier => {
  return Chantier.creerChantier({
    id: chantierIdentiteModel.id,
    nom: chantierIdentiteModel.nom,
    estTerritorialise: chantierIdentiteModel.est_territorialise || false,
    tauxAvancement: chantierTerritoire.taux_avancement_mandat,
    tauxAvancementAnnuel: chantierTerritoire.chantier_territoire_jalon[0]?.taux_avancement || null,
    maille: chantierTerritoire.maille,
    codeInsee: chantierTerritoire.code_insee,
    territoireCode: chantierTerritoire.territoire_code,
    meteo: chantierTerritoire.meteo as Meteo,
    estApplicable: !!chantierTerritoire.est_applicable,
    listeDirecteursAdministrationCentrale: chantierIdentiteModel.directeurs_administration_centrale,
    listeDirecteursProjet: chantierIdentiteModel.directeurs_projet,
  });
};

export class PrismaChantierRepository implements ChantierRepository {
  constructor(private prismaClient: PrismaClient) {}

  async récupérerParIdEtParTerritoireCode({ chantierId, territoireCode }: { chantierId: string; territoireCode: string }): Promise<Chantier> {
    const result = await this.prismaClient.chantier_territoire.findUnique({
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
            jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          },
        },
      },
    });

    if (!result) {
      throw new Error("Le chantier n'existe pas");
    }

    return convertirChantierTerritoireEnChantier(result);
  }

  async récupérerMailleNatEtDeptParId(chantierId: string): Promise<Chantier[]> {
    const result = await this.prismaClient.chantier_identite.findUnique({
      where: {
        id: chantierId,
      },
      include: {
        chantier_territoire: {
          where: {
            OR: [
              {
                maille: 'DEPT',
              },
              {
                maille: 'NAT',
              },
            ],
          },
          include: {
            chantier_territoire_jalon: {
              where: {
                jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new Error("Le chantier n'existe pas");
    }

    return result.chantier_territoire.map(chantierTerritoire => convertirChantierIdentiteEnChantier(result, chantierTerritoire));
  }
}
