import { FunctionComponent } from "react";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import AvancementsStyled from "@/components/_commons/Avancements/Avancements.styled";
import AvancementsProps from "./Avancements.interface";

const Avancements: FunctionComponent<AvancementsProps> = ({
  avancements,
  jalon,
  chantiersSontArchives,
  moyenneTauxAvancementTerritoire,
}) => {
  return (
    <AvancementsStyled>
      <JaugeDeProgression
        couleur={chantiersSontArchives ? "gris" : "bleu"}
        libellé={`Taux d'avancement à échéance ${jalon}`}
        pourcentage={moyenneTauxAvancementTerritoire}
        taille="lg"
      />
      <div>
        <div className="jauges-statistiques">
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
    </AvancementsStyled>
  );
};

export default Avancements;
