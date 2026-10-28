import { z } from "zod";
import { Albert } from "@/server/albert/Albert";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  collecterChantiers,
  type GetChantiersOutput,
  type ResultatChantiers,
} from "@/server/albert/tools/getChantiers";
import {
  collecterTauxAvancement,
  type GetTauxAvancementTerritoireResult,
} from "@/server/albert/tools/getTauxAvancementTerritoire";
import type {
  GetChantierIndicateursQuery,
  GetChantierIndicateursResult,
} from "@/server/chantiers/query/GetChantierIndicateursQuery";
import type { GetChantiersQuery } from "@/server/chantiers/query/GetChantiersQuery";
import type { GetTerritoiresIdentiteQuery } from "@/server/chantiers/query/GetTerritoiresIdentiteQuery";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

/**
 * Une vue de chantiers sur plusieurs territoires. L'analyse sans objet est
 * rattachée à son territoire : au national, elle ne doit pas masquer les
 * chantiers en retard des autres territoires comparés.
 */
export type ChantiersEncart = {
  resultats: ResultatChantiers[];
  non_applicable?: { territoire_code: string; raison: string }[];
  acces_refuse?: true;
};

/** Ce que l'outil a collecté et passé au sous-agent de rédaction. */
export type DonneesEncart = {
  taux: GetTauxAvancementTerritoireResult[];
  chantiers_en_retard: ChantiersEncart;
  chantiers_en_difficulte: ChantiersEncart;
  /** Les indicateurs des chantiers des deux vues, quand la demande les cite. */
  indicateurs?: GetChantierIndicateursResult[];
};

/**
 * Un état de l'encart de synthèse ou de comparaison (PIL-1900). L'outil en
 * renvoie un à chaque morceau rédigé : l'interface remplit l'encart au fil
 * de la rédaction.
 */
export type EncartOutput = {
  type: "synthese" | "comparaison";
  jalon: number;
  /** L'instant de rédaction (ISO 8601) : le navigateur l'affiche dans son fuseau. */
  date_redaction: string;
  markdown: string;
  termine: boolean;
  acces_refuse?: true;
  /** Seulement dans le dernier état : les données lues par le juge des evals. */
  donnees?: DonneesEncart;
};

/**
 * L'écart tel que l'encart l'écrit, signe compris : le sous-agent recopie une
 * chaîne mieux qu'il ne reformate un nombre (il écrivait « 22 points » pour
 * −22, mesure de l'étape 4).
 */
export function ecartPourLeSousAgent({
  ecart,
}: {
  ecart: number | null;
}): string {
  if (ecart === null) return "écart non calculé";
  const arrondi = Math.round(ecart);
  const signe = arrondi < 0 ? "−" : arrondi > 0 ? "+" : "";
  const points = Math.abs(arrondi) > 1 ? "points" : "point";
  return `${signe}${Math.abs(arrondi)} ${points}`;
}

const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

const valeurPourLeSousAgent = ({
  valeur,
  unite,
}: {
  valeur: number | null;
  unite: string | null;
}): string =>
  valeur === null
    ? "non renseignée"
    : `${nombre.format(valeur)}${unite ? ` ${unite}` : ""}`;

const indicateursPourLeSousAgent = (
  indicateurs: GetChantierIndicateursResult["indicateurs"],
) =>
  indicateurs.map((indicateur) => ({
    id: indicateur.indicateur_id,
    nom: indicateur.nom,
    valeur_initiale: valeurPourLeSousAgent({
      valeur: indicateur.valeur_initiale,
      unite: indicateur.unite_mesure,
    }),
    valeur_actuelle: valeurPourLeSousAgent({
      valeur: indicateur.valeur_actuelle,
      unite: indicateur.unite_mesure,
    }),
    valeur_cible: valeurPourLeSousAgent({
      valeur: indicateur.valeur_cible,
      unite: indicateur.unite_mesure,
    }),
    taux_avancement:
      indicateur.taux_avancement === null
        ? "non calculé"
        : `${Math.round(indicateur.taux_avancement)} %`,
  }));

