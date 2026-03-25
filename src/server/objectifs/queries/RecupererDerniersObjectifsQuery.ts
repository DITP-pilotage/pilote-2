import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  ObjectifV2AvecNomAuteur,
  TypeObjectif,
  typesObjectif,
} from "@/server/domain/chantier/objectif/Objectif.interface";
import {
  CODES_TYPES_OBJECTIFS,
  NOMS_TYPES_OBJECTIFS,
} from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";

export class RecupererDerniersObjectifsQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
  ): Promise<Record<TypeObjectif, ObjectifV2AvecNomAuteur | null>> {
    const objectifs = await this.deps.prisma.getInstance().objectif.findMany({
      where: {
        chantier_id: chantierId,
        statut: $Enums.statut_publication.PUBLIE,
      },
      include: { auteur_creation: true, auteur_modification: true },
      orderBy: { date_modification: "desc" },
    });

    const dernierParType = new Map<string, (typeof objectifs)[number]>();
    for (const objectif of objectifs) {
      if (!dernierParType.has(objectif.type)) {
        dernierParType.set(objectif.type, objectif);
      }
    }

    return Object.fromEntries(
      typesObjectif.map((type) => {
        const typeDb = CODES_TYPES_OBJECTIFS[type];
        const objectif = dernierParType.get(typeDb) ?? null;

        if (!objectif) return [type, null];

        return [
          type,
          {
            id: objectif.id,
            chantierId: objectif.chantier_id,
            type: NOMS_TYPES_OBJECTIFS[objectif.type],
            contenu: objectif.contenu,
            statut: objectif.statut,
            auteurCreationId: objectif.auteur_creation_id,
            dateCreation: objectif.date_creation.toISOString(),
            auteurModificationId: objectif.auteur_modification_id,
            dateModification: objectif.date_modification.toISOString(),
            auteurCreationNom: `${objectif.auteur_creation.prenom} ${objectif.auteur_creation.nom}`,
            auteurModificationNom: `${objectif.auteur_modification.prenom} ${objectif.auteur_modification.nom}`,
          },
        ];
      }),
    ) as Record<TypeObjectif, ObjectifV2AvecNomAuteur | null>;
  }
}
