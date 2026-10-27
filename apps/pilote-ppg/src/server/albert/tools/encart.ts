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
};

/**
 * Un état de l'encart de synthèse ou de comparaison (PIL-1900). L'outil en
 * renvoie un à chaque morceau rédigé : l'interface remplit l'encart au fil
 * de la rédaction.
 */
export type EncartOutput = {
  type: "synthese" | "comparaison";
  jalon: number;
  /** AAAA-MM-JJ */
  date_redaction: string;
  markdown: string;
  termine: boolean;
  acces_refuse?: true;
  /** Seulement dans le dernier état : les données lues par le juge des evals. */
  donnees?: DonneesEncart;
};

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
    date_redaction: maintenant.toISOString().slice(0, 10),
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
    prompt: JSON.stringify(donnees),
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
}: DependancesEncart & {
  territoireCodes: string[];
  includeSousTerritoires: boolean;
  jalon: number;
  habilitations: Habilitations;
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

  return {
    taux: taux.flatMap((sortie) => sortie.resultats),
    chantiers_en_retard: fusionnerChantiers(enRetard),
    chantiers_en_difficulte: fusionnerChantiers(enDifficulte),
  };
}