const vuePourLeSousAgent = (
  vue: ChantiersEncart,
  indicateurs?: GetChantierIndicateursResult[],
) => ({
  resultats: vue.resultats.map((resultat) => ({
    territoire_code: resultat.territoire_code,
    territoire_nom: resultat.territoire_nom,
    ...(resultat.acces_restreint && { acces_restreint: true }),
    // Un chantier de la vue en fait partie : les drapeaux est_en_retard et
    // est_en_difficulte, forcés à faux hors de l'accès complet, l'induisaient
    // en erreur.
    chantiers: resultat.chantiers.map((chantier) => ({
      id: chantier.chantier.id,
      nom: chantier.chantier.nom,
      ecart: ecartPourLeSousAgent({ ecart: chantier.ecart }),
      niveau_de_confiance: chantier.niveau_de_confiance,
      tendance: chantier.tendance,
      commentaire_de_synthese: chantier.synthese?.commentaire ?? null,
      ...(indicateurs && {
        indicateurs: indicateursPourLeSousAgent(
          indicateurs.find(
            (indicateursDuChantier) =>
              indicateursDuChantier.territoire_code ===
                resultat.territoire_code &&
              indicateursDuChantier.chantier_id === chantier.chantier.id,
          )?.indicateurs ?? [],
        ),
      }),
    })),
  })),
  ...(vue.non_applicable && { non_applicable: vue.non_applicable }),
});

/** Ce que le sous-agent lit : seulement ce que le gabarit écrit. */
const donneesPourLeSousAgent = (donnees: DonneesEncart) => ({
  taux: donnees.taux,
  chantiers_en_retard: vuePourLeSousAgent(
    donnees.chantiers_en_retard,
    donnees.indicateurs,
  ),
  chantiers_en_difficulte: vuePourLeSousAgent(
    donnees.chantiers_en_difficulte,
    donnees.indicateurs,
  ),
});

/**
 * Chaque état renvoie tout le texte rédigé : un état par morceau ferait
 * transiter un volume quadratique. On en envoie au plus un par intervalle.
 */
const INTERVALLE_ENVOI_MS = 150;

export async function* redigerEncart({
  type,
  jalon,
  systemPrompt,
  donnees,
  abortSignal,
  maintenant = new Date(),
}: {
  type: EncartOutput["type"];
  jalon: number;
  systemPrompt: string;
  donnees: DonneesEncart;
  abortSignal?: AbortSignal;
  maintenant?: Date;
}): AsyncGenerator<EncartOutput> {
  const etat = (markdown: string, termine: boolean): EncartOutput => ({
    type,
    jalon,
    date_redaction: maintenant.toISOString(),
    markdown,
    termine,
  });

  // Les deux vues dépendent des mêmes chantiers accessibles ; au national, la
  // vue en retard s'arrête avant le contrôle d'accès.
  if (
    donnees.chantiers_en_retard.acces_refuse ||
    donnees.chantiers_en_difficulte.acces_refuse
  ) {
    yield { ...etat("", true), acces_refuse: true };
    return;
  }

  yield etat("", false);

  let markdown = "";
  let dernierEnvoi = Date.now();
  for await (const morceau of Albert.streamSubagentText({
    systemPrompt,
    prompt: JSON.stringify(donneesPourLeSousAgent(donnees)),
    abortSignal,
  })) {
    markdown += morceau;
    if (Date.now() - dernierEnvoi >= INTERVALLE_ENVOI_MS) {
      dernierEnvoi = Date.now();
      yield etat(markdown, false);
    }
  }

  yield { ...etat(markdown, true), donnees };
}

/**
 * Le modèle principal ne relit que le texte de l'encart, pas les données :
 * il répond aux questions de suivi à partir de ce que l'utilisateur a vu.
 */
export const encartVersModele = ({
  output,
}: {
  output: EncartOutput;
}): { type: "text"; value: string } => ({
  type: "text",
  value: output.acces_refuse
    ? "Accès refusé : l'utilisateur n'a accès à aucun chantier."
    : output.markdown,
});

