import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export const typesContenuChantier = [
  "freins_a_lever",
  "actions_a_venir",
  "actions_a_valoriser",
  "autres_resultats_obtenus_non_correles_aux_indicateurs",
  "decision_strategique",
  "commentaires_sur_les_donnees",
  "autres_resultats_obtenus",
  "synthese_des_resultats",
] as const;
export type TypeContenuChantier = (typeof typesContenuChantier)[number];

export const typesContenuChantierNationaux: TypeContenuChantier[] = [
  "freins_a_lever",
  "actions_a_venir",
  "actions_a_valoriser",
  "autres_resultats_obtenus_non_correles_aux_indicateurs",
  "decision_strategique",
];
const TYPES_TERRITORIAUX: TypeContenuChantier[] = [
  "commentaires_sur_les_donnees",
  "autres_resultats_obtenus",
];

const TERRITOIRE_NATIONAL = "NAT-FR";

export function getTypesContenuChantierPourTerritoire({
  types,
  territoireCode,
}: {
  types: TypeContenuChantier[];
  territoireCode: string;
}): TypeContenuChantier[] {
  const typesExclusDeLaMaille =
    territoireCode === TERRITOIRE_NATIONAL
      ? TYPES_TERRITORIAUX
      : typesContenuChantierNationaux;

  return types.filter((type) => !typesExclusDeLaMaille.includes(type));
}

function getTypesNationauxDemandes(
  types: TypeContenuChantier[],
): TypeContenuChantier[] {
  return types.filter((type) => typesContenuChantierNationaux.includes(type));
}

export type GetChantierCommentairesResult = {
  territoire_code: string;
  territoire_nom: string;
  chantier_id: string;
  commentaires: {
    id: string;
    date_publication: string;
    contenu: string;
    type: string;
  }[];
};

export type GetChantierCommentairesQueryResult = {
  resultats: GetChantierCommentairesResult[];
  types_non_accessibles: TypeContenuChantier[];
};

export class GetChantierCommentairesQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: {
    chantierId: string;
    territoireCode: string;
    types: TypeContenuChantier[];
    inclureCommentairesNationaux: boolean;
  }): Promise<GetChantierCommentairesQueryResult> {
    const appels = [
      {
        territoireCode: params.territoireCode,
        types: getTypesContenuChantierPourTerritoire({
          territoireCode: params.territoireCode,
          types: params.types,
        }),
      },
    ].filter((appel) => appel.types.length > 0);

    const typesNationauxDemandes = getTypesNationauxDemandes(params.types);
    const typesNonAccessibles: TypeContenuChantier[] = [];

    if (
      typesNationauxDemandes.length > 0 &&
      params.territoireCode !== TERRITOIRE_NATIONAL
    ) {
      if (params.inclureCommentairesNationaux) {
        appels.push({
          territoireCode: TERRITOIRE_NATIONAL,
          types: typesNationauxDemandes,
        });
      } else {
        typesNonAccessibles.push(...typesNationauxDemandes);
      }
    }

    const resultats = await Promise.all(
      appels.map((appel) =>
        this.executePourTerritoire({
          chantierId: params.chantierId,
          territoireCode: appel.territoireCode,
          types: appel.types,
        }),
      ),
    );

    return {
      resultats,
      types_non_accessibles: typesNonAccessibles,
    };
  }

  private async executePourTerritoire(params: {
    chantierId: string;
    territoireCode: string;
    types: TypeContenuChantier[];
  }): Promise<GetChantierCommentairesResult> {
    const prisma = this.deps.prisma.getInstance();

    const territoire = await prisma.territoire.findUniqueOrThrow({
      where: { code: params.territoireCode },
    });

    const typesCommentaire = params.types.filter(
      (type) =>
        type !== "synthese_des_resultats" && type !== "decision_strategique",
    );
    const inclutSynthese = params.types.includes("synthese_des_resultats");
    const inclutDecisionsStrategiques = params.types.includes(
      "decision_strategique",
    );

    const [commentaires, syntheses, decisionsStrategiques] = await Promise.all([
      typesCommentaire.length > 0
        ? prisma.commentaire.findMany({
            where: {
              chantier_id: params.chantierId,
              territoire_code: params.territoireCode,
              statut: $Enums.statut_publication.PUBLIE,
              type: { in: typesCommentaire },
            },
          })
        : [],
      inclutSynthese
        ? prisma.synthese_des_resultats.findMany({
            where: {
              chantier_id: params.chantierId,
              territoire_code: params.territoireCode,
              statut: $Enums.statut_publication.PUBLIE,
              commentaire: { not: null },
            },
          })
        : [],
      inclutDecisionsStrategiques
        ? prisma.decision_strategique.findMany({
            where: {
              chantier_id: params.chantierId,
              statut: $Enums.statut_publication.PUBLIE,
            },
          })
        : [],
    ]);

    const items: GetChantierCommentairesResult["commentaires"] = [
      ...commentaires.map((commentaire) => ({
        id: commentaire.id,
        date_publication: commentaire.date_modification.toISOString(),
        contenu: commentaire.contenu,
        type: commentaire.type,
      })),
      ...syntheses.map((synthese) => ({
        id: synthese.id,
        date_publication: synthese.date_modification.toISOString(),
        contenu: synthese.commentaire as string,
        type: "synthese_des_resultats",
      })),
      ...decisionsStrategiques.map((decisionStrategique) => ({
        id: decisionStrategique.id,
        date_publication: decisionStrategique.date_modification.toISOString(),
        contenu: decisionStrategique.contenu,
        type: "decision_strategique",
      })),
    ];

    items.sort((left, right) =>
      right.date_publication.localeCompare(left.date_publication),
    );

    return {
      territoire_code: params.territoireCode,
      territoire_nom: territoire.nom,
      chantier_id: params.chantierId,
      commentaires: items,
    };
  }
}
