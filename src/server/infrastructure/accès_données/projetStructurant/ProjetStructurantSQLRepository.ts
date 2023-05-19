// import { projet_structurant as ProjetStructurantPrisma, PrismaClient } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';
import { TerritoireDeBDD } from '@/server/domain/territoire/Territoire.interface';
import RécupérerDétailsTerritoireUseCase from '@/server/usecase/territoire/RécupérerDétailsTerritoireUseCase';

class ErreurProjetStructurantNonTrouvé extends Error {
  constructor(id: string) {
    super(`Erreur: projet structurant '${id}' non trouvé.`);
  }
}

// en attendant d'ajouter les ligne maille et code insee dans prisma
export type ProjetStructurantPrisma = {
  id: string;
  code: string;
  nom: string;
  code_territoire: string;
  direction_administration: string[];
  perimetres_ids: string[];
  chefferie_de_projet: string[];
  co_porteur: string[];
};

export default class ProjetStructurantSQLRepository implements ProjetStructurantRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private async _mapperVersDomaine(projetStructurantPrisma: ProjetStructurantPrisma): Promise<ProjetStructurant> {
    const territoire = await this._récupérerTerritoireAssocié(projetStructurantPrisma);
    return {
      id: projetStructurantPrisma.id,
      nom: projetStructurantPrisma.nom,
      codeTerritoire: projetStructurantPrisma.code_territoire,
      avancement: null,
      dateAvancement: Date.now().toString(),
      maille: territoire.maille as MailleInterne,
      codeInsee: territoire.codeInsee,
      territoireNomÀAfficher: territoire.nomAffiché,
      périmètresIds: projetStructurantPrisma.perimetres_ids,
      météo: 'NON_RENSEIGNEE',
      responsables: {
        //mapping périmètre ministère
        ministèrePorteur: '',
        ministèresCoporteurs: [],
        directionAdmininstration: projetStructurantPrisma.direction_administration,
        chefferieDeProjet: projetStructurantPrisma.chefferie_de_projet,
        coporteurs: projetStructurantPrisma.co_porteur,
      },
    };
  }

  private async _récupérerTerritoireAssocié(projetStructurant: ProjetStructurantPrisma): Promise<TerritoireDeBDD> {
    return new RécupérerDétailsTerritoireUseCase().run(projetStructurant.code_territoire);
  }


  async récupérer(id: string): Promise<ProjetStructurant> {
    const projetStructurant = await this.prisma.projet_structurant.findFirst({
      where: { id  },
    }) as unknown as ProjetStructurantPrisma;

    if (!projetStructurant) {
      throw new ErreurProjetStructurantNonTrouvé(id);
    }

    return this._mapperVersDomaine(projetStructurant);
  }

  async récupérerListe(): Promise<ProjetStructurant[]> {
    const projetsStructurants = await this.prisma.projet_structurant.findMany() as unknown as ProjetStructurantPrisma[];
    return Promise.all(projetsStructurants.map(projetStructurant => this._mapperVersDomaine(projetStructurant)));
  }

}