export const jalonEncartSchema = z
  .number()
  .int()
  .min(2022)
  .max(new Date().getFullYear())
  .describe("Année du jalon (ex: 2024, 2025)");

export type DependancesEncart = {
  getChantiersQuery: GetChantiersQuery;
  territoireResolver: TerritoireResolver;
  getTerritoiresIdentiteQuery: GetTerritoiresIdentiteQuery;
  getChantierIndicateursQuery?: GetChantierIndicateursQuery;
};

function fusionnerChantiers(
  sorties: { territoire_code: string; sortie: GetChantiersOutput }[],
): ChantiersEncart {
  const nonApplicables = sorties.flatMap(({ territoire_code, sortie }) =>
    sortie.non_applicable
      ? [{ territoire_code, raison: sortie.non_applicable.raison }]
      : [],
  );
  return {
    resultats: sorties.flatMap(({ sortie }) => sortie.resultats),
    ...(nonApplicables.length > 0 && { non_applicable: nonApplicables }),
    ...(sorties.some(({ sortie }) => sortie.acces_refuse) && {
      acces_refuse: true as const,
    }),
  };
}

/**
 * Les données d'un encart, collectées comme le feraient
 * `get_taux_avancement_territoire` et `get_chantiers` (vues en retard et en
 * difficulté) : mêmes règles d'accès, mêmes libellés.
 */
export async function collecterDonneesEncart({
  territoireCodes,
  includeSousTerritoires,
  jalon,
  habilitations,
  getChantiersQuery,
  territoireResolver,
  getTerritoiresIdentiteQuery,
  getChantierIndicateursQuery,
  avecIndicateurs = false,
}: DependancesEncart & {
  territoireCodes: string[];
  includeSousTerritoires: boolean;
  jalon: number;
  habilitations: Habilitations;
  avecIndicateurs?: boolean;
}): Promise<DonneesEncart> {
  const vue = async (
    territoire_code: string,
    view: "en_retard" | "en_difficulte",
  ) => ({
    territoire_code,
    sortie: await collecterChantiers({
      input: {
        territoire_code,
        jalon,
        view,
        include_sous_territoires: includeSousTerritoires,
      },
      getChantiersQuery,
      territoireResolver,
      territoiresAccessibles: habilitations.lecture.territoires,
      chantiersAccessibles: habilitations.lecture.chantiers,
    }),
  });

  const [taux, enRetard, enDifficulte] = await Promise.all([
    Promise.all(
      territoireCodes.map((territoire_code) =>
        collecterTauxAvancement({
          input: {
            territoire_code,
            jalon,
            include_sous_territoires: includeSousTerritoires,
          },
          territoireResolver,
          getTerritoiresIdentiteQuery,
          habilitations,
        }),
      ),
    ),
    Promise.all(territoireCodes.map((code) => vue(code, "en_retard"))),
    Promise.all(territoireCodes.map((code) => vue(code, "en_difficulte"))),
  ]);

  const donnees: DonneesEncart = {
    taux: taux.flatMap((sortie) => sortie.resultats),
    chantiers_en_retard: fusionnerChantiers(enRetard),
    chantiers_en_difficulte: fusionnerChantiers(enDifficulte),
  };
  if (!avecIndicateurs || !getChantierIndicateursQuery) return donnees;

  const chantiersDesVues = [
    ...donnees.chantiers_en_retard.resultats,
    ...donnees.chantiers_en_difficulte.resultats,
  ].flatMap((resultat) =>
    resultat.chantiers.map((chantier) => ({
      territoireCode: resultat.territoire_code,
      chantierId: chantier.chantier.id,
    })),
  );
  const indicateurs = await Promise.all(
    chantiersDesVues.map(({ territoireCode, chantierId }) =>
      getChantierIndicateursQuery.execute({
        territoireCode,
        chantierId,
        jalon,
      }),
    ),
  );
  return { ...donnees, indicateurs };
}
