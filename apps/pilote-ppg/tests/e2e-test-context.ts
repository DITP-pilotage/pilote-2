import {
  $Enums,
  metadata_chantiers,
  metadata_indicateurs_complementaire,
  metadata_indicateurs_hidden,
  metadata_parametrage_indicateurs,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import { creerAdapter } from "@/server/framework/persistence/adapter";

const prisma = new PrismaClient({ adapter: creerAdapter() });

const PROPOSITION_VALEUR_EVENEMENTS: $Enums.type_evenement[] = [
  "PROPOSITION_VALEUR_CREEE",
  "PROPOSITION_VALEUR_MODIFIEE",
  "PROPOSITION_VALEUR_SUPPRIMEE",
  "PROPOSITION_VALEUR_REFUSEE",
  "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
  "PROPOSITION_VALEUR_ACCEPTEE",
  "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
  "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
  "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION",
];

type MetadataIndicateur = {
  hidden: metadata_indicateurs_hidden;
  parametrage: metadata_parametrage_indicateurs;
  complementaire: metadata_indicateurs_complementaire;
};

type ChantierMeteos = {
  chantierId: string;
  meteos: { territoire_code: string; meteo: string | null }[];
};

type FiltersByAction = {
  PROPOSITION_VALEUR_EVENEMENT_CREATED: {
    indic_id: string;
    territoire_code: string;
  };
  COMMENTAIRE_CREATED: Prisma.commentaireWhereInput;
  SYNTHESE_CREATED: Prisma.synthese_des_resultatsWhereInput;
  OBJECTIF_CREATED: Prisma.objectifWhereInput;
  DECISION_STRATEGIQUE_CREATED: Prisma.decision_strategiqueWhereInput;
  RAPPORT_IMPORT_CREATED: Prisma.rapport_import_mesure_indicateurWhereInput;
  UTILISATEUR_CREATED: { email: string };
  UTILISATEUR_DEACTIVATED: { email: string };
  UTILISATEUR_REACTIVATED: { email: string };
  PROFIL_UTILISATEUR_UPDATED: {
    email: string;
    originalData: Prisma.utilisateurUpdateManyMutationInput;
  };
  TOKEN_API_CREATED: { email: string };
  INDICATEUR_CREATED: { indicId: string };
  INDICATEUR_UPDATED: MetadataIndicateur;
  CHANTIER_PARAMETRAGE_UPDATED: metadata_chantiers;
  CHANTIER_METEOS_UPDATED: ChantierMeteos;
  NOUVEAUTE_CREATED: { id: string };
  ARTICLE_CENTRE_AIDE_CREATED: { id: string };
  ALBERT_ACCESS_PROFIL_ENABLED: { profilCode: string };
  ALBERT_ACCESS_UTILISATEUR_ADDED: { email: string };
};

type ActionType = keyof FiltersByAction;

type TrackedAction = {
  [Type in ActionType]: { type: Type; filters: FiltersByAction[Type] };
}[ActionType];

const INDICATEUR_HISTORISATION_TABLES = [
  "metadata_indicateurs",
  "metadata_parametrages_indicateurs",
  "metadata_indicateurs_complementaire",
];

// Le seed ne contient aucune historisation : celle d'un objet écrit par un test est à supprimer.
async function deleteHistorisation(
  tables: string[],
  idObjetModifie: string,
): Promise<void> {
  await prisma.historisation_modification.deleteMany({
    where: {
      table_modifie_id: { in: tables },
      id_objet_modifie: idObjetModifie,
    },
  });
}

async function deleteUtilisateurHistorisation(email: string): Promise<void> {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { email },
    select: { id: true },
  });
  if (utilisateur) {
    await deleteHistorisation(["utilisateur"], utilisateur.id);
  }
}

// Un filtre vide ou une clé undefined ferait porter un deleteMany/updateMany sur toute la table.
function requireFilter<Filter extends object>(filter: Filter): Filter {
  const values = Object.values(filter);
  if (values.length === 0 || values.some((value) => value === undefined)) {
    throw new Error(
      `Filtre de nettoyage e2e vide ou incomplet : ${JSON.stringify(filter)}`,
    );
  }
  return filter;
}

export async function readMetadataIndicateur(
  indicId: string,
): Promise<MetadataIndicateur> {
  const where = { indic_id: indicId };
  return {
    hidden: await prisma.metadata_indicateurs_hidden.findUniqueOrThrow({
      where,
    }),
    parametrage:
      await prisma.metadata_parametrage_indicateurs.findUniqueOrThrow({
        where,
      }),
    complementaire:
      await prisma.metadata_indicateurs_complementaire.findUniqueOrThrow({
        where,
      }),
  };
}

export async function readChantierMeteos(
  chantierId: string,
): Promise<ChantierMeteos> {
  const meteos = await prisma.chantier_territoire.findMany({
    where: { id: chantierId },
    select: { territoire_code: true, meteo: true },
  });
  return { chantierId, meteos };
}

export class E2ETestContext {
  private readonly actions: TrackedAction[] = [];

  track<Type extends ActionType>(
    type: Type,
    filters: FiltersByAction[Type],
  ): void {
    requireFilter(filters);
    this.actions.push({ type, filters } as TrackedAction);
  }

