import { Maille, PrismaClient, territoire as TerritoirePrisma } from '@prisma/client';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { NOMS_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { CodeInsee, TerritoireDeBDD } from '@/server/domain/territoire/Territoire.interface';

class ErreurTerritoireNonTrouvé extends Error {
  constructor() {
    super('Erreur: territoire non trouvé.');
  }
}
export class TerritoireSQLRepository implements TerritoireRepository { 
  constructor(private _prisma: PrismaClient) {}

  _mapperVersLeDomaine(t: TerritoirePrisma): TerritoireDeBDD {
    return {
      code: t.code,
      nom: t.nom,
      nomAffiché: t.nom_affiche,
      codeInsee: t.code_insee,
      tracéSvg: t.trace_svg,
      codeParent: t.code_parent,
      maille: NOMS_MAILLES[t.maille],
    }; 
  }

  async récupérerTous() {
    const territoires = await this._prisma.territoire.findMany();
    return territoires.map(t => this._mapperVersLeDomaine(t));
  }

  async récupérer(codeInsee: CodeInsee, maille: Maille) {
    const territoire = await this._prisma.territoire.findFirst({
      where: { code_insee: codeInsee, maille: maille },
    });

    if (!territoire) throw new ErreurTerritoireNonTrouvé();

    return this._mapperVersLeDomaine(territoire);
  }
}
