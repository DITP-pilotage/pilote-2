import { perimetre as PérimètreMinistérielPrisma } from "@prisma/client";
import PérimètreMinistérielRepository from "@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface";
import PérimètreMinistériel from "@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface";
import { prisma } from "@/server/db/prisma";

class ErreurPérimètreSansMinistère extends Error {
  constructor() {
    super("Erreur: périmètre ministériel incohérent");
  }
}

export default class PérimètreMinistérielSQLRepository
  implements PérimètreMinistérielRepository
{
  private _mapperVersDomaine(
    périmètre: PérimètreMinistérielPrisma,
  ): PérimètreMinistériel {
    if (!périmètre.ministere_id || !périmètre.ministere)
      throw new ErreurPérimètreSansMinistère();
    return {
      id: périmètre.id,
      nom: périmètre.nom,
      ministèreId: périmètre.ministere_id,
      ministèreNom: périmètre.ministere,
    };
  }

  async récupérerTous(): Promise<PérimètreMinistériel[]> {
    const périmètres = await prisma.perimetre.findMany();

    return périmètres.map((périmètre) => this._mapperVersDomaine(périmètre));
  }
}
