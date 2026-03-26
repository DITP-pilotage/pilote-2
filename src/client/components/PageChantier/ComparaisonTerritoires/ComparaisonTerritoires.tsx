import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import { WidgetCartographieMeteo } from "@/components/_commons/Widget/WidgetCartographieMeteo/WidgetCartographieMeteo";
import { WidgetCartographiePVA } from "@/components/_commons/Widget/WidgetCartographiePVA/WidgetCartographiePVA";
import { ComparaisonTerritoires as ComparaisonTerritoiresBase } from "@/components/_commons/ComparaisonTerritoires/ComparaisonTerritoires";

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

export const ComparaisonTerritoires = ({
  chantierId,
  jalon,
  maille,
  territoireCode,
}: ComparaisonTerritoiresProps) => (
  <div className="fr-container">
    <ComparaisonTerritoiresBase<TypeCarteChantier>
      typeParDefaut="ta"
      typeAlternatif={(t) => (t === "ta" ? "meteo" : "ta")}
      options={options(jalon)}
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
  </div>
);
