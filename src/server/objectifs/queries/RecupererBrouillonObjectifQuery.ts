import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  ObjectifV2,
  TypeObjectif,
  typesObjectif,
} from "@/server/domain/chantier/objectif/Objectif.interface";
import {
  CODES_TYPES_OBJECTIFS,
  NOMS_TYPES_OBJECTIFS,
} from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";

export class RecupererBrouillonObjectifQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
    utilisateurId: string,
  ): Promise<Record<TypeObjectif, ObjectifV2 | null>> {
    const brouillons = await this.deps.prisma.getInstance().objectif.findMany({
      where: {
        chantier_id: chantierId,
        statut: $Enums.statut_publication.BROUILLON,
        auteur_modification_id: utilisateurId,
      },
      orderBy: { date_modification: "desc" },
    });

    const dernierBrouillonParType = new Map<
      string,
      (typeof brouillons)[number]
    >();
    for (const brouillon of brouillons) {
      if (!dernierBrouillonParType.has(brouillon.type)) {
        dernierBrouillonParType.set(brouillon.type, brouillon);
      }
    }

    return Object.fromEntries(
      typesObjectif.map((type) => {
        const typeDb = CODES_TYPES_OBJECTIFS[type];
        const brouillon = dernierBrouillonParType.get(typeDb) ?? null;

        if (!brouillon) return [type, null];

        return [
          type,
          {
            id: brouillon.id,
            chantierId: brouillon.chantier_id,
            type: NOMS_TYPES_OBJECTIFS[brouillon.type],
            contenu: brouillon.contenu,
            statut: brouillon.statut,
            auteurCreationId: brouillon.auteur_creation_id ?? "",
            dateCreation: brouillon.date_creation.toISOString(),
            auteurModificationId: brouillon.auteur_modification_id ?? "",
            dateModification: brouillon.date_modification.toISOString(),
          },
        ];
      }),
    ) as Record<TypeObjectif, ObjectifV2 | null>;
  }
}
