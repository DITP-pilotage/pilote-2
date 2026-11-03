import type { $Enums } from "@prisma/client";
import { z } from "zod";
import { chantierIdsSchema } from "@/server/albert/tools/chantierId";
import type { GetIndicateursIdentiteQuery } from "@/server/chantiers/query/GetIndicateursIdentiteQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import { libelleMaille } from "@/server/albert/tools/libelles";
import {
  descriptionPerimetre,
  resoudrePerimetreAccessible,
  variantesPerimetre,
} from "@/server/albert/tools/perimetre";

const SEUIL_LIGNES_TERRITOIRES = 800;
const MAILLES_ORDER: $Enums.Maille[] = ["NAT", "REG", "DEPT"];

export const CONSIGNE_DETAIL_TROP_VOLUMINEUX =
  "`detail_trop_volumineux` : le détail par territoire est trop volumineux, les compteurs sont renvoyés à la place. Rédige toujours ta réponse complète à partir de ces compteurs, sans les présenter comme le détail demandé. Termine-la en précisant que ce détail est trop volumineux, sans chiffrer ce volume, et qu'on peut l'obtenir en réduisant la recherche à un chantier, un indicateur ou un territoire. N'appelle pas clarify_with_choices, ne pose aucune question avant d'avoir donné les compteurs, et ne relance pas l'outil d'office.";

export const CONSIGNE_ACCES_REFUSE =
  "`acces_refuse` : l'utilisateur n'a accès ni à ces territoires, ni à aucun des chantiers ou indicateurs demandés.";

export const chantierIdsIndicateursSchema = chantierIdsSchema
  .optional()
  .default([])
  .describe(
    "Identifiants de chantiers (ex: ['CH-042']). Absent = tous les chantiers accessibles à l'utilisateur (« mes chantiers »).",
  );

export const indicateurIdsSchema = z
  .array(z.string())
  .optional()
  .default([])
  .describe(
    "Identifiants d'indicateurs (ex: ['IND-894']). Si l'indicateur est décrit sans identifiant, résous-le d'abord avec search_indicateurs.",
  );

export const perimetreIndicateursSchema = z
  .discriminatedUnion("type", [
    variantesPerimetre.SELECTION,
    variantesPerimetre.REGION_ET_SES_DEPARTEMENTS,
    variantesPerimetre.FRANCE_ET_SES_REGIONS,
    variantesPerimetre.TOUTES_REGIONS,
    variantesPerimetre.TOUS_DEPARTEMENTS,
    variantesPerimetre.TOUS_TERRITOIRES,
  ])
  .optional()
  .default({ type: "TOUS_TERRITOIRES" })
  .describe(
    `${descriptionPerimetre({
      types: [
        "SELECTION",
        "REGION_ET_SES_DEPARTEMENTS",
        "FRANCE_ET_SES_REGIONS",
        "TOUTES_REGIONS",
        "TOUS_DEPARTEMENTS",
        "TOUS_TERRITOIRES",
      ],
    })}
Par défaut, TOUS_TERRITOIRES. N'y mets pas le territoire courant de la session, sauf si la demande le nomme.`,
  );

type ListesSignalees = {
  chantiers_non_accessibles?: string[];
  indicateurs_non_accessibles?: string[];
  indicateurs_introuvables?: string[];
};

/** Les champs d'accès signalés au modèle, seulement quand ils s'appliquent. */
export type ChampsAcces = ListesSignalees & { acces_refuse?: true };

export type AccesResolus =
  | { statut: "sans_resultat"; champsAcces: ChampsAcces }
  | {
      statut: "interrogeable";
      champsAcces: ChampsAcces;
      chantierIds: string[];
      territoireCodes: string[];
      indicateurIds?: string[];
    };

function listesSignalees({
  chantiersNonAccessibles = [],
  indicateursNonAccessibles = [],
  indicateursIntrouvables = [],
}: {
  chantiersNonAccessibles?: string[];
  indicateursNonAccessibles?: string[];
  indicateursIntrouvables?: string[];
}): ListesSignalees {
  return {
    ...(chantiersNonAccessibles.length > 0 && {
      chantiers_non_accessibles: chantiersNonAccessibles,
    }),
    ...(indicateursNonAccessibles.length > 0 && {
      indicateurs_non_accessibles: indicateursNonAccessibles,
    }),
    ...(indicateursIntrouvables.length > 0 && {
      indicateurs_introuvables: indicateursIntrouvables,
    }),
  };
}

