import { perimetre as PerimetreMinisterielPrisma } from "@prisma/client";
import { prisma } from "@/server/framework/persistence/prisma";
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

export class PrismaPerimetreMinisterielRepository implements PerimetreMinisterielRepository {
  async list(ids: string[]): Promise<PerimetreMinisteriel[]> {
    if (ids.length === 0) return [];
    const perimetres = await prisma.perimetre.findMany({
      where: { id: { in: ids } },
    });

    return perimetres.map(convertirEnPerimetreMinisteriel);
  }

  async listAll(): Promise<PerimetreMinisteriel[]> {
    const perimetres = await prisma.perimetre.findMany();

    return perimetres.map(convertirEnPerimetreMinisteriel);
  }

  async listAllIds(): Promise<string[]> {
    const perimetres = await prisma.perimetre.findMany({
      select: { id: true },
    });

    return perimetres.map((perimetre) => perimetre.id);
  }
}
