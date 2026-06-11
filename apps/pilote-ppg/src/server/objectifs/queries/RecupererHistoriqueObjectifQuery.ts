import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getServiceLibelle } from "@/utils/referentiel-services";
import { TypeObjectif } from "@/server/domain/chantier/objectif/Objectif.interface";
import { CODES_TYPES_OBJECTIFS } from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";

export type ObjectifHistoriqueItem = {
  contenu: string;
  dateCreation: string;
  dateModification: string;
  auteurCreationNom: string;
  auteurCreationService: string | null;
  auteurCreationFonction: string | null;
  auteurModificationNom: string;
  auteurModificationService: string | null;
  auteurModificationFonction: string | null;
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
      include: { auteur_creation: true, auteur_modification: true },
      orderBy: { date_modification: "desc" },
    });

    return objectifs.map((objectif) => ({
      contenu: objectif.contenu,
      dateCreation: objectif.date_creation.toISOString(),
      dateModification: objectif.date_modification.toISOString(),
      auteurCreationNom: `${objectif.auteur_creation.prenom} ${objectif.auteur_creation.nom}`,
      auteurCreationService: getServiceLibelle(
        objectif.auteur_creation.perimetre_ministeriel,
        objectif.auteur_creation.service,
        objectif.auteur_creation.service_autre,
      ),
      auteurCreationFonction: objectif.auteur_creation.fonction,
      auteurModificationNom: `${objectif.auteur_modification.prenom} ${objectif.auteur_modification.nom}`,
      auteurModificationService: getServiceLibelle(
        objectif.auteur_modification.perimetre_ministeriel,
        objectif.auteur_modification.service,
        objectif.auteur_modification.service_autre,
      ),
      auteurModificationFonction: objectif.auteur_modification.fonction,
    }));
  }
}