export async function resoudreAccesIndicateurs({
  chantierIds: chantiersDemandesBruts,
  indicateurIds: indicateursDemandesBruts,
  perimetre,
  territoiresAccessibles,
  chantiersAccessibles,
  territoireResolver,
  getIndicateursIdentiteQuery,
}: {
  chantierIds: string[];
  indicateurIds: string[];
  perimetre: z.infer<typeof perimetreIndicateursSchema>;
  territoiresAccessibles: string[];
  chantiersAccessibles: string[];
  territoireResolver: TerritoireResolver;
  getIndicateursIdentiteQuery: GetIndicateursIdentiteQuery;
}): Promise<AccesResolus> {
  const perimetreAccessible = await resoudrePerimetreAccessible({
    perimetre,
    territoiresAccessibles,
    territoireResolver,
  });
  const territoireCodes =
    "codes" in perimetreAccessible ? perimetreAccessible.codes : [];
  if (territoireCodes.length === 0) {
    return { statut: "sans_resultat", champsAcces: { acces_refuse: true } };
  }

  const chantiersDemandes = [...new Set(chantiersDemandesBruts)];
  const chantiersNonAccessibles = chantiersDemandes.filter(
    (chantierId) => !chantiersAccessibles.includes(chantierId),
  );
  const chantierIds =
    chantiersDemandes.length > 0
      ? chantiersDemandes.filter(
          (chantierId) => !chantiersNonAccessibles.includes(chantierId),
        )
      : chantiersAccessibles;
  if (chantierIds.length === 0) {
    return {
      statut: "sans_resultat",
      champsAcces: {
        acces_refuse: true,
        ...listesSignalees({ chantiersNonAccessibles }),
      },
    };
  }

  const indicateursDemandes = [...new Set(indicateursDemandesBruts)];
  if (indicateursDemandes.length === 0) {
    return {
      statut: "interrogeable",
      champsAcces: listesSignalees({ chantiersNonAccessibles }),
      chantierIds,
      territoireCodes,
    };
  }

  const identites = await getIndicateursIdentiteQuery.execute({
    indicateurIds: indicateursDemandes,
  });
  const chantierParIndicateur = new Map(
    identites.map((identite) => [identite.id, identite.chantier.id]),
  );
  const indicateursIntrouvables = indicateursDemandes.filter(
    (indicateurId) => !chantierParIndicateur.has(indicateurId),
  );
  const indicateursNonAccessibles = indicateursDemandes.filter(
    (indicateurId) => {
      const chantierId = chantierParIndicateur.get(indicateurId);
      return chantierId && !chantiersAccessibles.includes(chantierId);
    },
  );
  const indicateurIds = indicateursDemandes.filter(
    (indicateurId) =>
      !indicateursIntrouvables.includes(indicateurId) &&
      !indicateursNonAccessibles.includes(indicateurId),
  );
  const listes = listesSignalees({
    chantiersNonAccessibles,
    indicateursNonAccessibles,
    indicateursIntrouvables,
  });

  if (indicateurIds.length === 0) {
    return {
      statut: "sans_resultat",
      champsAcces: {
        ...(indicateursNonAccessibles.length > 0 && {
          acces_refuse: true as const,
        }),
        ...listes,
      },
    };
  }

  return {
    statut: "interrogeable",
    champsAcces: listes,
    // Un indicateur nommé prime sur le filtre de chantiers : les deux filtres
    // s'appliquant en ET, il disparaîtrait sinon en silence.
    chantierIds: [
      ...new Set([
        ...chantierIds,
        ...indicateurIds.flatMap(
          (indicateurId) => chantierParIndicateur.get(indicateurId) ?? [],
        ),
      ]),
    ],
    territoireCodes,
    indicateurIds,
  };
}

type Detail = "compteurs" | "territoires";

export type ChampsDetail = {
  detail: Detail;
  detail_trop_volumineux?: true;
};

export function resoudreDetail({
  detail,
  nbLignes,
}: {
  detail: Detail;
  nbLignes: number;
}): { avecTerritoires: boolean; champsDetail: ChampsDetail } {
  const detailTropVolumineux =
    detail === "territoires" && nbLignes > SEUIL_LIGNES_TERRITOIRES;
  const avecTerritoires = detail === "territoires" && !detailTropVolumineux;

  return {
    avecTerritoires,
    champsDetail: {
      detail: avecTerritoires ? "territoires" : "compteurs",
      ...(detailTropVolumineux && { detail_trop_volumineux: true as const }),
    },
  };
}

type LigneIndicateurTerritoire = {
  chantierId: string;
  chantierNom: string;
  indicateurId: string;
  indicateurNom: string;
  maille: $Enums.Maille;
};

export type ChantierRenvoye<
  ChampsIndicateur extends object,
  ChampsMaille extends object,
> = {
  chantier: { id: string; nom: string };
  indicateurs: (ChampsIndicateur & {
    id: string;
    nom: string;
    mailles: (ChampsMaille & {
      maille: ReturnType<typeof libelleMaille>;
    })[];
  })[];
};

export function renvoyerChantiers<
  Ligne extends LigneIndicateurTerritoire,
  ChampsIndicateur extends object,
  ChampsMaille extends object,
>({
  lignes,
  champsIndicateur,
  champsMaille,
}: {
  lignes: Ligne[];
  champsIndicateur: (ligne: Ligne) => ChampsIndicateur;
  champsMaille: (lignesDeLaMaille: Ligne[]) => ChampsMaille;
}): ChantierRenvoye<ChampsIndicateur, ChampsMaille>[] {
  return [...Map.groupBy(lignes, (ligne) => ligne.chantierId).values()].map(
    (lignesDuChantier) => ({
      chantier: {
        id: lignesDuChantier[0].chantierId,
        nom: lignesDuChantier[0].chantierNom,
      },
      indicateurs: [
        ...Map.groupBy(
          lignesDuChantier,
          (ligne) => ligne.indicateurId,
        ).values(),
      ].map((lignesDeLIndicateur) => ({
        id: lignesDeLIndicateur[0].indicateurId,
        nom: lignesDeLIndicateur[0].indicateurNom,
        ...champsIndicateur(lignesDeLIndicateur[0]),
        mailles: MAILLES_ORDER.flatMap((maille) => {
          const lignesDeLaMaille = lignesDeLIndicateur.filter(
            (ligne) => ligne.maille === maille,
          );
          if (lignesDeLaMaille.length === 0) return [];
          return [
            {
              maille: libelleMaille({ maille }),
              ...champsMaille(lignesDeLaMaille),
            },
          ];
        }),
      })),
    }),
  );
}
