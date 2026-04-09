import { useCallback } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import { WidgetCartographieMeteo } from "@/components/_commons/Widget/WidgetCartographieMeteo/WidgetCartographieMeteo";
import { WidgetCartographiePVA } from "@/components/_commons/Widget/WidgetCartographiePVA/WidgetCartographiePVA";
import { ComparaisonTerritoires as ComparaisonTerritoiresBase } from "@/components/_commons/ComparaisonTerritoires/ComparaisonTerritoires";
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

type ComparaisonTerritoiresProps = {
  chantierId: string;
  jalon: number;
  maille: MailleInterne;
  territoireCode: string;
};

type TypeCarteChantier = "ta" | "meteo" | "pva";

const options: (
  jalon: number,
) => { value: TypeCarteChantier; label: string }[] = (jalon) => [
  { value: "ta", label: `Carte des taux d'avancement ${jalon}` },
  { value: "meteo", label: "Carte des niveaux de confiance" },
  {
    value: "pva",
    label: "Carte des propositions de valeur d'avancement",
  },
];

export const construireContenuCsv = ({
  type,
  donneesTA,
  donneesMeteo,
  donneesPVA,
  codesTerritoiresSelectionnes,
}: {
  type: TypeCarteChantier;
  donneesTA: TauxAvancementComparaisonTerritoireViewModel[];
  donneesMeteo: MeteoTerritoireViewModel[];
  donneesPVA: PVATerritoireViewModel[];
  codesTerritoiresSelectionnes: string[];
}): ContenuCsv => {
  if (type === "ta") {
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

  if (type === "meteo") {
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

export const ComparaisonTerritoires = ({
  chantierId,
  jalon,
  maille,
  territoireCode,
}: ComparaisonTerritoiresProps) => {
  const utils = api.useUtils();
  const [territoiresCompares] = useTerritoiresCompares();

  const exporterEnCsv = useCallback(
    (type: TypeCarteChantier) => {
      const codesTerritoiresSelectionnes = [
        territoireCode,
        ...territoiresCompares.split(",").filter(Boolean),
      ];

      const { colonnes, lignes } = construireContenuCsv({
        type,
        donneesTA:
          utils.chantier.recupererTauxAvancementTerritoires.getData({
            chantierIds: [chantierId],
            jalon,
          }) ?? [],
        donneesMeteo:
          utils.chantier.recupererMeteosTerritoires.getData({
            chantierId,
            jalon,
          }) ?? [],
        donneesPVA:
          utils.chantier.recupererPVAChantierTerritoires.getData({
            chantierId,
            jalon,
          }) ?? [],
        codesTerritoiresSelectionnes,
      });

      telechargerCsv(
        genererCsv(colonnes, lignes),
        `comparaison-territoriale-${chantierId}-${type}.csv`,
      );
    },
    [utils, chantierId, jalon, territoireCode, territoiresCompares],
  );

  return (
    <ComparaisonTerritoiresBase<TypeCarteChantier>
      typeParDefaut="ta"
      typeAlternatif={(t) => (t === "ta" ? "meteo" : "ta")}
      options={options(jalon)}
      nomFichier={`comparaison-territoriale-${chantierId}`}
      exporterEnCsv={exporterEnCsv}
      renderCarte={(type) => {
        if (type === "ta") {
          return (
            <WidgetCartographieTA
              mode="chantiers"
              chantierIds={[chantierId]}
              jalon={jalon}
              maille={maille}
              territoireCode={territoireCode}
            />
          );
        }
        if (type === "meteo") {
          return (
            <WidgetCartographieMeteo
              chantierId={chantierId}
              jalon={jalon}
              maille={maille}
              territoireCode={territoireCode}
            />
          );
        }
        if (type === "pva") {
          return (
            <WidgetCartographiePVA
              mode="chantier"
              chantierId={chantierId}
              jalon={jalon}
              maille={maille}
              territoireCode={territoireCode}
            />
          );
        }
        return null;
      }}
    />
  );
};
