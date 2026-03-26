import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import { WidgetCartographieValeurAvancement } from "@/components/_commons/Widget/WidgetCartographieValeurAvancement/WidgetCartographieValeurAvancement";
import { WidgetCartographiePVA } from "@/components/_commons/Widget/WidgetCartographiePVA/WidgetCartographiePVA";
import { ComparaisonTerritoires } from "@/components/_commons/ComparaisonTerritoires/ComparaisonTerritoires";

type ComparaisonTerritoiresIndicateurProps = {
  indicateurId: string;
  chantierId: string;
  jalon: number;
  maille: MailleInterne;
  territoireCode: string;
  unite: string | null;
};

type TypeCarteIndicateur = "ta" | "valeurAvancement" | "pva";

const options: (
  jalon: number,
) => { value: TypeCarteIndicateur; label: string }[] = (jalon) => [
  { value: "ta", label: `Carte des taux d'avancement ${jalon}` },
  { value: "valeurAvancement", label: "Carte des valeurs d'avancement" },
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
}: ComparaisonTerritoiresIndicateurProps) => (
  <ComparaisonTerritoires<TypeCarteIndicateur>
    typeParDefaut="ta"
    typeAlternatif={(t) => (t === "ta" ? "valeurAvancement" : "ta")}
    options={options(jalon)}
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
      if (type === "valeurAvancement") {
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
