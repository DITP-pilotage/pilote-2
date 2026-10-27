import { z } from "zod";
import { Albert } from "@/server/albert/Albert";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  collecterChantiers,
  type GetChantiersOutput,
} from "@/server/albert/tools/getChantiers";
import {
  collecterTauxAvancement,
  type GetTauxAvancementTerritoireResult,
} from "@/server/albert/tools/getTauxAvancementTerritoire";
import type { GetChantiersQuery } from "@/server/chantiers/query/GetChantiersQuery";
import type { GetTerritoiresIdentiteQuery } from "@/server/chantiers/query/GetTerritoiresIdentiteQuery";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

/** Ce que l'outil a collecté et passé au sous-agent de rédaction. */
export type DonneesEncart = {
  taux: GetTauxAvancementTerritoireResult[];
  chantiers_en_retard: GetChantiersOutput;
  chantiers_en_difficulte: GetChantiersOutput;
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

  if (
    donnees.chantiers_en_retard.acces_refuse &&
    donnees.chantiers_en_difficulte.acces_refuse
  ) {
    yield { ...etat("", true), acces_refuse: true };
    return;
  }

  yield etat("", false);

  let markdown = "";
  for await (const morceau of Albert.streamSubagentText({
    systemPrompt,
    prompt: JSON.stringify(donnees),
    abortSignal,
  })) {
    markdown += morceau;
    yield etat(markdown, false);
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

function fusionnerChantiers(sorties: GetChantiersOutput[]): GetChantiersOutput {
  const nonApplicable = sorties.find((sortie) => sortie.non_applicable);
  return {
    resultats: sorties.flatMap((sortie) => sortie.resultats),
    ...(nonApplicable?.non_applicable && {
      non_applicable: nonApplicable.non_applicable,
    }),
    ...(sorties.every((sortie) => sortie.acces_refuse) && {
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
  const vue = (territoire_code: string, view: "en_retard" | "en_difficulte") =>
    collecterChantiers({
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
