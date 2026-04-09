import { useCallback, useEffect } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import { WidgetCartographieValeurAvancement } from "@/components/_commons/Widget/WidgetCartographieValeurAvancement/WidgetCartographieValeurAvancement";
import { WidgetCartographiePVA } from "@/components/_commons/Widget/WidgetCartographiePVA/WidgetCartographiePVA";
import { ComparaisonTerritoires } from "@/components/_commons/ComparaisonTerritoires/ComparaisonTerritoires";
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

type TypeCarteIndicateur = "ta" | "va" | "pva";

export const construireContenuCsv = ({
  type,
  donneesParJalonTA,
  donneesParJalonVA,
  donneesPVA,
  jalons,
  codesTerritoiresSelectionnes,
}: {
  type: TypeCarteIndicateur;
  donneesParJalonTA: Map<
    number,
    {
      territoireCode: string;
      estApplicable: boolean | null;
      dateTauxAvancementAnnuel: string | null;
      tauxAvancementJalon: number | null;
    }[]
  >;
  donneesParJalonVA: Map<
    number,
    {
      territoireCode: string;
      estApplicable: boolean | null;
      dateValeurAvancement: string | null;
      valeurAvancement: number | null;
    }[]
  >;
  donneesPVA: {
    territoireCode: string;
    estApplicable: boolean | null;
    nombrePropositionsValeur: number;
  }[];
  jalons: number[];
  codesTerritoiresSelectionnes: string[];
}): ContenuCsv => {
  if (type === "ta") {
    const colonnes = [
      "Territoire",
      ...jalons.flatMap((jalonCourant) => [
        `date ${jalonCourant}`,
        `taux ${jalonCourant}`,
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

  if (type === "va") {
    const colonnes = [
      "Territoire",
      ...jalons.flatMap((jalonCourant) => [
        `date ${jalonCourant}`,
        `valeur ${jalonCourant}`,
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

const options: (
  jalon: number,
) => { value: TypeCarteIndicateur; label: string }[] = (jalon) => [
  { value: "ta", label: `Carte des taux d'avancement ${jalon}` },
  { value: "va", label: "Carte des valeurs d'avancement" },
  {
    value: "pva",
    label: "Carte des propositions de valeur d'avancement",
  },
];

export const ComparaisonTerritoiresIndicateur = ({
  indicateurId,
  chantierId,
  jalon,
  maille,
  territoireCode,
  unite,
}: {
  indicateurId: string;
  chantierId: string;
  jalon: number;
  maille: MailleInterne;
  territoireCode: string;
  unite: string | null;
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

  const exporterEnCsv = useCallback(
    (type: TypeCarteIndicateur) => {
      const codesTerritoiresSelectionnes = [
        territoireCode,
        ...territoiresCompares.split(",").filter(Boolean),
      ];
      const jalons = buildJalons();

      const { colonnes, lignes } = construireContenuCsv({
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
        donneesPVA:
          utils.indicateur.recupererPVATerritoires.getData({
            indicateurId,
            chantierId,
            jalon,
          }) ?? [],
        jalons,
        codesTerritoiresSelectionnes,
      });

      telechargerCsv(
        genererCsv(colonnes, lignes),
        `comparaison-territoriale-${indicateurId}-${type}.csv`,
      );
    },
    [
      utils,
      indicateurId,
      chantierId,
      jalon,
      territoireCode,
      territoiresCompares,
    ],
  );

  return (
    <ComparaisonTerritoires<TypeCarteIndicateur>
      mode="inline"
      typeParDefaut="ta"
      typeAlternatif={(t) => (t === "ta" ? "va" : "ta")}
      options={options(jalon)}
      nomFichier={`comparaison-territoriale-${indicateurId}`}
      exporterEnCsv={exporterEnCsv}
      renderCarte={(type) => {
        if (type === "ta") {
          return (
            <WidgetCartographieTA
              mode="indicateur"
              indicateurId={indicateurId}
              chantierId={chantierId}
              jalon={jalon}
              maille={maille}
              territoireCode={territoireCode}
            />
          );
        }
        if (type === "va") {
          return (
            <WidgetCartographieValeurAvancement
              indicateurId={indicateurId}
              chantierId={chantierId}
              jalon={jalon}
              maille={maille}
              territoireCode={territoireCode}
              unite={unite}
            />
          );
        }
        if (type === "pva") {
          return (
            <WidgetCartographiePVA
              mode="indicateur"
              indicateurId={indicateurId}
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
