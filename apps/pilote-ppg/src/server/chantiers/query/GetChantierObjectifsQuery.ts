import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

type ObjectifItem = {
  date_publication: string;
  contenu: string;
};

export type GetChantierObjectifsResult = {
  chantier_id: string;
  objectifs: {
    notre_ambition: ObjectifItem | null;
    deja_fait: ObjectifItem | null;
    a_faire: ObjectifItem | null;
  };
};

export class GetChantierObjectifsQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(chantierId: string): Promise<GetChantierObjectifsResult> {
    const prisma = this.deps.prisma.getInstance();

    const objectifs = await prisma.objectif.findMany({
      where: {
        chantier_id: chantierId,
        statut: $Enums.statut_publication.PUBLIE,
      },
      select: {
        type: true,
        contenu: true,
        date_modification: true,
      },
      orderBy: { date_modification: "desc" },
    });

    const toItem = (type: $Enums.type_objectif): ObjectifItem | null => {
      const objectif = objectifs.find((o) => o.type === type);
      if (!objectif) return null;
      return {
        date_publication: objectif.date_modification.toISOString(),
        contenu: objectif.contenu,
      };
    };

    return {
      chantier_id: chantierId,
      objectifs: {
        notre_ambition: toItem($Enums.type_objectif.notre_ambition),
        deja_fait: toItem($Enums.type_objectif.deja_fait),
        a_faire: toItem($Enums.type_objectif.a_faire),
      },
    };
  }
}
