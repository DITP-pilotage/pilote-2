import { historisation_modification as HistorisationModificationModel, Prisma, PrismaClient } from '@prisma/client';
import { HistorisationModification } from '@/server/domain/historisationModification/HistorisationModification';
import {
  HistorisationModificationRepository,
} from '@/server/domain/historisationModification/HistorisationModificationRepository';
import {
  HistorisationModificationDisponible,
} from '@/server/infrastructure/accès_données/historisationModification/HistorisationModificationDisponible';
import JsonValue = Prisma.JsonValue;

const convertirEnModel = <K extends keyof HistorisationModificationDisponible>(historisationModification: HistorisationModification<K>): Omit<HistorisationModificationModel, 'ancienne_valeur' | 'nouvelle_valeur'> => {
  return {
    id: historisationModification.id,
    id_objet_modifie: historisationModification.idObjetModifie,
    utilisateur_nom: historisationModification.utilisateurNom,
    type_de_modification: historisationModification.typeDeModification,
    date_de_modification: historisationModification.dateDeModification,
    table_modifie_id: historisationModification.tableModifieId,
  };
};

export class HistorisationModificationSQLRepository implements HistorisationModificationRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async sauvegarderModificationHistorisation<K extends keyof HistorisationModificationDisponible>(historisationModification: HistorisationModification<K>) {
    const historisationModificationModel = convertirEnModel(historisationModification);

    await this.prisma.historisation_modification.create({
      data: {
        ...historisationModificationModel,
        ancienne_valeur: historisationModification.ancienneValeur as JsonValue || Prisma.JsonNull,
        nouvelle_valeur: historisationModification.nouvelleValeur as JsonValue || Prisma.JsonNull,
      },
    });
  }
}
