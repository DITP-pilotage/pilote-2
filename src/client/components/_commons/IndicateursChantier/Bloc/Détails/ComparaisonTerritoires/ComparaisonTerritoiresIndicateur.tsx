import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { WidgetCartographieTAComparaison } from "@/components/_commons/Widget/WidgetCartographieTAComparaison/WidgetCartographieTAComparaison";
import { WidgetCartographieValeurAvancement } from "@/components/_commons/Widget/WidgetCartographieValeurAvancement/WidgetCartographieValeurAvancement";
import { WidgetCartographiePVA } from "@/components/_commons/Widget/WidgetCartographiePVA/WidgetCartographiePVA";
import { BoutonExportCsvTAIndicateur } from "@/components/_commons/Widget/WidgetCartographieTA/BoutonExportCsvTAIndicateur";
import { BoutonExportCsvVA } from "@/components/_commons/Widget/WidgetCartographieValeurAvancement/BoutonExportCsvVA";
import { ComparaisonTerritoires } from "@/components/_commons/ComparaisonTerritoires/ComparaisonTerritoires";

type TypeCarteIndicateur = "ta" | "va" | "pva";

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
}) => (
  <ComparaisonTerritoires<TypeCarteIndicateur>
    mode="inline"
    typeParDefaut="ta"
    typeAlternatif={(t) => (t === "ta" ? "va" : "ta")}
    options={options(jalon)}
    nomFichier={`comparaison-territoriale-${indicateurId}`}
    renderBoutonExportCsv={(type) => {
      if (type === "ta") {
        return (
          <BoutonExportCsvTAIndicateur
            indicateurId={indicateurId}
            chantierId={chantierId}
            nomFichier={`comparaison-territoriale-${indicateurId}`}
            territoireCode={territoireCode}
          />
        );
      }
      if (type === "va") {
        return (
          <BoutonExportCsvVA
            indicateurId={indicateurId}
            chantierId={chantierId}
            nomFichier={`comparaison-territoriale-${indicateurId}`}
            territoireCode={territoireCode}
          />
        );
      }
      return null;
    }}
    renderCarte={(type) => {
      if (type === "ta") {
        return (
          <WidgetCartographieTAComparaison
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