  async cleanup(): Promise<void> {
    const errors: unknown[] = [];
    try {
      for (const action of this.actions) {
        try {
          await this.undo(action);
        } catch (error) {
          errors.push(error);
        }
      }
    } finally {
      this.actions.length = 0;
      await prisma.$disconnect();
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, "Nettoyage e2e incomplet");
    }
  }

  private async undo(action: TrackedAction): Promise<void> {
    switch (action.type) {
      case "PROPOSITION_VALEUR_EVENEMENT_CREATED":
        await prisma.indicateur_territoire_valeur_evenement.deleteMany({
          where: {
            ...requireFilter(action.filters),
            type_evenement: { in: PROPOSITION_VALEUR_EVENEMENTS },
          },
        });
        break;
      case "COMMENTAIRE_CREATED":
        await prisma.commentaire.deleteMany({
          where: requireFilter(action.filters),
        });
        break;
      case "SYNTHESE_CREATED":
        await prisma.synthese_des_resultats.deleteMany({
          where: requireFilter(action.filters),
        });
        break;
      case "OBJECTIF_CREATED":
        await prisma.objectif.deleteMany({
          where: requireFilter(action.filters),
        });
        break;
      case "DECISION_STRATEGIQUE_CREATED":
        await prisma.decision_strategique.deleteMany({
          where: requireFilter(action.filters),
        });
        break;
      case "RAPPORT_IMPORT_CREATED": {
        const rapports = await prisma.rapport_import_mesure_indicateur.findMany(
          { where: requireFilter(action.filters), select: { id: true } },
        );
        const rapportIds = rapports.map((rapport) => rapport.id);
        if (rapportIds.length > 0) {
          const where = { rapport_id: { in: rapportIds } };
          await prisma.mesure_indicateur.deleteMany({ where });
          await prisma.mesure_indicateur_temporaire.deleteMany({ where });
          await prisma.erreur_validation_fichier.deleteMany({ where });
          await prisma.rapport_import_mesure_indicateur.deleteMany({
            where: { id: { in: rapportIds } },
          });
        }
        break;
      }
      case "UTILISATEUR_CREATED":
        await deleteUtilisateurHistorisation(action.filters.email);
        await prisma.utilisateur.deleteMany({
          where: requireFilter({ email: action.filters.email }),
        });
        break;
      case "UTILISATEUR_DEACTIVATED":
        await prisma.utilisateur.updateMany({
          where: requireFilter({ email: action.filters.email }),
          data: { date_desactivation: null },
        });
        break;
      case "UTILISATEUR_REACTIVATED":
        await prisma.utilisateur.updateMany({
          where: requireFilter({ email: action.filters.email }),
          data: { date_desactivation: new Date() },
        });
        break;
      case "PROFIL_UTILISATEUR_UPDATED":
        await deleteUtilisateurHistorisation(action.filters.email);
        await prisma.utilisateur.updateMany({
          where: requireFilter({ email: action.filters.email }),
          data: action.filters.originalData,
        });
        break;
      case "TOKEN_API_CREATED":
        await prisma.token_api_information.deleteMany({
          where: requireFilter({ email: action.filters.email }),
        });
        break;
      case "INDICATEUR_CREATED": {
        const where = requireFilter({ indic_id: action.filters.indicId });
        await prisma.metadata_indicateurs_complementaire.deleteMany({
          where,
        });
        await prisma.metadata_parametrage_indicateurs.deleteMany({ where });
        await prisma.metadata_indicateurs_hidden.deleteMany({ where });
        await deleteHistorisation(
          INDICATEUR_HISTORISATION_TABLES,
          action.filters.indicId,
        );
        break;
      }
      case "INDICATEUR_UPDATED": {
        const original = action.filters;
        const where = { indic_id: original.hidden.indic_id };
        await prisma.metadata_indicateurs_hidden.update({
          where,
          data: original.hidden,
        });
        await prisma.metadata_parametrage_indicateurs.update({
          where,
          data: original.parametrage,
        });
        await prisma.metadata_indicateurs_complementaire.update({
          where,
          data: original.complementaire,
        });
        await deleteHistorisation(
          INDICATEUR_HISTORISATION_TABLES,
          original.hidden.indic_id,
        );
        break;
      }
      case "CHANTIER_PARAMETRAGE_UPDATED":
        await prisma.metadata_chantiers.update({
          where: { chantier_id: action.filters.chantier_id },
          data: action.filters,
        });
        break;
      case "CHANTIER_METEOS_UPDATED":
        for (const { territoire_code, meteo } of action.filters.meteos) {
          await prisma.chantier_territoire.update({
            where: {
              id_territoire_code: {
                id: action.filters.chantierId,
                territoire_code,
              },
            },
            data: { meteo },
          });
        }
        break;
      case "NOUVEAUTE_CREATED":
        await prisma.nouveaute.deleteMany({
          where: requireFilter({ id: action.filters.id }),
        });
        break;
      case "ARTICLE_CENTRE_AIDE_CREATED":
        await prisma.article_centre_aide.deleteMany({
          where: requireFilter({ id: action.filters.id }),
        });
        break;
      case "ALBERT_ACCESS_PROFIL_ENABLED":
        await prisma.albert_access_profil.deleteMany({
          where: requireFilter({ profil_code: action.filters.profilCode }),
        });
        break;
      case "ALBERT_ACCESS_UTILISATEUR_ADDED":
        await prisma.albert_access_utilisateur.deleteMany({
          where: {
            utilisateur: requireFilter({ email: action.filters.email }),
          },
        });
        break;
    }
  }
}
