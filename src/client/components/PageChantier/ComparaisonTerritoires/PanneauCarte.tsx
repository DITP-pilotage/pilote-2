import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import { WidgetCartographieMeteo } from "@/components/_commons/Widget/WidgetCartographieMeteo/WidgetCartographieMeteo";
import { Icone } from "@/components/_commons/Icone";
import { DeleteIcon } from "@/components/_commons/Icones/DeleteIcon";
import { WidgetCartographiePVA } from "@/components/_commons/Widget/WidgetCartographiePVA/WidgetCartographiePVA";
import { TypeCarte } from "./ComparaisonTerritoires.interface";
import { SelecteurTypeCarte } from "./SelecteurTypeCarte";

type PanneauCarteProps = {
  chantierId: string;
  jalon: number;
  maille: MailleInterne;
  territoireCode: string;
  typeCarte: TypeCarte;
  estEnComparaison: boolean;
  onChangerType: (type: TypeCarte) => void;
  onComparer: () => void;
  onSupprimer: () => void;
};

export const PanneauCarte = ({
  chantierId,
  jalon,
  maille,
  territoireCode,
  typeCarte,
  estEnComparaison,
  onChangerType,
  onComparer,
  onSupprimer,
}: PanneauCarteProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-2">
        <SelecteurTypeCarte
          jalon={jalon}
          typeCarte={typeCarte}
          onChange={onChangerType}
        />
        {estEnComparaison ? (
          <button
            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
            onClick={onSupprimer}
            type="button"
          >
            <Icone className="w-4 h-4 mr-1" icone={DeleteIcon} />
            supprimer la carte
          </button>
        ) : (
          <button
            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
            onClick={onComparer}
            type="button"
          >
            + comparer avec une autre carte
          </button>
        )}
      </div>

      {typeCarte === "ta" ? (
        <WidgetCartographieTA
          mode="chantiers"
          chantierIds={[chantierId]}
          jalon={jalon}
          maille={maille}
          territoireCode={territoireCode}
        />
      ) : typeCarte === "meteo" ? (
        <WidgetCartographieMeteo
          chantierId={chantierId}
          jalon={jalon}
          maille={maille}
          territoireCode={territoireCode}
        />
      ) : typeCarte === "pva" ? (
        <WidgetCartographiePVA
          chantierId={chantierId}
          jalon={jalon}
          maille={maille}
          territoireCode={territoireCode}
        />
      ) : null}
    </div>
  );
};
