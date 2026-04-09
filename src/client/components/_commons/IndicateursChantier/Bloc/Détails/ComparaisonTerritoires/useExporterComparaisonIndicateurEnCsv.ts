import { useEffect } from "react";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";
import {
  ContenuCsv,
  filtrerTerritoires,
  formaterDateCsv,
  genererCsv,
  telechargerCsv,
} from "@/client/utils/csv/genererCsv";
import { buildJalons } from "@/client/utils/jalons";
import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";
import { ValeurAvancementIndicateurTerritoire } from "@/server/chantiers/infrastructure/queries/RecupererValeursAvancementIndicateurTerritoiresQuery";
import { PVATerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierPVACountTerritoiresQuery";
import { TypeCarteIndicateur } from "./ComparaisonTerritoiresIndicateur";

const construireContenuCsv = (
  params:
    | {
        type: "ta";
        donneesParJalonTA: Map<
          number,
          TauxAvancementComparaisonTerritoireViewModel[]
        >;
        jalons: number[];
        codesTerritoiresSelectionnes: string[];
      }
    | {
        type: "va";
        donneesParJalonVA: Map<number, ValeurAvancementIndicateurTerritoire[]>;
        jalons: number[];
        codesTerritoiresSelectionnes: string[];
      }
    | {
        type: "pva";
        donneesPVA: PVATerritoireViewModel[];
        codesTerritoiresSelectionnes: string[];
      },
): ContenuCsv => {
  if (params.type === "ta") {
    const { donneesParJalonTA, jalons, codesTerritoiresSelectionnes } = params;
    const colonnes = [
      "Territoire",
      ...jalons.flatMap((jalonCourant) => [
        `Date de mise à jour ${jalonCourant}`,
        `Taux d'avancement ${jalonCourant}`,
      ]),
    ];

    const lignes = codesTerritoiresSelectionnes
      .map((code) => {
        const premierJalonDonnees = donneesParJalonTA
          .get(jalons[0])
          ?.find((territoire) => territoire.territoireCode === code);
        if (premierJalonDonnees?.estApplicable === false) return null;

        const cellules = jalons.flatMap((jalonCourant) => {
          const donneesTerritoire = donneesParJalonTA
            .get(jalonCourant)
            ?.find((territoire) => territoire.territoireCode === code);
          return [
            formaterDateCsv(
              donneesTerritoire?.dateTauxAvancementAnnuel ?? null,
            ),
            donneesTerritoire?.tauxAvancementJalon !== null &&
            donneesTerritoire?.tauxAvancementJalon !== undefined
              ? String(donneesTerritoire.tauxAvancementJalon)
              : "Non renseigné",
          ];
        });

        return [getLabelTerritoire(code), ...cellules];
      })
      .filter((ligne): ligne is string[] => ligne !== null);

    return { colonnes, lignes };
  }

  if (params.type === "va") {
    const { donneesParJalonVA, jalons, codesTerritoiresSelectionnes } = params;
    const colonnes = [
      "Territoire",
      ...jalons.flatMap((jalonCourant) => [
        `Date de mise à jour ${jalonCourant}`,
        `Valeur d'avancement ${jalonCourant}`,
      ]),
    ];

    const lignes = codesTerritoiresSelectionnes
      .map((code) => {
        const premierJalonDonnees = donneesParJalonVA
          .get(jalons[0])
          ?.find((territoire) => territoire.territoireCode === code);
        if (premierJalonDonnees?.estApplicable === false) return null;

        const cellules = jalons.flatMap((jalonCourant) => {
          const donneesTerritoire = donneesParJalonVA
            .get(jalonCourant)
            ?.find((territoire) => territoire.territoireCode === code);
          return [
            formaterDateCsv(donneesTerritoire?.dateValeurAvancement ?? null),
            donneesTerritoire?.valeurAvancement !== null &&
            donneesTerritoire?.valeurAvancement !== undefined
              ? String(donneesTerritoire.valeurAvancement)
              : "Non renseigné",
          ];
        });

        return [getLabelTerritoire(code), ...cellules];
      })
      .filter((ligne): ligne is string[] => ligne !== null);

    return { colonnes, lignes };
  }

  const { donneesPVA, codesTerritoiresSelectionnes } = params;
  return {
    colonnes: ["Territoire", "Nombre de propositions"],
    lignes: filtrerTerritoires(donneesPVA, codesTerritoiresSelectionnes).map(
      (territoire) => [
        getLabelTerritoire(territoire.territoireCode),
        String(territoire.nombrePropositionsValeur),
      ],
    ),
  };
};

export const useExporterComparaisonIndicateurEnCsv = ({
  indicateurId,
  chantierId,
  jalon,
  territoireCode,
}: {
  indicateurId: string;
  chantierId: string;
  jalon: number;
  territoireCode: string;
}) => {
  const utils = api.useUtils();
  const [territoiresCompares] = useTerritoiresCompares();

  useEffect(() => {
    for (const jalonCourant of buildJalons()) {
      void utils.indicateur.recupererTauxAvancementTerritoires.prefetch(
        { indicateurId, chantierId, jalon: jalonCourant },
        { staleTime: WIDGET_STALE_TIME },
      );
      void utils.indicateur.recupererValeursAvancementTerritoires.prefetch(
        { indicateurId, chantierId, jalon: jalonCourant },
        { staleTime: WIDGET_STALE_TIME },
      );
    }
  }, [utils, indicateurId, chantierId]);

  return (type: TypeCarteIndicateur) => {
    const codesTerritoiresSelectionnes = [
      territoireCode,
      ...territoiresCompares.split(",").filter(Boolean),
    ];
    const nomFichier = `comparaison-territoriale-${indicateurId}-${type}.csv`;

    const exporter = (contenu: ContenuCsv) =>
      telechargerCsv(genererCsv(contenu.colonnes, contenu.lignes), nomFichier);

    if (type === "ta") {
      const jalons = buildJalons();
      return exporter(
        construireContenuCsv({
          type,
          donneesParJalonTA: new Map(
            jalons.map((jalonCourant) => [
              jalonCourant,
              utils.indicateur.recupererTauxAvancementTerritoires.getData({
                indicateurId,
                chantierId,
                jalon: jalonCourant,
              }) ?? [],
            ]),
          ),
          jalons,
          codesTerritoiresSelectionnes,
        }),
      );
    }

    if (type === "va") {
      const jalons = buildJalons();
      return exporter(
        construireContenuCsv({
          type,
          donneesParJalonVA: new Map(
            jalons.map((jalonCourant) => [
              jalonCourant,
              utils.indicateur.recupererValeursAvancementTerritoires.getData({
                indicateurId,
                chantierId,
                jalon: jalonCourant,
              }) ?? [],
            ]),
          ),
          jalons,
          codesTerritoiresSelectionnes,
        }),
      );
    }

    return exporter(
      construireContenuCsv({
        type,
        donneesPVA:
          utils.indicateur.recupererPVATerritoires.getData({
            indicateurId,
            chantierId,
            jalon,
          }) ?? [],
        codesTerritoiresSelectionnes,
      }),
    );
  };
};
