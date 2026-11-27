import type {
  ChantierResult,
  GetChantiersParams,
  GetChantiersQuery,
  GetChantiersResult,
} from "@/server/chantiers/query/GetChantiersQuery";
import { texteDepuisHtml } from "@/server/albert/tools/texteDepuisHtml";
import { personReference } from "@/shared/personne/personReference";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { Perimetre } from "@/server/albert/domain/Perimetre";
import { TERRITOIRE_NATIONAL } from "@/server/albert/tools/perimetre";
import {
  libelleNiveauDeConfiance,
  libelleTendance,
  mailleDePilotage,
} from "@/server/albert/tools/libelles";

/**
 * L'entrée de la collecte, sans tri ni limite : ils relèvent de l'outil
 * `get_chantiers`. Les encarts lui passent des périmètres que l'outil
 * n'expose pas, et ne doivent pas être tronqués.
 */
export type CollecteChantiersInput = {
  perimetre: Perimetre;
  jalon: number;
  chantier_ids?: string[];
  view: NonNullable<GetChantiersParams["view"]>;
  tendance?: GetChantiersParams["tendance"];
};

/**
 * Un chantier tel que la collecte le lit : des libellés, pas des codes
 * (PIL-1900, D1), et la synthèse des résultats, que lisent les encarts. Le
 * niveau de confiance est le libellé de la météo du chantier sur le
 * territoire.
 */
export type ChantierCollecte = {
  chantier: Omit<
    ChantierResult["chantier"],
    "mailles_applicables" | "directeurs_projet_ids"
  > & {
    maille_de_pilotage: ReturnType<typeof mailleDePilotage>;
    directeurs_projet: string[];
  };
  responsables_locaux: string[];
  coordinateurs_territoriaux: string[];
  taux_avancement: number | null;
  ecart: number | null;
  tendance: string | null;
  niveau_de_confiance: string | null;
  est_en_retard: boolean;
  est_en_difficulte: boolean;
  synthese: {
    commentaire: string | null;
    date_commentaire: string | null;
    auteur?: string;
    modifie_par?: string;
  } | null;
};

/** Les chantiers d'un territoire. */
export type ResultatChantiers<Chantier = ChantierCollecte> = Omit<
  GetChantiersResult,
  "chantiers"
> & {
  /** Territoire hors de l'accès complet : la tendance, les personnes et le commentaire de synthèse y sont masqués. */
  acces_restreint?: true;
  chantiers: Chantier[];
};

export type ChantiersCollectes<Chantier = ChantierCollecte> = {
  resultats: ResultatChantiers<Chantier>[];
  /** L'analyse sans objet est rattachée à son territoire : au national, elle ne masque pas les chantiers en retard des autres territoires. */
  non_applicable?: { territoire_code: string; raison: string }[];
  acces_refuse?: true;
};

const NON_APPLICABLE_EN_RETARD_NAT_FR =
  "L'analyse des chantiers en retard ne peut pas être réalisée au niveau national.\n\nEn effet, cet indicateur repose sur une comparaison entre le taux d'avancement d'un chantier pour un territoire donné et la valeur médiane observée sur l'ensemble des autres territoires.";

function toQueryParams(
  input: CollecteChantiersInput,
  territoireCodes: string[],
): GetChantiersParams {
  return {
    territoireCodes,
    jalon: input.jalon,
    chantierIds: input.chantier_ids,
    view: input.view,
    tendance: input.tendance,
  };
}

