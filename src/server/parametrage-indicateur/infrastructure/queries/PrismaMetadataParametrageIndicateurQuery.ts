import { prisma } from '@/server/db/prisma';
import {
  InformationDerniereModificationMetadataIndicateurContrat,
} from '@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat';
import { defaultHistoriqueInformation } from '@/server/parametrage-indicateur/domain/DefaultHistoriqueInformation';

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
      return defaultHistoriqueInformation;
    }

    return {
      auteurModification: result.utilisateur_nom,
      dateDerniereModification: result.date_de_modification,
    } satisfies InformationDerniereModificationMetadataIndicateurContrat;
  }

  async listerInformationDerniereModification({ listeIndicId }: { listeIndicId: string[]; }): Promise<Map<string, InformationDerniereModificationMetadataIndicateurContrat>> {
    const listeHistorisationResult = await prisma.historisation_modification.findMany({
      where: {
        id_objet_modifie: {
          in: listeIndicId,
        },
        table_modifie_id: 'metadata_indicateurs',
      },
      orderBy: {
        date_de_modification: 'desc',
      },
      select: {
        id_objet_modifie: true,
        utilisateur_nom: true,
        date_de_modification: true,
      },
    });

    if (listeHistorisationResult.length === 0) {
      return new Map<string, InformationDerniereModificationMetadataIndicateurContrat>(listeIndicId.map(indicId => [indicId, defaultHistoriqueInformation]));
    }

    return new Map<string, InformationDerniereModificationMetadataIndicateurContrat>(listeIndicId.map(indicId => {
      const result = listeHistorisationResult.find(historisationResult => historisationResult.id_objet_modifie === indicId);
      return result ? [indicId, {
        auteurModification: result.utilisateur_nom,
        dateDerniereModification: result.date_de_modification,
      } satisfies InformationDerniereModificationMetadataIndicateurContrat] : [indicId, defaultHistoriqueInformation];
    }));
  }
}
