import { FunctionComponent } from "react";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import AvancementsStyled from "@/components/_commons/Avancements/Avancements.styled";
import AvancementsProps from "./Avancements.interface";

const Avancements: FunctionComponent<AvancementsProps> = ({
  avancements,
  jalon,
}) => {
  return (
    <AvancementsStyled>
      <JaugeDeProgression
        couleur="bleu"
        libellé="Taux d'avancement à échéance 2026"
        pourcentage={!!avancements ? avancements.global.moyenne : null}
        taille="lg"
      />
      <div>
        <div className="jauges-statistiques">
          <JaugeDeProgression
            couleur="orange"
            libellé="Minimum"
            pourcentage={!!avancements ? avancements.global.minimum : null}
            taille="sm"
          />
          <div>
            <JaugeDeProgression
              couleur="violet"
              libellé="Médiane"
              pourcentage={!!avancements ? avancements.global.médiane : null}
              taille="sm"
            />
          </div>
          <JaugeDeProgression
            couleur="vert"
            libellé="Maximum"
            pourcentage={!!avancements ? avancements.global.maximum : null}
            taille="sm"
          />
        </div>
        <div className="fr-mt-2w">
          <p className="fr-text--xl fr-text--bold fr-mb-0 texte-gris">
            {`${(process.env.NEXT_PUBLIC_FF_TA_ANNUEL === "true" ? avancements?.annuel.moyenne?.toFixed(0) : null) ?? "- "}%`}
          </p>
          <BarreDeProgression
            afficherTexte={false}
            bordure={null}
            fond="gris-clair"
            positionTexte="dessus"
            taille="xxs"
            valeur={
              !!avancements && process.env.NEXT_PUBLIC_FF_TA_ANNUEL === "true"
                ? avancements.annuel.moyenne
                : null
            }
            variante="secondaire"
          />
          <div className="flex align-center justify-center fr-text--xs">
            <p className="fr-text--xs fr-mb-0 fr-mt-1v">
              Taux d'avancement à échéance {jalon}
            </p>
          </div>
        </div>
      </div>
    </AvancementsStyled>
  );
};

export default Avancements;
