import { FunctionComponent } from "react";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import AvancementsProps from "./Avancements.interface";

const Avancements: FunctionComponent<AvancementsProps> = ({
  avancements,
  jalon,
  chantiersSontArchives,
  moyenneTauxAvancementTerritoire,
}) => {
  return (
    <div className="flex gap-y-6 gap-x-10 justify-center max-[84rem]:gap-x-4 max-[992px]:basis-full max-[992px]:flex-wrap">
      <JaugeDeProgression
        couleur={chantiersSontArchives ? "gris" : "bleu"}
        libellé={`Taux d'avancement à échéance ${jalon}`}
        pourcentage={moyenneTauxAvancementTerritoire}
        taille="lg"
      />
      <div>
        <div className="flex gap-x-6 min-[992px]:max-[84rem]:gap-x-2">
          <JaugeDeProgression
            couleur={chantiersSontArchives ? "gris" : "orange"}
            libellé="Minimum"
            pourcentage={!!avancements ? avancements.minimum : null}
            taille="sm"
          />
          <div>
            <JaugeDeProgression
              couleur={chantiersSontArchives ? "gris" : "violet"}
              libellé="Médiane"
              pourcentage={!!avancements ? avancements.médiane : null}
              taille="sm"
            />
          </div>
          <JaugeDeProgression
            couleur={chantiersSontArchives ? "gris" : "vert"}
            libellé="Maximum"
            pourcentage={!!avancements ? avancements.maximum : null}
            taille="sm"
          />
        </div>
      </div>
    </div>
  );
};

export default Avancements;
