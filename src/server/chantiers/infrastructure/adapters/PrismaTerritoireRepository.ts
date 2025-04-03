import { PrismaClient, territoire as TerritoirePrisma } from '@prisma/client';
import { TerritoireRepository } from '@/server/chantiers/domain/ports/TerritoireRepository';
import { NOMS_MAILLES } from '@/server/infrastructure/accès_données/maille/PrismamailleParser';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { PrismaPilote } from '@/server/db/PrismaPilote';

type Dependencies = {
  prisma: PrismaPilote;
};

export class PrismaTerritoireRepository implements TerritoireRepository { 
  private prisma: PrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  _mapperVersLeDomaine(territoire: TerritoirePrisma): Territoire {
    return {
      code: territoire.code,
      nom: territoire.nom,
      nomAffiché: territoire.nom_affiche,
      codeInsee: territoire.code_insee,
      codeParent: territoire.code_parent,
      maille: NOMS_MAILLES[territoire.maille],
    }; 
  }

  async récupérerTousNew() {
    const territoires = await this.prisma.territoire.findMany();
    return territoires.map(territoire => this._mapperVersLeDomaine(territoire));
  }
  
  async recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode({ territoireCode }: { territoireCode: string }): Promise<string[]> {
    const territoire = await this.prisma.territoire.findUnique({
      where: {
        code: territoireCode,
      },
      include: {
        territoire_enfant: true,
      },
    });

    if (!territoire) {
      throw new Error('Territoire non trouvé');
    }

    return [territoire.code, ...territoire.territoire_enfant.map(territoireEnfant => territoireEnfant.code)];
  }
}
