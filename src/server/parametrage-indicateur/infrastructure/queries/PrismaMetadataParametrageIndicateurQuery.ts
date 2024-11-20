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
      if (result) {
        const date = result.date_de_modification.split('T')[0];
        return [indicId, {
          auteurModification: result.utilisateur_nom,
          dateDerniereModification: date.split('-').reverse().join('/'),
        } satisfies InformationDerniereModificationMetadataIndicateurContrat];
      } else {
        return [indicId, defaultHistoriqueInformation];
      }
    }));
  }
}
