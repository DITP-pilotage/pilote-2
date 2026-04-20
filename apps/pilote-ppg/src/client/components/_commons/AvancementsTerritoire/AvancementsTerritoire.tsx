import { FunctionComponent } from "react";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import { BarreDeProgressionVariante } from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { JaugeDeProgressionCouleur } from "@/client/components/_commons/JaugeDeProgression/JaugeDeProgression.interface";

interface AvancementsTerritoireProps {
  territoireNom: string;
  avancement: number | null;
  dateAvancement: string | null;
  jalon: number;
  couleurBarreDeProgression: BarreDeProgressionVariante;
  couleurJaugeDeProgression: JaugeDeProgressionCouleur;
  titreTauxAvancement: string;
}

const AvancementsTerritoire: FunctionComponent<AvancementsTerritoireProps> = ({
  territoireNom,
  avancement,
  dateAvancement,
  couleurJaugeDeProgression,
  jalon,
  titreTauxAvancement,
}) => {
  return (
    <>
      <div className="flex flex-direction-column flex-wrap justify-center align-center">
        <strong className="fr-text--sm fr-mb-0 text-center">
          {titreTauxAvancement}
        </strong>
        <span className="fr-text--sm fr-ml-1v">{jalon}</span>
      </div>
      <JaugeDeProgression
        couleur={couleurJaugeDeProgression}
        date={dateAvancement}
        libellé={territoireNom}
        pourcentage={avancement}
        taille="lg"
      />
    </>
  );
};

export default AvancementsTerritoire;
