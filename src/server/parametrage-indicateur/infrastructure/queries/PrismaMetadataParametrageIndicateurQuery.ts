import { prisma } from '@/server/db/prisma';
import {
  InformationDerniereModificationMetadataIndicateurContrat,
  InformationHistorisationMetadataIndicateurContrat,
} from '@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat';
import { defaultDeniereModificationInformation, defaultHistoriqueInformation } from '@/server/parametrage-indicateur/domain/DefaultHistoriqueInformation';

export class PrismaMetadataParametrageIndicateurQuery {
  async recupererInformationHistorisation({ indicId }: { indicId: string; }): Promise<InformationHistorisationMetadataIndicateurContrat> {
    const creation = await prisma.historisation_modification.findFirst({
      where: {
        id_objet_modifie: indicId,
        type_de_modification: 'creation',
        table_modifie_id: {
          in: ['metadata_indicateurs', 'metadata_parametrages_indicateurs', 'metadata_indicateurs_complementaire'],
        },
      },
      orderBy: {
        date_de_modification: 'desc',
      },
      select: {
        date_de_modification: true,
        auteur_modification: true,
      },
    });
    
    const derniereModification = await prisma.historisation_modification.findFirst({
      where: {
        id_objet_modifie: indicId,
        table_modifie_id: {
          in: ['metadata_indicateurs', 'metadata_parametrages_indicateurs', 'metadata_indicateurs_complementaire'],
        },
      },
      orderBy: {
        date_de_modification: 'desc',
      },
      select: {
        auteur_modification: true,
        date_de_modification: true,
      },
    });

    return {
      auteurCreation: creation?.auteur_modification?.email ?? defaultHistoriqueInformation.auteurCreation,
      dateCreation: creation ? creation.date_de_modification : defaultHistoriqueInformation.dateCreation,
      auteurModification: derniereModification?.auteur_modification?.email ?? defaultHistoriqueInformation.auteurModification,
      dateDerniereModification: derniereModification ? derniereModification.date_de_modification : defaultHistoriqueInformation.dateDerniereModification,
    } satisfies InformationHistorisationMetadataIndicateurContrat;
  }  

  async listerInformationDerniereModification({ listeIndicId }: { listeIndicId: string[]; }): Promise<Map<string, InformationDerniereModificationMetadataIndicateurContrat>> {
    const listeHistorisationResult = await prisma.historisation_modification.findMany({
      where: {
        id_objet_modifie: {
          in: listeIndicId,
        },
        table_modifie_id: {
          in: ['metadata_indicateurs', 'metadata_parametrages_indicateurs', 'metadata_indicateurs_complementaire'],
        },
      },
      orderBy: {
        date_de_modification: 'desc',
      },
      select: {
        id_objet_modifie: true,
        auteur_modification: true,
        date_de_modification: true,
      },
    });

    if (listeHistorisationResult.length === 0) {
      return new Map<string, InformationDerniereModificationMetadataIndicateurContrat>(listeIndicId.map(indicId => [indicId, defaultDeniereModificationInformation]));
    }

    return new Map<string, InformationDerniereModificationMetadataIndicateurContrat>(listeIndicId.map(indicId => {
      const result = listeHistorisationResult.find(historisationResult => historisationResult.id_objet_modifie === indicId);
      return result ? [indicId, {
        auteurModification: result.auteur_modification?.email ?? defaultDeniereModificationInformation.auteurModification,
        dateDerniereModification: result.date_de_modification,
      } satisfies InformationDerniereModificationMetadataIndicateurContrat] : [indicId, defaultDeniereModificationInformation];
    }));
  }
}
