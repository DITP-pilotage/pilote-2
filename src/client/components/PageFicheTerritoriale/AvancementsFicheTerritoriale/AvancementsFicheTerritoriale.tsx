import { FunctionComponent } from "react";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import { AvancementsFicheTerritorialeStyled } from "@/components/PageFicheTerritoriale/AvancementsFicheTerritoriale/AvancementsFicheTerritoriale.styled";

export type AvancementsStatistiques = number | null;

export default interface AvancementsProps {
  avancementGlobalTerritoire: AvancementsStatistiques;
  jalon: number;
}

export const AvancementsFicheTerritoriale: FunctionComponent<
  AvancementsProps
> = ({ avancementGlobalTerritoire, jalon }) => {
  return (
    <AvancementsFicheTerritorialeStyled>
      <JaugeDeProgression
        couleur="bleu"
        libellé={`Taux d'avancement à échéance ${jalon} du territoire`}
        pourcentage={avancementGlobalTerritoire || null}
        taille="lg"
      />
    </AvancementsFicheTerritorialeStyled>
  );
};
