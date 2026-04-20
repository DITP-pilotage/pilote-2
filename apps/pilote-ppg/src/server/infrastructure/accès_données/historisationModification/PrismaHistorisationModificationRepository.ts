import {
  historisation_modification as HistorisationModificationModel,
  Prisma,
} from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { HistorisationModification } from "@/server/domain/historisationModification/HistorisationModification";
import { HistorisationModificationRepository } from "@/server/domain/historisationModification/HistorisationModificationRepository";
import { HistorisationModificationDisponible } from "@/server/infrastructure/accès_données/historisationModification/HistorisationModificationDisponible";
import JsonValue = Prisma.JsonValue;

const convertirEnModel = <K extends keyof HistorisationModificationDisponible>(
  historisationModification: HistorisationModification<K>,
): Omit<
  HistorisationModificationModel,
  "ancienne_valeur" | "nouvelle_valeur"
> => {
  return {
    id: historisationModification.id,
    id_objet_modifie: historisationModification.idObjetModifie,
    type_de_modification: historisationModification.typeDeModification,
    date_de_modification: historisationModification.dateDeModification,
    table_modifie_id: historisationModification.tableModifieId,
    id_auteur: historisationModification.auteurId,
    utilisateur_nom: null,
  };
};

export class PrismaHistorisationModificationRepository implements HistorisationModificationRepository {
  private prismaClient: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prismaClient = prisma;
  }

  get prisma() {
    return this.prismaClient.getInstance();
  }

  async sauvegarderModificationHistorisation<
    K extends keyof HistorisationModificationDisponible,
  >(historisationModification: HistorisationModification<K>) {
    const historisationModificationModel = convertirEnModel(
      historisationModification,
    );

    await this.prisma.historisation_modification.create({
      data: {
        ...historisationModificationModel,
        ancienne_valeur:
          (historisationModification.ancienneValeur as JsonValue) ||
          Prisma.JsonNull,
        nouvelle_valeur:
          (historisationModification.nouvelleValeur as JsonValue) ||
          Prisma.JsonNull,
      },
    });
  }

  async anonymiserAuteurs(
    auteursAAnonymiserIds: string[],
    emailAuteurRemplacement: string,
  ): Promise<void> {
    const auteurAnonyme = await this.prisma.utilisateur.findFirst({
      where: {
        email: emailAuteurRemplacement,
      },
    });

    if (auteurAnonyme) {
      await this.prisma.historisation_modification.updateMany({
        where: {
          id_auteur: {
            in: auteursAAnonymiserIds,
          },
        },
        data: {
          id_auteur: auteurAnonyme.id,
        },
      });
    }
  }
}