function versChantierCollecte(
  chantierResult: ChantierResult,
): ChantierCollecte {
  const { mailles_applicables, directeurs_projet_ids, ...chantier } =
    chantierResult.chantier;
  return {
    chantier: {
      ...chantier,
      maille_de_pilotage: mailleDePilotage({ mailles: mailles_applicables }),
      directeurs_projet: directeurs_projet_ids.map(personReference),
    },
    responsables_locaux:
      chantierResult.responsables_locaux_ids.map(personReference),
    coordinateurs_territoriaux:
      chantierResult.coordinateurs_territoriaux_ids.map(personReference),
    taux_avancement: chantierResult.taux_avancement,
    ecart: chantierResult.ecart,
    tendance: libelleTendance({ tendance: chantierResult.tendance }),
    niveau_de_confiance: libelleNiveauDeConfiance({
      meteo: chantierResult.meteo,
    }),
    est_en_retard: chantierResult.est_en_retard,
    est_en_difficulte: chantierResult.est_en_difficulte,
    synthese: chantierResult.synthese
      ? {
          commentaire:
            chantierResult.synthese.commentaire === null
              ? null
              : texteDepuisHtml({ html: chantierResult.synthese.commentaire }),
          date_commentaire: chantierResult.synthese.date_commentaire,
          auteur: personReference(chantierResult.synthese.auteur_creation_id),
          ...(chantierResult.synthese.auteur_modification_id !==
            chantierResult.synthese.auteur_creation_id && {
            modifie_par: personReference(
              chantierResult.synthese.auteur_modification_id,
            ),
          }),
        }
      : null,
  };
}

function masquerDonneesNonAccessibles(
  resultats: ResultatChantiers[],
  territoiresAccessibles: string[],
): ResultatChantiers[] {
  return resultats.map((resultat) => {
    if (territoiresAccessibles.includes(resultat.territoire_code)) {
      return resultat;
    }
    return {
      ...resultat,
      acces_restreint: true,
      chantiers: resultat.chantiers.map((chantier) => ({
        ...chantier,
        responsables_locaux: [],
        coordinateurs_territoriaux: [],
        tendance: null,
        est_en_retard: false,
        est_en_difficulte: false,
        synthese: chantier.synthese
          ? { commentaire: null, date_commentaire: null }
          : null,
      })),
    };
  });
}

/**
 * Les chantiers de chaque territoire du périmètre, partagés entre
 * `get_chantiers` et les outils d'encart : mêmes règles d'accès, mêmes
 * libellés.
 */
export async function collecterChantiers({
  input,
  getChantiersQuery,
  territoireResolver,
  territoiresAccessibles,
  chantiersAccessibles,
}: {
  input: CollecteChantiersInput;
  getChantiersQuery: GetChantiersQuery;
  territoireResolver: TerritoireResolver;
  territoiresAccessibles: string[];
  chantiersAccessibles: string[];
}): Promise<ChantiersCollectes> {
  const codesDuPerimetre = await territoireResolver.resoudre(input.perimetre);
  const sansObjet =
    input.view === "en_retard" &&
    codesDuPerimetre.includes(TERRITOIRE_NATIONAL);
  const codes = sansObjet
    ? codesDuPerimetre.filter((code) => code !== TERRITOIRE_NATIONAL)
    : codesDuPerimetre;
  const nonApplicable = sansObjet
    ? {
        non_applicable: [
          {
            territoire_code: TERRITOIRE_NATIONAL,
            raison: NON_APPLICABLE_EN_RETARD_NAT_FR,
          },
        ],
      }
    : {};

  if (codes.length === 0) {
    return { resultats: [], ...nonApplicable };
  }

  const chantiersDemandes =
    input.chantier_ids && input.chantier_ids.length > 0
      ? input.chantier_ids
      : undefined;

  // Une liste vide n'est pas filtrée par la query : le cas sans aucun
  // chantier accessible doit donc s'arrêter ici.
  const filteredChantierIds = (
    chantiersDemandes ?? chantiersAccessibles
  ).filter((id) => chantiersAccessibles.includes(id));

  if (filteredChantierIds.length === 0) {
    return { resultats: [], acces_refuse: true, ...nonApplicable };
  }

  const effectiveInput = { ...input, chantier_ids: filteredChantierIds };

  const resultats = await getChantiersQuery.execute(
    toQueryParams(effectiveInput, codes),
  );

  return {
    resultats: masquerDonneesNonAccessibles(
      resultats.map((resultat) => ({
        ...resultat,
        chantiers: resultat.chantiers.map(versChantierCollecte),
      })),
      territoiresAccessibles,
    ),
    ...nonApplicable,
  };
}
