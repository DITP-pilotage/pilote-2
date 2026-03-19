import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { TypeObjectif } from "@/server/domain/chantier/objectif/Objectif.interface";
import { CODES_TYPES_OBJECTIFS } from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";

export type ObjectifHistoriqueItem = {
  contenu: string;
  dateCreation: string;
  dateModification: string;
  auteurModificationNom: string;
};

export class RecupererHistoriqueObjectifQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
    type: TypeObjectif,
  ): Promise<ObjectifHistoriqueItem[]> {
    const objectifs = await this.deps.prisma.getInstance().objectif.findMany({
      where: {
        chantier_id: chantierId,
        type: CODES_TYPES_OBJECTIFS[type],
        statut: $Enums.statut_publication.PUBLIE,
      },
      include: { auteur_modification: true },
      orderBy: { date_modification: "desc" },
    });

    return objectifs.map((objectif) => ({
      contenu: objectif.contenu,
      dateCreation: objectif.date_creation.toISOString(),
      dateModification: objectif.date_modification.toISOString(),
      auteurModificationNom: objectif.auteur_modification
        ? `${objectif.auteur_modification.prenom} ${objectif.auteur_modification.nom}`
        : "Auteur Inconnu",
    }));
  }
}
