import { tool } from "ai";
import { z } from "zod";
import { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { filtrerEvenementsSupersedes } from "@/server/indicateur-territoire-valeur-evenement/domain/filtrerEvenementsSupersedes";
import { libelleEvenementIndicateurTerritoireValeur } from "@/server/indicateur-territoire-valeur-evenement/domain/libelleEvenementIndicateurTerritoireValeur";
import { PROPOSITION_TYPES_EVENEMENT } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";
import { toISODate, toISODateTime } from "@/server/app/domain/Dates";
import { formaterDate } from "@/client/utils/date/date";

const SEUIL_BESOIN_PRECISION = 40;
const PLAFOND_EVENEMENTS = 100;

export const getHistoriqueIndicateurInputSchema = z.object({
  indicateur_id: z.string().describe("Identifiant canonique de l'indicateur"),
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  date_debut: z.iso
    .date()
    .optional()
    .describe("Date de début de la période demandée (ISO, ex: 2024-01-01)"),
  date_fin: z.iso
    .date()
    .optional()
    .describe("Date de fin de la période demandée (ISO, ex: 2024-12-31)"),
  type_filtre: z
    .enum(["TOUS", "PROPOSITIONS"])
    .optional()
    .default("TOUS")
    .describe(
      "Mets 'PROPOSITIONS' quand la question porte spécifiquement sur les propositions de valeur d'avancement (PVA) — création, modification, accusé de réception, acceptation, refus. Sinon laisse 'TOUS'.",
    ),
});

type EvenementLisible = {
  ordre: number;
  date_creation: string;
  libelle: string;
  type_valeur: string;
};

export type GetHistoriqueIndicateurOutput = {
  indicateur: { id: string; nom: string; unite_mesure: string | null } | null;
  territoire_code?: string;
  agrege_bloque?: true;
  besoin_precision?: true;
  nombre_evenements?: number;
  date_evenement_la_plus_ancienne?: string;
  date_evenement_la_plus_recente?: string;
  groupes?: { date_valeur: string; evenements: EvenementLisible[] }[];
  introuvable?: true;
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS =
  "Ces données représentent un HISTORIQUE : les actions qui ont eu lieu sur la valeur de cet indicateur (import, modification, proposition, acceptation, refus...), groupées par date et dans l'ordre chronologique. Deux dates distinctes apparaissent, ne les confonds pas : `date_valeur` (par groupe) est le mois auquel s'applique la valeur d'avancement, déjà au format MM/AAAA — reprends-le tel quel ; `date_creation` (par événement) est la date et l'heure réelles auxquelles l'action a eu lieu, déjà formatée en entier — reprends-la telle quelle aussi. Décris l'enchaînement des actions en citant ces deux dates pour chaque événement. Si l'utilisateur veut plutôt la tendance/courbe de la valeur dans le temps, indique-lui simplement que c'est possible, sans citer de nom d'outil technique.";

const INDICATEUR_INTROUVABLE_INSTRUCTIONS =
  "Cet indicateur est introuvable. Informe l'utilisateur qu'aucun indicateur ne correspond à cet identifiant.";

const AGREGE_BLOQUE_INSTRUCTIONS =
  "Les résultats de cet indicateur à ce niveau sont agrégés depuis la maille inférieure : aucune action (import, proposition...) n'y est directement enregistrée, donc pas d'historique disponible à cette maille. Explique-le à l'utilisateur plutôt que de renvoyer une liste vide.";

function construireInstructionsBesoinPrecision(
  nombreEvenements: number,
): string {
  return `Il y a ${nombreEvenements} événements pour cet indicateur sur ce territoire, trop pour être tous présentés d'un coup. Propose à l'utilisateur une période en t'appuyant sur les bornes fournies (date_evenement_la_plus_ancienne / date_evenement_la_plus_recente, au format ISO) — dans ta réponse à l'utilisateur, exprime cette période au format MM/AAAA, mais réutilise les bornes ISO telles quelles comme date_debut / date_fin quand tu rappelles cet outil.`;
}

function construireLibelleLisible(
  evenement: IndicateurTerritoireValeurEvenement,
): string {
  const { description, resultat } = libelleEvenementIndicateurTerritoireValeur(
    evenement.typeEvenement,
    evenement.valeur ?? null,
  );

  return [description, resultat ? `→ ${resultat}` : null]
    .filter((partie): partie is string => Boolean(partie))
    .join(" ");
}

export function createGetHistoriqueIndicateurTool({
  getIndicateurContexteQuery,
  indicateurTerritoireValeurEvenementRepository,
}: {
  getIndicateurContexteQuery: GetIndicateurContexteQuery;
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
}) {
  return () => {
    return tool({
      description: `Récupère l'historique des actions (import, modification, proposition, acceptation, refus...) sur la valeur d'un indicateur pour un territoire donné.

Utilise cet outil quand l'utilisateur demande l'historique, le détail des actions, ou pose une question sur une proposition de valeur d'avancement (PVA) — mets alors type_filtre à "PROPOSITIONS".

⚠️ Ne renvoie PAS la tendance/courbe de la valeur dans le temps — pour ça, utilise get_evolution_indicateur.`,
      inputSchema: getHistoriqueIndicateurInputSchema,
      execute: async (input): Promise<GetHistoriqueIndicateurOutput> => {
        const contexte = await getIndicateurContexteQuery.execute({
          indicateurId: input.indicateur_id,
        });

        if (!contexte) {
          return {
            indicateur: null,
            introuvable: true,
            _output_instructions: INDICATEUR_INTROUVABLE_INSTRUCTIONS,
          };
        }

        const indicateurResume = {
          id: contexte.id,
          nom: contexte.nom,
          unite_mesure: contexte.uniteMesure,
        };

        const { maille } = territoireCodeVersMailleCodeInsee(
          input.territoire_code,
        );

        if (
          (maille === "NAT" && contexte.mailleNatAgregee) ||
          (maille === "REG" && contexte.mailleRegAgregee)
        ) {
          return {
            indicateur: indicateurResume,
            territoire_code: input.territoire_code,
            agrege_bloque: true,
            _output_instructions: AGREGE_BLOQUE_INSTRUCTIONS,
          };
        }

        const dateDebut = input.date_debut
          ? new Date(input.date_debut)
          : undefined;
        const dateFin = input.date_fin ? new Date(input.date_fin) : undefined;
        const typesEvenement =
          input.type_filtre === "PROPOSITIONS"
            ? PROPOSITION_TYPES_EVENEMENT
            : undefined;

        const filtres = {
          indicId: input.indicateur_id,
          territoireCode: input.territoire_code,
          dateDebut,
          dateFin,
          typesEvenement,
        };

        const nombreEvenements =
          await indicateurTerritoireValeurEvenementRepository.compterHistoriqueParIndicIdEtTerritoireCode(
            filtres,
          );

        if (
          nombreEvenements > SEUIL_BESOIN_PRECISION &&
          !dateDebut &&
          !dateFin
        ) {
          const { dateMin, dateMax } =
            await indicateurTerritoireValeurEvenementRepository.recupererBornesDatesHistorique(
              filtres,
            );

          return {
            indicateur: indicateurResume,
            territoire_code: input.territoire_code,
            besoin_precision: true,
            nombre_evenements: nombreEvenements,
            date_evenement_la_plus_ancienne: dateMin
              ? toISODate(dateMin)
              : undefined,
            date_evenement_la_plus_recente: dateMax
              ? toISODate(dateMax)
              : undefined,
            _output_instructions:
              construireInstructionsBesoinPrecision(nombreEvenements),
          };
        }

        const evenements = (
          await indicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode(
            filtres,
          )
        ).slice(0, PLAFOND_EVENEMENTS);

        const evenementsParDate = new Map<
          string,
          IndicateurTerritoireValeurEvenement[]
        >();
        evenements.forEach((evenement) => {
          const dateKey = toISODate(evenement.dateValeur);
          const groupe = evenementsParDate.get(dateKey) ?? [];
          groupe.push(evenement);
          evenementsParDate.set(dateKey, groupe);
        });

        const groupes = Array.from(evenementsParDate.entries())
          .sort(([dateA], [dateB]) => (dateA < dateB ? 1 : -1))
          .map(([dateValeur, evenementsDuJour]) => {
            const evenementsDuJourTriesDesc = [...evenementsDuJour].sort(
              (a, b) => b.ordre - a.ordre,
            );
            const evenementsRestants = filtrerEvenementsSupersedes(
              evenementsDuJourTriesDesc,
            ).sort((a, b) => a.ordre - b.ordre);

            return {
              date_valeur: formaterDate(dateValeur, "MM/YYYY") ?? dateValeur,
              evenements: evenementsRestants.map(
                (evenement): EvenementLisible => ({
                  ordre: evenement.ordre,
                  date_creation:
                    formaterDate(
                      toISODateTime(evenement.dateCreation),
                      "DD/MM/YYYY HH[:]mm",
                    ) ?? toISODateTime(evenement.dateCreation),
                  libelle: construireLibelleLisible(evenement),
                  type_valeur: evenement.typeValeur,
                }),
              ),
            };
          });

        return {
          indicateur: indicateurResume,
          territoire_code: input.territoire_code,
          groupes,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
