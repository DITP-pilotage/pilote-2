import { FunctionComponent } from "react";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import { ProgressBarVariant } from "@/components/shared/ProgressBar";
import { JaugeDeProgressionCouleur } from "@/client/components/_commons/JaugeDeProgression/JaugeDeProgression.interface";

interface AvancementsTerritoireProps {
  territoireNom: string;
  avancement: number | null;
  dateAvancement: string | null;
  jalon: number;
  couleurBarreDeProgression: ProgressBarVariant;
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
      <div className="flex flex-col flex-wrap justify-center items-center">
        <strong className="m-[var(--text-spacing)] text-sm print:text-base mb-0 text-center">
          {titreTauxAvancement}
        </strong>
        <span className="m-[var(--text-spacing)] text-sm print:text-base ml-1">
          {jalon}
        </span>
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
