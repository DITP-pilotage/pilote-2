import { getLabelTerritoire } from "@/client/constants/territoires";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";
import {
  ContenuCsv,
  filtrerTerritoires,
  formaterDateCsv,
  genererCsv,
  telechargerCsv,
} from "@/client/utils/csv/genererCsv";
import api from "@/server/infrastructure/api/trpc/api";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";
import { MeteoTerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierMeteosTerritoiresQuery";
import { PVATerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierPVACountTerritoiresQuery";
import { TypeCarteChantier } from "./ComparaisonTerritoires";

const construireContenuCsv = (
  params:
    | {
        type: "ta";
        donneesTA: TauxAvancementComparaisonTerritoireViewModel[];
        codesTerritoiresSelectionnes: string[];
      }
    | {
        type: "meteo";
        donneesMeteo: MeteoTerritoireViewModel[];
        codesTerritoiresSelectionnes: string[];
      }
    | {
        type: "pva";
        donneesPVA: PVATerritoireViewModel[];
        codesTerritoiresSelectionnes: string[];
      },
): ContenuCsv => {
  if (params.type === "ta") {
    const { donneesTA, codesTerritoiresSelectionnes } = params;
    return {
      colonnes: [
        "Territoire",
        "Taux d'avancement",
        "Date de dernière mise à jour",
      ],
      lignes: filtrerTerritoires(donneesTA, codesTerritoiresSelectionnes).map(
        (territoire) => [
          getLabelTerritoire(territoire.territoireCode),
          territoire.tauxAvancementJalon !== null
            ? String(territoire.tauxAvancementJalon)
            : "Non renseigné",
          formaterDateCsv(territoire.dateTauxAvancementAnnuel),
        ],
      ),
    };
  }

  if (params.type === "meteo") {
    const { donneesMeteo, codesTerritoiresSelectionnes } = params;
    return {
      colonnes: ["Territoire", "Niveau de confiance", "Date de publication"],
      lignes: filtrerTerritoires(
        donneesMeteo,
        codesTerritoiresSelectionnes,
      ).map((territoire) => [
        getLabelTerritoire(territoire.territoireCode),
        territoire.meteo,
        formaterDateCsv(territoire.dateDeMajQualitative),
      ]),
    };
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

export const useExporterComparaisonEnCsv = ({
  chantierId,
  jalon,
  territoireCode,
}: {
  chantierId: string;
  jalon: number;
  territoireCode: string;
}) => {
  const utils = api.useUtils();
  const [territoiresCompares] = useTerritoiresCompares();

  return (type: TypeCarteChantier) => {
    const codesTerritoiresSelectionnes = [
      territoireCode,
      ...territoiresCompares.split(",").filter(Boolean),
    ];
    const nomFichier = `comparaison-territoriale-${chantierId}-${type}.csv`;

    const exporter = (contenu: ContenuCsv) =>
      telechargerCsv(genererCsv(contenu.colonnes, contenu.lignes), nomFichier);

    if (type === "ta") {
      return exporter(
        construireContenuCsv({
          type,
          donneesTA:
            utils.chantier.recupererTauxAvancementTerritoires.getData({
              chantierIds: [chantierId],
              jalon,
            }) ?? [],
          codesTerritoiresSelectionnes,
        }),
      );
    }

    if (type === "meteo") {
      return exporter(
        construireContenuCsv({
          type,
          donneesMeteo:
            utils.chantier.recupererMeteosTerritoires.getData({
              chantierId,
              jalon,
            }) ?? [],
          codesTerritoiresSelectionnes,
        }),
      );
    }

    return exporter(
      construireContenuCsv({
        type,
        donneesPVA:
          utils.chantier.recupererPVAChantierTerritoires.getData({
            chantierId,
            jalon,
          }) ?? [],
        codesTerritoiresSelectionnes,
      }),
    );
  };
};
