import { PrismaClient, territoire } from '@prisma/client';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { NOMS_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';

export class TerritoireSQLRepository implements TerritoireRepository { 
  constructor(private _prisma: PrismaClient) {}

  _mapperVersLeDomaine(t: territoire) {
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
}
