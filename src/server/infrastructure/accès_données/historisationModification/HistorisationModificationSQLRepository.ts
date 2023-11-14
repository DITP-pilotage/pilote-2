import { historisation_modification as HistorisationModificationModel, Prisma, PrismaClient } from '@prisma/client';
import { HistorisationModification } from '@/server/domain/historisationModification/HistorisationModification';
import {
  HistorisationModificationRepository,
} from '@/server/domain/historisationModification/HistorisationModificationRepository';
import {
  HistorisationModificationDisponible,
  tableConversionModification,
} from '@/server/infrastructure/accès_données/historisationModification/HistorisationModificationDisponible';

const convertirEnModel = <K extends keyof HistorisationModificationDisponible>(historisationModification: HistorisationModification<K>): HistorisationModificationModel => {
  return {
    id: historisationModification.id,
    typeDeModification: historisationModification.typeDeModification,
    dateDeModification: historisationModification.dateDeModification,
    tableModifieId: historisationModification.tableModifieId,
    ancienneValeur: historisationModification.ancienneValeur && tableConversionModification[historisationModification.tableModifieId](historisationModification.ancienneValeur),
    nouvelleValeur: historisationModification.nouvelleValeur && tableConversionModification[historisationModification.tableModifieId](historisationModification.nouvelleValeur),
  };
};

export class HistorisationModificationSQLRepository implements HistorisationModificationRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async sauvegarderModificationCreation<K extends keyof HistorisationModificationDisponible>(historisationModification: HistorisationModification<K>) {
    const historisationModificationModel = convertirEnModel(historisationModification);

    await this.prisma.historisation_modification.create({
      data: {
        ...historisationModificationModel,
        ancienneValeur: (historisationModificationModel.ancienneValeur)  || Prisma.JsonNull,
        nouvelleValeur: historisationModificationModel.nouvelleValeur || Prisma.JsonNull,
      },
    });
  }
}
