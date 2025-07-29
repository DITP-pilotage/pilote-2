import { perimetre as PerimetreMinisterielPrisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { PerimetreMinisterielRepository } from "@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository";
import { PerimetreMinisteriel } from "@/server/gestion-utilisateur/domain/PerimetreMinisteriel";

class ErreurPérimètreSansMinistère extends Error {
  constructor() {
    super("Erreur: périmètre ministériel incohérent");
  }
}

const convertirEnPerimetreMinisteriel = (
  périmètre: PerimetreMinisterielPrisma,
): PerimetreMinisteriel => {
  if (!périmètre.ministere_id || !périmètre.ministere) {
    throw new ErreurPérimètreSansMinistère();
  }

  return {
    id: périmètre.id,
    nom: périmètre.nom,
    ministèreId: périmètre.ministere_id,
    ministèreNom: périmètre.ministere,
  };
};

export class PrismaPerimetreMinisterielRepository
  implements PerimetreMinisterielRepository
{
  async lister(
    listePerimetresMinisterielsIds: string[],
  ): Promise<PerimetreMinisteriel[]> {
    const listePrismaPerimetreMinisteriel = await prisma.perimetre.findMany({
      where: {
        id:
          listePerimetresMinisterielsIds.length > 0
            ? { in: listePerimetresMinisterielsIds }
            : undefined,
      },
    });

    return listePrismaPerimetreMinisteriel.map(convertirEnPerimetreMinisteriel);
  }

  async listerIds(listePerimetresMinisterielsIds: string[]): Promise<string[]> {
    const listePrismaPerimetreMinisteriel = await prisma.perimetre.findMany({
      where: {
        id:
          listePerimetresMinisterielsIds.length > 0
            ? { in: listePerimetresMinisterielsIds }
            : undefined,
      },
      select: {
        id: true,
      },
    });

    return listePrismaPerimetreMinisteriel.map(
      (perimetreMinisteriel) => perimetreMinisteriel.id,
    );
  }
}
