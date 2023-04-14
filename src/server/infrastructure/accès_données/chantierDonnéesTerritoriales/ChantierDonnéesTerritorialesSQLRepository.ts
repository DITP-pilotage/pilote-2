import { PrismaClient } from '@prisma/client';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import départements from '@/client/constants/départements.json';
import régions from '@/client/constants/régions.json';
import { TerritoireGéographique } from '@/stores/useTerritoiresStore/useTerritoiresStore.interface';
import {
  ChantierDonnéesTerritoriales,
} from '@/server/domain/chantierDonnéesTerritoriales/chantierDonnéesTerritoriales.interface';
import ChantierDonnéesTerritorialesRepository from './ChantierDonnéesTerritorialesRepository.interface';

type chantier_donnees_territoriales = {
  code_insee: string,
  taux_avancement: number | null,
};

export default class ChantierDonnéesTerritorialesSQLRepository implements ChantierDonnéesTerritorialesRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(chantierDonnéesTerritoriales: chantier_donnees_territoriales): ChantierDonnéesTerritoriales {
    return {
      avancement: {
        annuel: null,
        global: chantierDonnéesTerritoriales?.taux_avancement ?? null,
      },
    };
  }

  async récupérerTousLesAvancementsDUnChantier(chantierId: string) {
    const chantierRows = await this.prisma.chantier.findMany({
      where: {
        id: chantierId,
      },
    });

    const chantierMailleNationale = chantierRows.find(c => c.maille === 'NAT') ?? null;

    return {
      nationale: {
        FR: chantierMailleNationale ? this.mapperVersDomaine(chantierMailleNationale) : {
          avancement: {
            annuel: null,
            global: null,
          },
        },
      },
      régionale: this._territorialiser(
        régions,
        chantierRows.filter(c => c.maille === 'REG'),
      ),
      départementale: this._territorialiser(
        départements,
        chantierRows.filter(c => c.maille === 'DEPT'),
      ),
    };
  }

  private _territorialiser(
    territoires: TerritoireGéographique[],
    chantierDonnéesTerritoriales: chantier_donnees_territoriales[],
  ) {
    let donnéesTerritoires: Record<CodeInsee, ChantierDonnéesTerritoriales> = {};

    territoires.forEach(territoire => {
      const avancementTerritorial = chantierDonnéesTerritoriales.find(c => c.code_insee === territoire.codeInsee) ?? null;

      donnéesTerritoires[territoire.codeInsee] = avancementTerritorial ? this.mapperVersDomaine(avancementTerritorial) : {
        avancement: {
          annuel: null,
          global: null,
        },
      };
    });

    return donnéesTerritoires;
  }
}
