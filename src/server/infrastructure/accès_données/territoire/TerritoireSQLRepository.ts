import { Maille, PrismaClient, territoire as TerritoirePrisma } from '@prisma/client';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { CODES_MAILLES, NOMS_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';

class ErreurTerritoireNonTrouvé extends Error {
  constructor() {
    super('Erreur: territoire non trouvé.');
  }
}
export class TerritoireSQLRepository implements TerritoireRepository { 
  constructor(private _prisma: PrismaClient) {}

  _mapperVersLeDomaine(territoire: TerritoirePrisma): Territoire {
    return {
      code: territoire.code,
      nom: territoire.nom,
      nomAffiché: territoire.nom_affiche,
      codeInsee: territoire.code_insee,
      tracéSvg: territoire.trace_svg,
      codeParent: territoire.code_parent,
      maille: NOMS_MAILLES[territoire.maille],
    }; 
  }

  async récupérerTous() {
    const territoires = await this._prisma.territoire.findMany();
    return territoires.map(t => this._mapperVersLeDomaine(t));
  }

  async récupérerTousNew(maille: string) {
    const territoires = await this._prisma.territoire.findMany({
      where: {
        maille: maille as Maille,
      },
    });
    return territoires.map(t => this._mapperVersLeDomaine(t));
  }

  async récupérerListe(codes: Territoire['code'][]) {
    const territoires = await this._prisma.territoire.findMany({
      where: { code: { in: codes } },
    });

    return territoires.map(territoire => this._mapperVersLeDomaine(territoire));
  }

  async récupérer(code: Territoire['code']) {
    const territoire = await this._prisma.territoire.findUnique({
      where: { code: code },
    });

    if (!territoire) throw new ErreurTerritoireNonTrouvé();

    return this._mapperVersLeDomaine(territoire);
  }

  async récupérerÀPartirDeMailleEtCodeInsee(codeInsee: Territoire['codeInsee'], maille: Territoire['maille']) {
    const territoire = await this._prisma.territoire.findFirst({
      where: { code_insee: codeInsee, maille: CODES_MAILLES[maille] },
    });

    if (!territoire) throw new ErreurTerritoireNonTrouvé();

    return this._mapperVersLeDomaine(territoire);
  }
}
