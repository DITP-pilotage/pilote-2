import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import { WidgetCartographieValeurAvancement } from "@/components/_commons/Widget/WidgetCartographieValeurAvancement/WidgetCartographieValeurAvancement";
import { Icone } from "@/components/_commons/Icone";
import { DeleteIcon } from "@/components/_commons/Icones/DeleteIcon";
import { TypeCarteIndicateur } from "./ComparaisonTerritoires.interface";
import { SelecteurTypeCarteIndicateur } from "./SelecteurTypeCarteIndicateur";

type PanneauCarteIndicateurProps = {
  indicateurId: string;
  chantierId: string;
  jalon: number;
  maille: MailleInterne;
  territoireCode: string;
  unite: string | null;
  typeCarte: TypeCarteIndicateur;
  estEnComparaison: boolean;
  onChangerType: (type: TypeCarteIndicateur) => void;
  onComparer: () => void;
  onSupprimer: () => void;
};

export const PanneauCarteIndicateur = ({
  indicateurId,
  chantierId,
  jalon,
  maille,
  territoireCode,
  unite,
  typeCarte,
  estEnComparaison,
  onChangerType,
  onComparer,
  onSupprimer,
}: PanneauCarteIndicateurProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-2">
        <SelecteurTypeCarteIndicateur
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
          mode="indicateur"
          indicateurId={indicateurId}
          chantierId={chantierId}
          jalon={jalon}
          maille={maille}
          territoireCode={territoireCode}
        />
      ) : typeCarte === "valeurAvancement" ? (
        <WidgetCartographieValeurAvancement
          indicateurId={indicateurId}
          chantierId={chantierId}
          jalon={jalon}
          maille={maille}
          territoireCode={territoireCode}
          unite={unite}
        />
      ) : null}
    </div>
  );
};
