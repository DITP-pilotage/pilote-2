import { prisma } from '@/server/db/prisma';

interface InformationDerniereModificationMetadataIndicateurContrat {
  auteurModification: string
  dateDerniereModification: string
}

export class PrismaMetadataParametrageIndicateurQuery {
  async recupererInformationDerniereModification({ indicId }: { indicId: string; }): Promise<InformationDerniereModificationMetadataIndicateurContrat> {
    const result = await prisma.historisation_modification.findFirst({
      where: {
        id_objet_modifie: indicId,
        table_modifie_id: 'metadata_indicateurs',
      },
      orderBy: {
        date_de_modification: 'desc',
      },
      select: {
        utilisateur_nom: true,
        date_de_modification: true,
      },
    });

    if (!result) {
      return {
        auteurModification: 'DITP Admin',
        dateDerniereModification: '31/01/2024',
      };
    }

    const date = result.date_de_modification.split('T')[0];

    return {
      auteurModification: result.utilisateur_nom,
      dateDerniereModification: date.split('-').reverse().join('/'),
    } satisfies InformationDerniereModificationMetadataIndicateurContrat;
  }
}
