import { FunctionComponent } from "react";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import BarreDeProgression, {
  BarreDeProgressionVariante,
} from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { JaugeDeProgressionCouleur } from "@/client/components/_commons/JaugeDeProgression/JaugeDeProgression.interface";
import { formaterDate } from "@/client/utils/date/date";

interface AvancementsTerritoireProps {
  territoireNom: string;
  avancementGlobal: number | null;
  dateAvancementGlobal: string | null;
  avancementAnnuel: number | null;
  dateAvancementAnnuel: string | null;
  jalon: number;
  couleurBarreDeProgression: BarreDeProgressionVariante;
  couleurJaugeDeProgression: JaugeDeProgressionCouleur;
  titreTauxAvancement: string;
}

const AvancementsTerritoire: FunctionComponent<AvancementsTerritoireProps> = ({
  territoireNom,
  avancementGlobal,
  avancementAnnuel,
  dateAvancementGlobal,
  dateAvancementAnnuel,
  couleurBarreDeProgression,
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
        <span className="fr-text--sm fr-ml-1v">2026</span>
      </div>
      <JaugeDeProgression
        couleur={couleurJaugeDeProgression}
        date={dateAvancementGlobal}
        libellé={territoireNom}
        pourcentage={avancementGlobal}
        taille="lg"
      />
      {process.env.NEXT_PUBLIC_FF_TA_ANNUEL === "true" && (
        <div className="fr-mt-2w">
          <p className="fr-text--xl fr-text--bold fr-mb-0 !text-dsfr-mention-grey">
            {`${avancementAnnuel?.toFixed(0) ?? "- "}%`}
          </p>
          <BarreDeProgression
            afficherTexte={false}
            bordure={null}
            fond="gris-clair"
            positionTexte="dessus"
            taille="xxs"
            valeur={avancementAnnuel}
            variante={couleurBarreDeProgression}
          />
          <p className="fr-text--xs flex justify-center fr-mb-0 fr-mt-1v">
            Avancement à échéance {jalon}
          </p>
          {dateAvancementAnnuel ? (
            <p className="fr-text--xs fr-mb-0 flex justify-center">
              {`(${formaterDate(dateAvancementAnnuel, "MM/YYYY")})`}
            </p>
          ) : null}
        </div>
      )}
    </>
  );
};

export default AvancementsTerritoire;
