import { $Enums, type_objectif as TypeObjectifPrisma } from "@prisma/client";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import Objectif, {
  ObjectifV2,
  TypeObjectif,
} from "@/server/domain/chantier/objectif/Objectif.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { groupByAndTransform } from "@/client/utils/arrays";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export const NOMS_TYPES_OBJECTIFS: Record<TypeObjectifPrisma, TypeObjectif> = {
  notre_ambition: "notreAmbition",
  deja_fait: "dejaFait",
  a_faire: "aFaire",
};

export const CODES_TYPES_OBJECTIFS: Record<TypeObjectif, TypeObjectifPrisma> = {
  notreAmbition: "notre_ambition",
  dejaFait: "deja_fait",
  aFaire: "a_faire",
};

export default class ObjectifSQLRepository implements ObjectifRepository {
  private prismaClient: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prismaClient = prisma;
  }

  get prisma() {
    return this.prismaClient.getInstance();
  }

  async save({
    id,
    chantierId,
    contenu,
    type,
    statut,
    auteurCreationId,
    dateCreation,
    auteurModificationId,
    dateModification,
  }: ObjectifV2): Promise<void> {
    await this.prisma.objectif.upsert({
      where: { id },
      create: {
        id,
        chantier_id: chantierId,
        contenu,
        type: CODES_TYPES_OBJECTIFS[type],
        statut,
        auteur_creation_id: auteurCreationId,
        date_creation: new Date(dateCreation),
        auteur_modification_id: auteurModificationId,
        date_modification: new Date(dateModification),
      },
      update: {
        contenu,
        statut,
        auteur_modification_id: auteurModificationId,
        date_modification: new Date(dateModification),
      },
    });
  }

  async getById(id: string): Promise<ObjectifV2 | null> {
    const objectif = await this.prisma.objectif.findUnique({ where: { id } });

    if (objectif === null) return null;

    return {
      id: objectif.id,
      chantierId: objectif.chantier_id,
      type: NOMS_TYPES_OBJECTIFS[objectif.type],
      contenu: objectif.contenu,
      statut: objectif.statut,
      auteurCreationId: objectif.auteur_creation_id ?? "",
      dateCreation: objectif.date_creation.toISOString(),
      auteurModificationId: objectif.auteur_modification_id ?? "",
      dateModification: objectif.date_modification.toISOString(),
    };
  }

  async récupérerLesPlusRécentsGroupésParChantier(
    chantiersIds: Chantier["id"][],
  ): Promise<Record<string, Objectif[]>> {
    const result = await this.prisma.objectif.groupBy({
      by: ["type", "chantier_id"],
      where: {
        chantier_id: { in: chantiersIds },
        statut: $Enums.statut_publication.PUBLIE,
      },
      _max: {
        date_modification: true,
      },
    });

    const latestEntries = await Promise.all(
      result
        .filter((group) => group._max.date_modification)
        .map(async (group) =>
          this.prisma.objectif.findFirst({
            where: {
              type: group.type,
              date_modification: group._max.date_modification!,
              chantier_id: group.chantier_id,
              statut: $Enums.statut_publication.PUBLIE,
            },
            include: {
              auteur_modification: true,
            },
          }),
        ),
    ).then((resultObjectif) => resultObjectif.filter(Boolean));

    return groupByAndTransform(
      latestEntries,
      (objectif) => objectif.chantier_id,
      (objectif) => {
        return {
          id: objectif.id,
          type: NOMS_TYPES_OBJECTIFS[objectif.type],
          contenu: objectif.contenu,
          date: objectif.date_modification.toISOString(),
          auteur: objectif.auteur_modification
            ? `${objectif.auteur_modification.prenom} ${objectif.auteur_modification.nom}`
            : "Auteur Inconnu",
        };
      },
    );
  }
}
